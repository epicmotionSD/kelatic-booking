// Loyalty Module -- owned by the SERVE primary agent.
//
// Flex points (mirrors migration 060_loyalty.sql):
//   * Earn rules are JSONB on loyalty_programs -- a tenant configures
//     'appointment.completed' (salon) or 'order.paid' (commerce) without
//     forking code paths.
//   * Rewards are polymorphic across services / products.
//   * program_group_id (nullable) lets the same owner share a wallet across
//     brands later (Kelatic Hair Lounge + Vitality House) with no schema change.
//
// `awardPointsForEvent` is the webhook-facing entry point. The /api/agents/loyalty/*
// routes (balance/redeem/rewards/program) will land in a follow-up PR.

import { createAdminClient } from '@/lib/supabase/client';
import { sendReferralConversionNotice } from '@/lib/notifications/service';
import type { Business, BusinessSettings } from '@/lib/tenant';

type AdminClient = ReturnType<typeof createAdminClient>;

// ============================================================
// TYPES
// ============================================================

export type LoyaltyReason =
  | 'earn'
  | 'redeem'
  | 'adjust'
  | 'expire'
  | 'referral'
  | 'signup_bonus';

export type LoyaltyRewardType =
  | 'percent_off'
  | 'amount_off'
  | 'free_product'
  | 'free_service'
  | 'free_addon';

export interface LoyaltyEarnRule {
  trigger: 'appointment.completed' | 'order.paid' | 'client.created';
  points?: number;
  /** "dollar" => points = dollars spent. Used with order.paid. */
  per?: 'dollar';
  /** Multiply matched rules (e.g. 2x on a category). */
  multiplier?: number;
  /** Scope this rule to a product category. */
  category_id?: string;
  category_slug?: string;
  /** Award once per client lifetime (e.g. signup bonus). */
  once?: boolean;
}

export interface LoyaltyTier {
  name: string;
  threshold: number; // lifetime_points needed
  perks: string[];
}

export interface LoyaltyAwardInput {
  businessId: string;
  clientId: string;
  /** Signed delta -- positive to award, negative to adjust down / expire. */
  delta: number;
  reason: LoyaltyReason;
  appointmentId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  note?: string;
  /** auth.users.id of the admin who triggered this. */
  createdBy?: string;
}

export interface LoyaltyRedeemInput {
  businessId: string;
  clientId: string;
  rewardId: string;
  appointmentId?: string;
  orderId?: string;
  createdBy?: string;
}

export interface LoyaltyBalance {
  accountId: string;
  programId: string;
  clientId: string;
  balance: number;
  lifetimePoints: number;
  currentTier?: string | null;
  lastActivityAt?: string | null;
}

export interface LoyaltyProgram {
  id: string;
  businessId: string;
  programGroupId: string | null;
  name: string;
  currencyLabel: string;
  description: string | null;
  earnRules: { rules: LoyaltyEarnRule[] };
  tierConfig: { tiers: LoyaltyTier[] };
  pointsExpireDays: number | null;
  isActive: boolean;
  // Referrals
  referralsEnabled: boolean;
  referrerBonusPoints: number;
  refereeBonusPoints: number;
}

export interface ReferralCode {
  id: string;
  businessId: string;
  clientId: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface Referral {
  id: string;
  businessId: string;
  codeId: string | null;
  referrerClientId: string;
  refereeClientId: string;
  status: 'pending' | 'converted' | 'expired';
  refereeBonusTxId: string | null;
  referrerBonusTxId: string | null;
  appliedAt: string;
  convertedAt: string | null;
}

export interface LoyaltyReward {
  id: string;
  programId: string;
  name: string;
  description: string | null;
  costPoints: number;
  rewardType: LoyaltyRewardType;
  serviceId: string | null;
  productId: string | null;
  config: Record<string, unknown>;
  tierRequired: string | null;
  isActive: boolean;
  sortOrder: number;
}

export class LoyaltyModuleError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'LoyaltyModuleError';
    this.status = status;
  }
}

// ============================================================
// PURE HELPERS (safe to call from anywhere, no DB)
// ============================================================

/**
 * Evaluate a tenant's earn_rules JSON against a triggering event. Pure
 * function; called from the webhook helper below.
 */
export function calculateEarn(
  rules: LoyaltyEarnRule[],
  event:
    | { trigger: 'appointment.completed' }
    | { trigger: 'order.paid'; amountCents: number; categorySlugs?: string[] }
    | { trigger: 'client.created' }
): number {
  let total = 0;
  for (const rule of rules) {
    if (rule.trigger !== event.trigger) continue;

    if (event.trigger === 'order.paid') {
      // Category-scoped multiplier rule
      if (rule.category_slug) {
        if (!event.categorySlugs?.includes(rule.category_slug)) continue;
        const dollars = Math.floor(event.amountCents / 100);
        total += dollars * (rule.multiplier ?? 1);
        continue;
      }
      // Per-dollar earn
      if (rule.per === 'dollar') {
        const dollars = Math.floor(event.amountCents / 100);
        total += dollars * (rule.points ?? 1);
        continue;
      }
    }

    if (rule.points) total += rule.points;
  }
  return total;
}

/** Walk tier_config and return the highest tier the points qualify for. */
export function computeTier(
  tierConfig: unknown,
  lifetimePoints: number
): string | null {
  const tiers = ((tierConfig as { tiers?: LoyaltyTier[] })?.tiers ?? []) as LoyaltyTier[];
  let winner: LoyaltyTier | null = null;
  for (const t of tiers) {
    if (lifetimePoints >= t.threshold && (!winner || t.threshold > winner.threshold)) {
      winner = t;
    }
  }
  return winner?.name ?? null;
}

// ============================================================
// EVENT-DRIVEN EARN (called from Stripe webhook)
// ============================================================

export interface AwardPointsForEventInput {
  businessId: string;
  trigger: 'order.paid' | 'appointment.completed' | 'client.created';
  /** Required when trigger = 'order.paid'. Drives per-dollar earn. */
  amountCents?: number;
  orderId?: string;
  appointmentId?: string;
  /** Already-resolved clients.id. If set, the email/phone lookup is skipped. */
  clientId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
}

export interface AwardPointsResult {
  awarded: number;
  skipped?:
    | 'no_program'
    | 'no_client'
    | 'no_amount'
    | 'already_awarded'
    | 'zero_points';
  accountId?: string;
  newTier?: string | null;
}

/**
 * Resolve program + client, idempotently append an earn ledger row, and bump
 * the account balance + tier. Safe to call from a Stripe webhook (idempotent
 * on order_id / appointment_id), from cron, or from an admin tool.
 */
export async function awardPointsForEvent(
  supabase: AdminClient,
  input: AwardPointsForEventInput
): Promise<AwardPointsResult> {
  // 1. Active program for this tenant?
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id, earn_rules, tier_config, referrals_enabled')
    .eq('business_id', input.businessId)
    .eq('is_active', true)
    .maybeSingle();
  if (!program) return { awarded: 0, skipped: 'no_program' };

  const rules =
    ((program.earn_rules as { rules?: LoyaltyEarnRule[] })?.rules ?? []) as LoyaltyEarnRule[];

  // 2. Resolve to a clients row (loyalty anchors there, not profiles)
  const clientId = await resolveClientId(supabase, input);
  if (!clientId) return { awarded: 0, skipped: 'no_client' };

  // 3. Find / create the loyalty account
  const accountId = await ensureLoyaltyAccount(supabase, program.id, clientId);

  // 4. Idempotency: don't double-earn on webhook retries
  if (input.orderId || input.appointmentId) {
    const sourceCol = input.orderId ? 'order_id' : 'appointment_id';
    const sourceId = input.orderId ?? input.appointmentId!;
    const { data: existing } = await supabase
      .from('loyalty_transactions')
      .select('id')
      .eq('account_id', accountId)
      .eq('reason', 'earn')
      .eq(sourceCol, sourceId)
      .maybeSingle();
    if (existing) return { awarded: 0, skipped: 'already_awarded', accountId };
  }

  // 5. Build event for the calculator
  let event:
    | { trigger: 'appointment.completed' }
    | { trigger: 'order.paid'; amountCents: number; categorySlugs?: string[] }
    | { trigger: 'client.created' };

  if (input.trigger === 'order.paid') {
    if (!input.amountCents) return { awarded: 0, skipped: 'no_amount', accountId };
    const categorySlugs = input.orderId
      ? await fetchOrderCategorySlugs(supabase, input.orderId)
      : [];
    event = { trigger: 'order.paid', amountCents: input.amountCents, categorySlugs };
  } else {
    event = { trigger: input.trigger };
  }

  const points = calculateEarn(rules, event);
  if (points <= 0) return { awarded: 0, skipped: 'zero_points', accountId };

  // 6. Append ledger row
  const { error: txError } = await supabase.from('loyalty_transactions').insert({
    account_id: accountId,
    program_id: program.id,
    delta: points,
    reason: 'earn',
    appointment_id: input.appointmentId ?? null,
    order_id: input.orderId ?? null,
    metadata: { trigger: input.trigger, ...(input.metadata ?? {}) },
  });
  if (txError) {
    throw new LoyaltyModuleError(
      `Failed to record loyalty earn: ${txError.message}`,
      500
    );
  }

  // 7. Bump denormalized totals + recompute tier
  const { data: acc } = await supabase
    .from('loyalty_accounts')
    .select('balance, lifetime_points')
    .eq('id', accountId)
    .single();
  const newLifetime = (acc?.lifetime_points ?? 0) + points;
  const newBalance = (acc?.balance ?? 0) + points;
  const newTier = computeTier(program.tier_config, newLifetime);

  await supabase
    .from('loyalty_accounts')
    .update({
      balance: newBalance,
      lifetime_points: newLifetime,
      current_tier: newTier,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', accountId);

  // 8. Auto-issue a referral code so this customer can start sharing
  // immediately. Idempotent: getOrCreateReferralCode returns existing.
  if (program.referrals_enabled) {
    try {
      await getOrCreateReferralCode(supabase, input.businessId, clientId);
    } catch (err) {
      console.error('Auto-issue referral code failed:', err);
    }
  }

  // 9. If this client was referred, mark the referral converted and pay
  // the referrer. Defined as a separate call (not inside the same tx)
  // because failures here shouldn't unwind the earn -- the loyalty earn
  // is correct on its own; the referral conversion is best-effort.
  try {
    await triggerReferralConversion(supabase, input.businessId, clientId);
  } catch (err) {
    console.error('Referral conversion failed:', err);
  }

  return { awarded: points, accountId, newTier };
}

async function resolveClientId(
  supabase: AdminClient,
  input: AwardPointsForEventInput
): Promise<string | null> {
  // Trust an explicit clients.id if given
  if (input.clientId) return input.clientId;

  if (input.customerEmail) {
    const email = input.customerEmail.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', input.businessId)
      .eq('email', email)
      .maybeSingle();
    if (existing) return existing.id;

    // Create on-the-fly so commerce guests can still earn -- they get a
    // proper client record the moment they pay.
    const fullName = (input.customerName ?? email.split('@')[0]).trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const { data: created, error } = await supabase
      .from('clients')
      .insert({
        business_id: input.businessId,
        first_name: firstName || 'Guest',
        last_name: rest.join(' ') || '',
        email,
        phone: input.customerPhone ?? null,
        source: 'loyalty_auto',
      })
      .select('id')
      .single();
    if (error) return null;
    return created?.id ?? null;
  }

  if (input.customerPhone) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', input.businessId)
      .eq('phone', input.customerPhone)
      .maybeSingle();
    return existing?.id ?? null;
  }

  return null;
}

async function ensureLoyaltyAccount(
  supabase: AdminClient,
  programId: string,
  clientId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('loyalty_accounts')
    .select('id')
    .eq('program_id', programId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('loyalty_accounts')
    .insert({ program_id: programId, client_id: clientId })
    .select('id')
    .single();
  if (error || !created) {
    throw new LoyaltyModuleError(
      `Failed to create loyalty account: ${error?.message ?? 'unknown'}`,
      500
    );
  }
  return created.id;
}

async function fetchOrderCategorySlugs(
  supabase: AdminClient,
  orderId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('order_items')
    .select('products:product_id(category:category_id(slug))')
    .eq('order_id', orderId);
  const slugs = new Set<string>();
  for (const row of (data ?? []) as Array<{
    products?: { category?: { slug?: string } | null } | null;
  }>) {
    const slug = row.products?.category?.slug;
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

// ============================================================
// SHARED LOOKUPS
// ============================================================

/** Active program for a tenant, hydrated to the typed shape. */
export async function getProgramForBusiness(
  supabase: AdminClient,
  businessId: string
): Promise<LoyaltyProgram | null> {
  const { data } = await supabase
    .from('loyalty_programs')
    .select(
      'id, business_id, program_group_id, name, currency_label, description, earn_rules, tier_config, points_expire_days, is_active, referrals_enabled, referrer_bonus_points, referee_bonus_points'
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    businessId: data.business_id,
    programGroupId: data.program_group_id ?? null,
    name: data.name,
    currencyLabel: data.currency_label,
    description: data.description ?? null,
    earnRules: (data.earn_rules as { rules: LoyaltyEarnRule[] }) ?? { rules: [] },
    tierConfig: (data.tier_config as { tiers: LoyaltyTier[] }) ?? { tiers: [] },
    pointsExpireDays: data.points_expire_days ?? null,
    isActive: data.is_active,
    referralsEnabled: data.referrals_enabled ?? false,
    referrerBonusPoints: data.referrer_bonus_points ?? 0,
    refereeBonusPoints: data.referee_bonus_points ?? 0,
  };
}

// ============================================================
// BALANCE
// ============================================================

export async function getLoyaltyBalance(
  supabase: AdminClient,
  businessId: string,
  clientId: string
): Promise<LoyaltyBalance | null> {
  const program = await getProgramForBusiness(supabase, businessId);
  if (!program) return null;

  const { data: account } = await supabase
    .from('loyalty_accounts')
    .select('id, balance, lifetime_points, current_tier, last_activity_at')
    .eq('program_id', program.id)
    .eq('client_id', clientId)
    .maybeSingle();

  if (!account) {
    return {
      accountId: '',
      programId: program.id,
      clientId,
      balance: 0,
      lifetimePoints: 0,
      currentTier: null,
      lastActivityAt: null,
    };
  }

  return {
    accountId: account.id,
    programId: program.id,
    clientId,
    balance: account.balance,
    lifetimePoints: account.lifetime_points,
    currentTier: account.current_tier ?? null,
    lastActivityAt: account.last_activity_at ?? null,
  };
}

// ============================================================
// MANUAL AWARD (admin)
// ============================================================

/**
 * Apply a manual signed delta to a client's loyalty account. Used for
 * referrals, recovery comps, expirations, signup bonuses, etc. -- anywhere
 * the trigger isn't a paid Stripe event.
 */
export async function awardPoints(
  supabase: AdminClient,
  input: LoyaltyAwardInput
): Promise<AwardPointsResult> {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new LoyaltyModuleError('delta must be a non-zero integer', 400);
  }

  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) return { awarded: 0, skipped: 'no_program' };

  const accountId = await ensureLoyaltyAccount(supabase, program.id, input.clientId);

  const { error: txError } = await supabase.from('loyalty_transactions').insert({
    account_id: accountId,
    program_id: program.id,
    delta: input.delta,
    reason: input.reason,
    appointment_id: input.appointmentId ?? null,
    order_id: input.orderId ?? null,
    metadata: input.metadata ?? {},
    note: input.note ?? null,
    created_by: input.createdBy ?? null,
  });
  if (txError) {
    throw new LoyaltyModuleError(`Failed to record award: ${txError.message}`, 500);
  }

  const { data: acc } = await supabase
    .from('loyalty_accounts')
    .select('balance, lifetime_points')
    .eq('id', accountId)
    .single();
  const newLifetime =
    (acc?.lifetime_points ?? 0) + (input.delta > 0 ? input.delta : 0);
  const newBalance = (acc?.balance ?? 0) + input.delta;
  const newTier = computeTier(program.tierConfig, newLifetime);

  await supabase
    .from('loyalty_accounts')
    .update({
      balance: newBalance,
      lifetime_points: newLifetime,
      current_tier: newTier,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', accountId);

  // Auto-issue referral code so the customer can share immediately.
  if (program.referralsEnabled) {
    try {
      await getOrCreateReferralCode(supabase, input.businessId, input.clientId);
    } catch (err) {
      console.error('Auto-issue referral code failed:', err);
    }
  }

  return { awarded: input.delta, accountId, newTier };
}

// ============================================================
// REDEEM
// ============================================================

export interface RedeemRewardResult {
  accountId: string;
  newBalance: number;
  rewardId: string;
  rewardType: LoyaltyRewardType;
  rewardConfig: Record<string, unknown>;
  serviceId: string | null;
  productId: string | null;
  costPoints: number;
}

export async function redeemReward(
  supabase: AdminClient,
  input: LoyaltyRedeemInput
): Promise<RedeemRewardResult> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) {
    throw new LoyaltyModuleError('No active loyalty program for this business', 404);
  }

  const { data: reward } = await supabase
    .from('loyalty_rewards')
    .select(
      'id, program_id, name, cost_points, reward_type, service_id, product_id, config, tier_required, is_active'
    )
    .eq('id', input.rewardId)
    .eq('program_id', program.id)
    .maybeSingle();
  if (!reward) throw new LoyaltyModuleError('Reward not found', 404);
  if (!reward.is_active) throw new LoyaltyModuleError('Reward is not active', 400);

  const { data: account } = await supabase
    .from('loyalty_accounts')
    .select('id, balance, lifetime_points, current_tier')
    .eq('program_id', program.id)
    .eq('client_id', input.clientId)
    .maybeSingle();
  if (!account) throw new LoyaltyModuleError('Client has no loyalty account', 404);

  if (account.balance < reward.cost_points) {
    throw new LoyaltyModuleError(
      `Insufficient balance: have ${account.balance}, need ${reward.cost_points}`,
      400
    );
  }

  if (reward.tier_required) {
    if (!account.current_tier || account.current_tier !== reward.tier_required) {
      throw new LoyaltyModuleError(
        `Reward requires ${reward.tier_required} tier`,
        403
      );
    }
  }

  const { error: txError } = await supabase.from('loyalty_transactions').insert({
    account_id: account.id,
    program_id: program.id,
    delta: -reward.cost_points,
    reason: 'redeem',
    appointment_id: input.appointmentId ?? null,
    order_id: input.orderId ?? null,
    reward_id: reward.id,
    metadata: { reward_type: reward.reward_type },
    created_by: input.createdBy ?? null,
  });
  if (txError) {
    throw new LoyaltyModuleError(`Failed to record redemption: ${txError.message}`, 500);
  }

  const newBalance = account.balance - reward.cost_points;
  await supabase
    .from('loyalty_accounts')
    .update({
      balance: newBalance,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  return {
    accountId: account.id,
    newBalance,
    rewardId: reward.id,
    rewardType: reward.reward_type as LoyaltyRewardType,
    rewardConfig: (reward.config as Record<string, unknown>) ?? {},
    serviceId: reward.service_id ?? null,
    productId: reward.product_id ?? null,
    costPoints: reward.cost_points,
  };
}

// ============================================================
// REWARDS CATALOG
// ============================================================

export async function listRewards(
  supabase: AdminClient,
  businessId: string,
  options: { activeOnly?: boolean } = {}
): Promise<LoyaltyReward[]> {
  const program = await getProgramForBusiness(supabase, businessId);
  if (!program) return [];

  let query = supabase
    .from('loyalty_rewards')
    .select(
      'id, program_id, name, description, cost_points, reward_type, service_id, product_id, config, tier_required, is_active, sort_order'
    )
    .eq('program_id', program.id)
    .order('sort_order', { ascending: true });

  if (options.activeOnly) query = query.eq('is_active', true);

  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    programId: r.program_id,
    name: r.name,
    description: r.description ?? null,
    costPoints: r.cost_points,
    rewardType: r.reward_type as LoyaltyRewardType,
    serviceId: r.service_id ?? null,
    productId: r.product_id ?? null,
    config: (r.config as Record<string, unknown>) ?? {},
    tierRequired: r.tier_required ?? null,
    isActive: r.is_active,
    sortOrder: r.sort_order ?? 0,
  }));
}

// ============================================================
// MEMBERS (admin)
// ============================================================

export interface LoyaltyMember {
  accountId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  balance: number;
  lifetimePoints: number;
  currentTier: string | null;
  lastActivityAt: string | null;
  enrolledAt: string;
}

export async function listMembers(
  supabase: AdminClient,
  businessId: string,
  options: { limit?: number; search?: string } = {}
): Promise<LoyaltyMember[]> {
  const program = await getProgramForBusiness(supabase, businessId);
  if (!program) return [];

  let query = supabase
    .from('loyalty_accounts')
    .select(
      'id, client_id, balance, lifetime_points, current_tier, last_activity_at, enrolled_at, clients!inner(first_name, last_name, email, phone)'
    )
    .eq('program_id', program.id)
    .order('lifetime_points', { ascending: false })
    .limit(options.limit ?? 100);

  // Search by client name / email when provided
  if (options.search) {
    const q = options.search.trim();
    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`,
        { foreignTable: 'clients' }
      );
    }
  }

  const { data } = await query;
  // Supabase's foreign-join typings hand back `clients` as an array even
  // when the FK is to-one, so accept both shapes and normalize.
  type Row = {
    id: string;
    client_id: string;
    balance: number;
    lifetime_points: number;
    current_tier: string | null;
    last_activity_at: string | null;
    enrolled_at: string;
    clients:
      | { first_name: string; last_name: string; email: string | null; phone: string | null }
      | Array<{ first_name: string; last_name: string; email: string | null; phone: string | null }>
      | null;
  };
  return ((data ?? []) as unknown as Row[]).map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    return {
      accountId: row.id,
      clientId: row.client_id,
      firstName: client?.first_name ?? '',
      lastName: client?.last_name ?? '',
      email: client?.email ?? null,
      phone: client?.phone ?? null,
      balance: row.balance,
      lifetimePoints: row.lifetime_points,
      currentTier: row.current_tier,
      lastActivityAt: row.last_activity_at,
      enrolledAt: row.enrolled_at,
    };
  });
}

// ============================================================
// PROGRAM UPDATE (admin)
// ============================================================

export interface UpdateProgramInput {
  businessId: string;
  name?: string;
  currencyLabel?: string;
  description?: string | null;
  earnRules?: { rules: LoyaltyEarnRule[] };
  tierConfig?: { tiers: LoyaltyTier[] };
  pointsExpireDays?: number | null;
  isActive?: boolean;
  referralsEnabled?: boolean;
  referrerBonusPoints?: number;
  refereeBonusPoints?: number;
}

export async function updateProgram(
  supabase: AdminClient,
  input: UpdateProgramInput
): Promise<LoyaltyProgram> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) {
    throw new LoyaltyModuleError('No active loyalty program for this business', 404);
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.currencyLabel !== undefined) patch.currency_label = input.currencyLabel;
  if (input.description !== undefined) patch.description = input.description;
  if (input.earnRules !== undefined) patch.earn_rules = input.earnRules;
  if (input.tierConfig !== undefined) patch.tier_config = input.tierConfig;
  if (input.pointsExpireDays !== undefined)
    patch.points_expire_days = input.pointsExpireDays;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.referralsEnabled !== undefined)
    patch.referrals_enabled = input.referralsEnabled;
  if (input.referrerBonusPoints !== undefined)
    patch.referrer_bonus_points = input.referrerBonusPoints;
  if (input.refereeBonusPoints !== undefined)
    patch.referee_bonus_points = input.refereeBonusPoints;

  const { error } = await supabase
    .from('loyalty_programs')
    .update(patch)
    .eq('id', program.id);
  if (error) {
    throw new LoyaltyModuleError(`Failed to update program: ${error.message}`, 500);
  }

  const refreshed = await getProgramForBusiness(supabase, input.businessId);
  if (!refreshed) {
    throw new LoyaltyModuleError('Program disappeared after update', 500);
  }
  return refreshed;
}

// ============================================================
// REWARDS CRUD (admin)
// ============================================================

export interface CreateRewardInput {
  businessId: string;
  name: string;
  description?: string | null;
  costPoints: number;
  rewardType: LoyaltyRewardType;
  serviceId?: string | null;
  productId?: string | null;
  config?: Record<string, unknown>;
  tierRequired?: string | null;
  sortOrder?: number;
}

export async function createReward(
  supabase: AdminClient,
  input: CreateRewardInput
): Promise<LoyaltyReward> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) {
    throw new LoyaltyModuleError('No active loyalty program for this business', 404);
  }
  if (input.serviceId && input.productId) {
    throw new LoyaltyModuleError(
      'Reward can target a service OR a product, not both',
      400
    );
  }
  if (!Number.isInteger(input.costPoints) || input.costPoints < 0) {
    throw new LoyaltyModuleError('costPoints must be a non-negative integer', 400);
  }

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .insert({
      program_id: program.id,
      name: input.name,
      description: input.description ?? null,
      cost_points: input.costPoints,
      reward_type: input.rewardType,
      service_id: input.serviceId ?? null,
      product_id: input.productId ?? null,
      config: input.config ?? {},
      tier_required: input.tierRequired ?? null,
      sort_order: input.sortOrder ?? 0,
      is_active: true,
    })
    .select(
      'id, program_id, name, description, cost_points, reward_type, service_id, product_id, config, tier_required, is_active, sort_order'
    )
    .single();
  if (error || !data) {
    throw new LoyaltyModuleError(
      `Failed to create reward: ${error?.message ?? 'unknown'}`,
      500
    );
  }
  return hydrateReward(data);
}

export interface UpdateRewardInput {
  businessId: string;
  rewardId: string;
  name?: string;
  description?: string | null;
  costPoints?: number;
  rewardType?: LoyaltyRewardType;
  serviceId?: string | null;
  productId?: string | null;
  config?: Record<string, unknown>;
  tierRequired?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export async function updateReward(
  supabase: AdminClient,
  input: UpdateRewardInput
): Promise<LoyaltyReward> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) {
    throw new LoyaltyModuleError('No active loyalty program for this business', 404);
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.costPoints !== undefined) patch.cost_points = input.costPoints;
  if (input.rewardType !== undefined) patch.reward_type = input.rewardType;
  if (input.serviceId !== undefined) patch.service_id = input.serviceId;
  if (input.productId !== undefined) patch.product_id = input.productId;
  if (input.config !== undefined) patch.config = input.config;
  if (input.tierRequired !== undefined) patch.tier_required = input.tierRequired;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .update(patch)
    .eq('id', input.rewardId)
    .eq('program_id', program.id)
    .select(
      'id, program_id, name, description, cost_points, reward_type, service_id, product_id, config, tier_required, is_active, sort_order'
    )
    .single();
  if (error || !data) {
    throw new LoyaltyModuleError(
      `Failed to update reward: ${error?.message ?? 'not found'}`,
      404
    );
  }
  return hydrateReward(data);
}

export async function deleteReward(
  supabase: AdminClient,
  businessId: string,
  rewardId: string
): Promise<void> {
  const program = await getProgramForBusiness(supabase, businessId);
  if (!program) {
    throw new LoyaltyModuleError('No active loyalty program for this business', 404);
  }
  const { error } = await supabase
    .from('loyalty_rewards')
    .delete()
    .eq('id', rewardId)
    .eq('program_id', program.id);
  if (error) {
    throw new LoyaltyModuleError(`Failed to delete reward: ${error.message}`, 500);
  }
}

function hydrateReward(r: {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  cost_points: number;
  reward_type: string;
  service_id: string | null;
  product_id: string | null;
  config: unknown;
  tier_required: string | null;
  is_active: boolean;
  sort_order: number | null;
}): LoyaltyReward {
  return {
    id: r.id,
    programId: r.program_id,
    name: r.name,
    description: r.description,
    costPoints: r.cost_points,
    rewardType: r.reward_type as LoyaltyRewardType,
    serviceId: r.service_id,
    productId: r.product_id,
    config: (r.config as Record<string, unknown>) ?? {},
    tierRequired: r.tier_required,
    isActive: r.is_active,
    sortOrder: r.sort_order ?? 0,
  };
}

// ============================================================
// REFERRALS
// ============================================================

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const CODE_LENGTH = 8;

function generateCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Fetch a client's referral code, generating one on first call. Codes are
 * stable per (business, client) so the customer can share the same one
 * forever.
 */
export async function getOrCreateReferralCode(
  supabase: AdminClient,
  businessId: string,
  clientId: string
): Promise<ReferralCode> {
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('id, business_id, client_id, code, is_active, created_at')
    .eq('business_id', businessId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (existing) return hydrateReferralCode(existing);

  // Retry on collision (extremely rare given the alphabet/length, but the
  // unique constraint will let us know quickly if it happens)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ business_id: businessId, client_id: clientId, code })
      .select('id, business_id, client_id, code, is_active, created_at')
      .single();
    if (data) return hydrateReferralCode(data);
    if (error && !error.message.toLowerCase().includes('duplicate')) {
      throw new LoyaltyModuleError(
        `Failed to issue referral code: ${error.message}`,
        500
      );
    }
  }
  throw new LoyaltyModuleError(
    'Failed to issue referral code after retries',
    500
  );
}

function hydrateReferralCode(r: {
  id: string;
  business_id: string;
  client_id: string;
  code: string;
  is_active: boolean;
  created_at: string;
}): ReferralCode {
  return {
    id: r.id,
    businessId: r.business_id,
    clientId: r.client_id,
    code: r.code,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export interface ApplyReferralCodeInput {
  businessId: string;
  code: string;
  refereeClientId: string;
}

export interface ApplyReferralCodeResult {
  referralId: string;
  referrerClientId: string;
  refereeBonusAwarded: number;
}

/**
 * Apply a referral code at signup (or first checkout). Creates a `pending`
 * referral and immediately awards the referee's signup bonus. The
 * referrer's reward fires later in `triggerReferralConversion` when the
 * referee earns from a real paid event.
 */
export async function applyReferralCode(
  supabase: AdminClient,
  input: ApplyReferralCodeInput
): Promise<ApplyReferralCodeResult> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) throw new LoyaltyModuleError('No active loyalty program', 404);
  if (!program.referralsEnabled) {
    throw new LoyaltyModuleError('Referrals are disabled for this program', 400);
  }

  const normalized = input.code.trim().toUpperCase();
  const { data: codeRow } = await supabase
    .from('referral_codes')
    .select('id, client_id, is_active')
    .eq('business_id', input.businessId)
    .eq('code', normalized)
    .maybeSingle();
  if (!codeRow || !codeRow.is_active) {
    throw new LoyaltyModuleError('Invalid referral code', 404);
  }
  if (codeRow.client_id === input.refereeClientId) {
    throw new LoyaltyModuleError('Cannot refer yourself', 400);
  }

  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('business_id', input.businessId)
    .eq('referee_client_id', input.refereeClientId)
    .maybeSingle();
  if (existingReferral) {
    throw new LoyaltyModuleError('This client has already been referred', 409);
  }

  // Award the referee's signup bonus first so we can link the ledger row
  let refereeBonusTxId: string | null = null;
  if (program.refereeBonusPoints > 0) {
    const awardResult = await awardPoints(supabase, {
      businessId: input.businessId,
      clientId: input.refereeClientId,
      delta: program.refereeBonusPoints,
      reason: 'referral',
      metadata: { side: 'referee', code: normalized },
      note: `Referral signup bonus (code ${normalized})`,
    });
    if (awardResult.accountId) {
      const { data: tx } = await supabase
        .from('loyalty_transactions')
        .select('id')
        .eq('account_id', awardResult.accountId)
        .eq('reason', 'referral')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      refereeBonusTxId = tx?.id ?? null;
    }
  }

  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      business_id: input.businessId,
      code_id: codeRow.id,
      referrer_client_id: codeRow.client_id,
      referee_client_id: input.refereeClientId,
      referee_bonus_tx_id: refereeBonusTxId,
      status: 'pending',
    })
    .select('id, referrer_client_id')
    .single();
  if (error || !referral) {
    throw new LoyaltyModuleError(
      `Failed to create referral: ${error?.message ?? 'unknown'}`,
      500
    );
  }

  return {
    referralId: referral.id,
    referrerClientId: referral.referrer_client_id,
    refereeBonusAwarded: program.refereeBonusPoints,
  };
}

/**
 * Called after any successful earn for a client. If that client has a
 * pending referral (i.e. they were referred and just paid for the first
 * time), mark it converted and award the referrer.
 *
 * Idempotent: a converted referral is never re-converted.
 */
export async function triggerReferralConversion(
  supabase: AdminClient,
  businessId: string,
  refereeClientId: string
): Promise<{ converted: boolean; referrerAwarded?: number }> {
  const program = await getProgramForBusiness(supabase, businessId);
  if (!program || !program.referralsEnabled) return { converted: false };

  const { data: pending } = await supabase
    .from('referrals')
    .select('id, referrer_client_id')
    .eq('business_id', businessId)
    .eq('referee_client_id', refereeClientId)
    .eq('status', 'pending')
    .maybeSingle();
  if (!pending) return { converted: false };

  // Award the referrer first so we can capture the tx id
  let referrerBonusTxId: string | null = null;
  if (program.referrerBonusPoints > 0) {
    const awardResult = await awardPoints(supabase, {
      businessId,
      clientId: pending.referrer_client_id,
      delta: program.referrerBonusPoints,
      reason: 'referral',
      metadata: { side: 'referrer', referee_client_id: refereeClientId },
      note: 'Referral conversion bonus',
    });
    if (awardResult.accountId) {
      const { data: tx } = await supabase
        .from('loyalty_transactions')
        .select('id')
        .eq('account_id', awardResult.accountId)
        .eq('reason', 'referral')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      referrerBonusTxId = tx?.id ?? null;
    }
  }

  await supabase
    .from('referrals')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
      referrer_bonus_tx_id: referrerBonusTxId,
    })
    .eq('id', pending.id);

  // Best-effort: notify the referrer. Failures here don't unwind the
  // conversion -- the points have already been credited correctly.
  try {
    await notifyReferrerOfConversion(supabase, {
      businessId,
      referrerClientId: pending.referrer_client_id,
      refereeClientId: refereeClientId,
      pointsAwarded: program.referrerBonusPoints,
      currencyLabel: program.currencyLabel,
    });
  } catch (err) {
    console.error('Referral conversion notice failed:', err);
  }

  return { converted: true, referrerAwarded: program.referrerBonusPoints };
}

async function notifyReferrerOfConversion(
  supabase: AdminClient,
  args: {
    businessId: string;
    referrerClientId: string;
    refereeClientId: string;
    pointsAwarded: number;
    currencyLabel: string;
  }
): Promise<void> {
  if (args.pointsAwarded <= 0) return; // nothing to celebrate

  const [businessRes, settingsRes, referrerRes, refereeRes, balanceRes] =
    await Promise.all([
      supabase.from('businesses').select('*').eq('id', args.businessId).maybeSingle(),
      supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', args.businessId)
        .maybeSingle(),
      supabase
        .from('clients')
        .select('first_name, last_name, email, phone')
        .eq('id', args.referrerClientId)
        .maybeSingle(),
      supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('id', args.refereeClientId)
        .maybeSingle(),
      // Re-fetch balance so the email shows the post-award total
      getLoyaltyBalance(supabase, args.businessId, args.referrerClientId),
    ]);

  const business = businessRes.data as Business | null;
  if (!business) return;
  const settings = (settingsRes.data ?? null) as BusinessSettings | null;
  const referrer = referrerRes.data;
  const referee = refereeRes.data;

  const referrerName =
    [referrer?.first_name, referrer?.last_name].filter(Boolean).join(' ') || 'there';
  const refereeName =
    [referee?.first_name, referee?.last_name].filter(Boolean).join(' ') || 'Your friend';

  await sendReferralConversionNotice(
    {
      referrerEmail: referrer?.email ?? null,
      referrerPhone: referrer?.phone ?? null,
      referrerName,
      refereeName,
      pointsAwarded: args.pointsAwarded,
      currencyLabel: args.currencyLabel,
      newBalance: balanceRes?.balance ?? args.pointsAwarded,
    },
    { business, settings }
  );
}

export interface ListReferralsOptions {
  status?: 'pending' | 'converted' | 'expired';
  limit?: number;
}

export interface ReferralWithClients extends Referral {
  referrerName: string;
  referrerEmail: string | null;
  refereeName: string;
  refereeEmail: string | null;
}

export async function listReferrals(
  supabase: AdminClient,
  businessId: string,
  options: ListReferralsOptions = {}
): Promise<ReferralWithClients[]> {
  let query = supabase
    .from('referrals')
    .select(
      'id, business_id, code_id, referrer_client_id, referee_client_id, status, referee_bonus_tx_id, referrer_bonus_tx_id, applied_at, converted_at, referrer:referrer_client_id(first_name,last_name,email), referee:referee_client_id(first_name,last_name,email)'
    )
    .eq('business_id', businessId)
    .order('applied_at', { ascending: false })
    .limit(options.limit ?? 50);

  if (options.status) query = query.eq('status', options.status);

  const { data } = await query;
  type ClientRow = { first_name: string; last_name: string; email: string | null };
  type Row = {
    id: string;
    business_id: string;
    code_id: string | null;
    referrer_client_id: string;
    referee_client_id: string;
    status: 'pending' | 'converted' | 'expired';
    referee_bonus_tx_id: string | null;
    referrer_bonus_tx_id: string | null;
    applied_at: string;
    converted_at: string | null;
    referrer: ClientRow | ClientRow[] | null;
    referee: ClientRow | ClientRow[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((row) => {
    const referrer = Array.isArray(row.referrer) ? row.referrer[0] : row.referrer;
    const referee = Array.isArray(row.referee) ? row.referee[0] : row.referee;
    const fullName = (c: ClientRow | null | undefined) =>
      [c?.first_name, c?.last_name].filter(Boolean).join(' ') || '—';
    return {
      id: row.id,
      businessId: row.business_id,
      codeId: row.code_id,
      referrerClientId: row.referrer_client_id,
      refereeClientId: row.referee_client_id,
      status: row.status,
      refereeBonusTxId: row.referee_bonus_tx_id,
      referrerBonusTxId: row.referrer_bonus_tx_id,
      appliedAt: row.applied_at,
      convertedAt: row.converted_at,
      referrerName: fullName(referrer),
      referrerEmail: referrer?.email ?? null,
      refereeName: fullName(referee),
      refereeEmail: referee?.email ?? null,
    };
  });
}

// ============================================================
// REDEMPTION DISCOUNT (commerce checkout)
// ============================================================

export interface RewardDiscount {
  /** Discount applied to the order subtotal, in cents. 0 = not applicable. */
  discountCents: number;
  /** Why the discount is 0 (so the UI can explain "min $25 spend" etc.). */
  reason?:
    | 'below_min_spend'
    | 'unsupported_at_checkout'
    | 'inactive_reward'
    | 'zero_value';
}

/**
 * Compute the cents to discount for a given reward against a cart subtotal.
 * Pure function -- callable from the preview endpoint and the checkout
 * endpoint so they always agree on the math.
 *
 * v1 supports only whole-order discounts (percent_off / amount_off). The
 * line-item rewards (free_product / free_service / free_addon) need cart
 * manipulation and will land in a later iteration.
 */
export function computeRewardDiscount(
  reward: Pick<LoyaltyReward, 'rewardType' | 'config' | 'isActive'>,
  subtotalCents: number
): RewardDiscount {
  if (!reward.isActive) return { discountCents: 0, reason: 'inactive_reward' };
  if (subtotalCents <= 0) return { discountCents: 0, reason: 'zero_value' };

  const config = reward.config ?? {};

  if (reward.rewardType === 'percent_off') {
    const percent = Number(config.percent) || 0;
    const maxDiscount = Number(config.max_discount_cents) || Infinity;
    const raw = Math.floor((subtotalCents * percent) / 100);
    const capped = Math.min(raw, maxDiscount, subtotalCents);
    return { discountCents: Math.max(0, capped) };
  }

  if (reward.rewardType === 'amount_off') {
    const amount = Number(config.amount_cents) || 0;
    const minSpend = Number(config.min_spend_cents) || 0;
    if (subtotalCents < minSpend) {
      return { discountCents: 0, reason: 'below_min_spend' };
    }
    return { discountCents: Math.min(amount, subtotalCents) };
  }

  // free_product / free_service / free_addon need cart-line manipulation.
  return { discountCents: 0, reason: 'unsupported_at_checkout' };
}

export interface RedemptionPreviewInput {
  businessId: string;
  customerEmail: string;
  subtotalCents: number;
}

export interface EligibleReward extends LoyaltyReward {
  discountPreviewCents: number;
  reason?: RewardDiscount['reason'];
}

export interface RedemptionPreview {
  customerView: {
    clientId: string;
    balance: number;
    lifetimePoints: number;
    currentTier: string | null;
    currencyLabel: string;
  } | null;
  eligibleRewards: EligibleReward[];
}

/**
 * Look up a customer's account by email and return the rewards they could
 * redeem against the given subtotal. Public-safe: returns null/empty for
 * unknown emails -- doesn't leak whether someone exists in another tenant.
 */
export async function previewRedemption(
  supabase: AdminClient,
  input: RedemptionPreviewInput
): Promise<RedemptionPreview> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) return { customerView: null, eligibleRewards: [] };

  const clientId = await findClientByEmail(
    supabase,
    input.businessId,
    input.customerEmail
  );
  if (!clientId) return { customerView: null, eligibleRewards: [] };

  const balance = await getLoyaltyBalance(supabase, input.businessId, clientId);
  if (!balance) return { customerView: null, eligibleRewards: [] };

  const allRewards = await listRewards(supabase, input.businessId, {
    activeOnly: true,
  });

  const eligibleRewards: EligibleReward[] = allRewards
    .filter((r) => r.costPoints <= balance.balance)
    .filter((r) => !r.tierRequired || r.tierRequired === balance.currentTier)
    .map((r) => {
      const discount = computeRewardDiscount(r, input.subtotalCents);
      return { ...r, discountPreviewCents: discount.discountCents, reason: discount.reason };
    });

  return {
    customerView: {
      clientId,
      balance: balance.balance,
      lifetimePoints: balance.lifetimePoints,
      currentTier: balance.currentTier ?? null,
      currencyLabel: program.currencyLabel,
    },
    eligibleRewards,
  };
}

// ============================================================
// REFERRAL LEADERBOARD (admin)
// ============================================================

export interface ReferralLeader {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  totalReferrals: number;
  convertedReferrals: number;
  pointsEarned: number;
  currentTier: string | null;
}

/**
 * Aggregate the referrals table by referrer to produce a leaderboard.
 * Sorted by conversions desc, then total referrals desc, then most-recent
 * conversion. Volume here is low (referrals are infrequent), so aggregating
 * in JS is fine and lets us avoid a custom view.
 */
export async function listReferralLeaders(
  supabase: AdminClient,
  businessId: string,
  options: { limit?: number } = {}
): Promise<ReferralLeader[]> {
  const { data: rows } = await supabase
    .from('referrals')
    .select(
      'referrer_client_id, status, referrer_bonus_tx_id, converted_at, clients:referrer_client_id(first_name,last_name,email)'
    )
    .eq('business_id', businessId);
  if (!rows || rows.length === 0) return [];

  type ClientRow = { first_name: string; last_name: string; email: string | null };
  type Row = {
    referrer_client_id: string;
    status: 'pending' | 'converted' | 'expired';
    referrer_bonus_tx_id: string | null;
    converted_at: string | null;
    clients: ClientRow | ClientRow[] | null;
  };

  // Sum awarded points for converted referrals via the ledger rows
  const txIds = (rows as unknown as Row[])
    .map((r) => r.referrer_bonus_tx_id)
    .filter((id): id is string => !!id);
  const txPoints = new Map<string, number>();
  if (txIds.length > 0) {
    const { data: txs } = await supabase
      .from('loyalty_transactions')
      .select('id, delta')
      .in('id', txIds);
    for (const t of (txs ?? []) as Array<{ id: string; delta: number }>) {
      txPoints.set(t.id, t.delta);
    }
  }

  // Pull tiers for referrers that show up in the leaderboard
  const program = await getProgramForBusiness(supabase, businessId);
  const tierByClient = new Map<string, string | null>();
  if (program) {
    const referrerIds = [...new Set((rows as unknown as Row[]).map((r) => r.referrer_client_id))];
    const { data: accs } = await supabase
      .from('loyalty_accounts')
      .select('client_id, current_tier')
      .eq('program_id', program.id)
      .in('client_id', referrerIds);
    for (const a of (accs ?? []) as Array<{ client_id: string; current_tier: string | null }>) {
      tierByClient.set(a.client_id, a.current_tier);
    }
  }

  const agg = new Map<string, ReferralLeader & { lastConvertedAt: string }>();
  for (const row of rows as unknown as Row[]) {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    const id = row.referrer_client_id;
    const existing = agg.get(id);
    const points = row.referrer_bonus_tx_id
      ? txPoints.get(row.referrer_bonus_tx_id) ?? 0
      : 0;
    if (existing) {
      existing.totalReferrals += 1;
      if (row.status === 'converted') existing.convertedReferrals += 1;
      existing.pointsEarned += points;
      if (
        row.converted_at &&
        (!existing.lastConvertedAt || row.converted_at > existing.lastConvertedAt)
      ) {
        existing.lastConvertedAt = row.converted_at;
      }
    } else {
      agg.set(id, {
        clientId: id,
        firstName: client?.first_name ?? '',
        lastName: client?.last_name ?? '',
        email: client?.email ?? null,
        totalReferrals: 1,
        convertedReferrals: row.status === 'converted' ? 1 : 0,
        pointsEarned: points,
        currentTier: tierByClient.get(id) ?? null,
        lastConvertedAt: row.converted_at ?? '',
      });
    }
  }

  const leaders = [...agg.values()].sort((a, b) => {
    if (b.convertedReferrals !== a.convertedReferrals)
      return b.convertedReferrals - a.convertedReferrals;
    if (b.totalReferrals !== a.totalReferrals)
      return b.totalReferrals - a.totalReferrals;
    return b.lastConvertedAt.localeCompare(a.lastConvertedAt);
  });

  return leaders.slice(0, options.limit ?? 10).map(({ lastConvertedAt, ...rest }) => {
    void lastConvertedAt;
    return rest;
  });
}

// ============================================================
// CUSTOMER VIEW (public)
// ============================================================

export interface CustomerView {
  programName: string;
  currencyLabel: string;
  balance: number;
  lifetimePoints: number;
  currentTier: string | null;
  tierPerks: string[];
  /** Points earned on the order/appointment that brought them to this page. */
  earnedThisVisit: number | null;
  referralsEnabled: boolean;
  referralCode: string | null;
  referrerBonusPoints: number;
  refereeBonusPoints: number;
}

export interface CustomerViewInput {
  businessId: string;
  /** Bearer-like proofs: the customer just transacted and only they know these. */
  orderId?: string;
  appointmentId?: string;
  /** Auth-resolved email fallback (for logged-in account pages). */
  authEmail?: string;
}

/**
 * Resolve the public-facing loyalty view for the current customer. Returns
 * null when there's no active program OR the identity inputs don't match a
 * client -- callers should hide the widget in that case.
 */
export async function getCustomerView(
  supabase: AdminClient,
  input: CustomerViewInput
): Promise<CustomerView | null> {
  const program = await getProgramForBusiness(supabase, input.businessId);
  if (!program) return null;

  const clientId = await resolveCustomerClientId(supabase, input);
  if (!clientId) return null;

  const balance = await getLoyaltyBalance(supabase, input.businessId, clientId);
  if (!balance) return null;

  // Perks for the current tier (if any)
  const tierPerks: string[] = balance.currentTier
    ? program.tierConfig.tiers.find((t) => t.name === balance.currentTier)?.perks ?? []
    : [];

  // Earned on this specific order/appointment, if we can find it
  let earnedThisVisit: number | null = null;
  if (input.orderId || input.appointmentId) {
    const sourceCol = input.orderId ? 'order_id' : 'appointment_id';
    const sourceId = input.orderId ?? input.appointmentId!;
    const { data: tx } = await supabase
      .from('loyalty_transactions')
      .select('delta')
      .eq('reason', 'earn')
      .eq(sourceCol, sourceId)
      .maybeSingle();
    if (tx) earnedThisVisit = tx.delta;
  }

  // Referral code -- only fetch if referrals are enabled, otherwise omit
  let referralCode: string | null = null;
  if (program.referralsEnabled) {
    try {
      const code = await getOrCreateReferralCode(
        supabase,
        input.businessId,
        clientId
      );
      referralCode = code.code;
    } catch (err) {
      // Non-fatal: a missing code shouldn't hide the balance widget
      console.error('Referral code lookup failed:', err);
    }
  }

  return {
    programName: program.name,
    currencyLabel: program.currencyLabel,
    balance: balance.balance,
    lifetimePoints: balance.lifetimePoints,
    currentTier: balance.currentTier ?? null,
    tierPerks,
    earnedThisVisit,
    referralsEnabled: program.referralsEnabled,
    referralCode,
    referrerBonusPoints: program.referrerBonusPoints,
    refereeBonusPoints: program.refereeBonusPoints,
  };
}

/**
 * Resolve a customer's clients.id from any of: an order_id they just paid,
 * an appointment_id they just booked, or an authenticated email. All three
 * are scoped to the tenant.
 */
async function resolveCustomerClientId(
  supabase: AdminClient,
  input: CustomerViewInput
): Promise<string | null> {
  // Order path -- order has customer_email / customer_phone (commerce guest checkout)
  if (input.orderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('business_id, customer_email, customer_phone')
      .eq('id', input.orderId)
      .maybeSingle();
    if (!order || order.business_id !== input.businessId) return null;
    if (order.customer_email) {
      const id = await findClientByEmail(
        supabase,
        input.businessId,
        order.customer_email
      );
      if (id) return id;
    }
    if (order.customer_phone) {
      const id = await findClientByPhone(
        supabase,
        input.businessId,
        order.customer_phone
      );
      if (id) return id;
    }
  }

  // Appointment path -- joins profiles for email; falls back to walk_in_phone
  if (input.appointmentId) {
    const { data: appt } = await supabase
      .from('appointments')
      .select(
        'business_id, walk_in_phone, profiles:client_id(email, phone)'
      )
      .eq('id', input.appointmentId)
      .maybeSingle();
    if (!appt || appt.business_id !== input.businessId) return null;
    const profile = Array.isArray((appt as any).profiles)
      ? (appt as any).profiles[0]
      : (appt as any).profiles;
    if (profile?.email) {
      const id = await findClientByEmail(supabase, input.businessId, profile.email);
      if (id) return id;
    }
    const phone = profile?.phone ?? appt.walk_in_phone;
    if (phone) {
      const id = await findClientByPhone(supabase, input.businessId, phone);
      if (id) return id;
    }
  }

  // Auth path
  if (input.authEmail) {
    const id = await findClientByEmail(
      supabase,
      input.businessId,
      input.authEmail
    );
    if (id) return id;
  }

  return null;
}

async function findClientByEmail(
  supabase: AdminClient,
  businessId: string,
  email: string
): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('business_id', businessId)
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

async function findClientByPhone(
  supabase: AdminClient,
  businessId: string,
  phone: string
): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle();
  return data?.id ?? null;
}

// ============================================================
// MODULE MANIFEST (consumed by the primary-agent registry)
// ============================================================

export const loyaltyModuleManifest = {
  id: 'loyalty',
  name: 'Loyalty & Rewards',
  description:
    'Branded loyalty program that earns from appointments OR purchases, with a polymorphic rewards catalog and optional cross-brand wallet.',
  icon: 'gem',
  adminPath: '/admin/loyalty',
  tools: [
    { id: 'loyalty.balance', name: 'Check balance',   endpoint: '/api/agents/loyalty/balance', method: 'GET',  action: 'loyalty-balance' },
    { id: 'loyalty.award',   name: 'Award points',    endpoint: '/api/agents/loyalty/award',   method: 'POST' },
    { id: 'loyalty.redeem',  name: 'Redeem reward',   endpoint: '/api/agents/loyalty/redeem',  method: 'POST' },
    { id: 'loyalty.rewards', name: 'Rewards catalog', endpoint: '/api/agents/loyalty/rewards', method: 'GET',  action: 'loyalty-list' },
    { id: 'loyalty.program', name: 'Program config',  endpoint: '/api/agents/loyalty/program', method: 'GET',  action: 'loyalty-list' },
    { id: 'loyalty.members', name: 'Members',         endpoint: '/api/agents/loyalty/members', method: 'GET',  action: 'loyalty-list' },
    { id: 'loyalty.referrals', name: 'Referrals',     endpoint: '/api/agents/loyalty/referrals', method: 'GET', action: 'loyalty-list' },
  ],
} as const;

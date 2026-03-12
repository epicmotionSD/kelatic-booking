import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, SubscriptionPlan } from '@/types/billing';

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

/**
 * Check if a business can create a new campaign
 */
export async function canCreateCampaign(businessId: string): Promise<UsageCheckResult> {
  const supabase = await createClient();

  // Get business plan
  const { data: business, error } = await supabase
    .from('businesses')
    .select('plan, subscription_current_period_end')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    return { allowed: false, reason: 'Business not found' };
  }

  const plan = (business.plan || 'free') as SubscriptionPlan;
  const limits = PLAN_LIMITS[plan];

  // Calculate period start
  const periodStart = business.subscription_current_period_end
    ? new Date(new Date(business.subscription_current_period_end).getTime() - 30 * 24 * 60 * 60 * 1000)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Count campaigns this period
  const { count, error: countError } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', periodStart.toISOString());

  if (countError) {
    return { allowed: false, reason: 'Failed to check usage' };
  }

  const currentCount = count || 0;

  if (currentCount >= limits.campaigns_per_month) {
    return {
      allowed: false,
      reason: `Campaign limit reached. You've used ${currentCount}/${limits.campaigns_per_month} campaigns this month.`,
      current: currentCount,
      limit: limits.campaigns_per_month,
    };
  }

  return { allowed: true, current: currentCount, limit: limits.campaigns_per_month };
}

/**
 * Check if a business can send an SMS message
 */
export async function canSendSMS(businessId: string): Promise<UsageCheckResult> {
  const supabase = await createClient();

  // Get business plan
  const { data: business, error } = await supabase
    .from('businesses')
    .select('plan, subscription_current_period_end')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    return { allowed: false, reason: 'Business not found' };
  }

  const plan = (business.plan || 'free') as SubscriptionPlan;
  const limits = PLAN_LIMITS[plan];

  // Calculate period start
  const periodStart = business.subscription_current_period_end
    ? new Date(new Date(business.subscription_current_period_end).getTime() - 30 * 24 * 60 * 60 * 1000)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Count SMS this period
  const { count, error: countError } = await supabase
    .from('campaign_messages')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('direction', 'outbound')
    .eq('channel', 'sms')
    .gte('created_at', periodStart.toISOString());

  if (countError) {
    return { allowed: false, reason: 'Failed to check usage' };
  }

  const currentCount = count || 0;

  if (currentCount >= limits.sms_messages_per_month) {
    return {
      allowed: false,
      reason: `SMS limit reached. You've used ${currentCount}/${limits.sms_messages_per_month} messages this month.`,
      current: currentCount,
      limit: limits.sms_messages_per_month,
    };
  }

  return { allowed: true, current: currentCount, limit: limits.sms_messages_per_month };
}

/**
 * Check if a business can add a new contact
 */
export async function canAddContact(businessId: string): Promise<UsageCheckResult> {
  const supabase = await createClient();

  // Get business plan
  const { data: business, error } = await supabase
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    return { allowed: false, reason: 'Business not found' };
  }

  const plan = (business.plan || 'free') as SubscriptionPlan;
  const limits = PLAN_LIMITS[plan];

  // Count total contacts
  const { count, error: countError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);

  if (countError) {
    return { allowed: false, reason: 'Failed to check usage' };
  }

  const currentCount = count || 0;
  const contactLimit = limits.team_members * 500; // Approximate

  if (currentCount >= contactLimit) {
    return {
      allowed: false,
      reason: `Contact limit reached. You've used ${currentCount}/${contactLimit} contacts.`,
      current: currentCount,
      limit: contactLimit,
    };
  }

  return { allowed: true, current: currentCount, limit: contactLimit };
}

/**
 * Get comprehensive usage summary for a business
 */
export async function getUsageSummary(businessId: string) {
  const [campaigns, sms, contacts] = await Promise.all([
    canCreateCampaign(businessId),
    canSendSMS(businessId),
    canAddContact(businessId),
  ]);

  return {
    campaigns,
    sms,
    contacts,
  };
}

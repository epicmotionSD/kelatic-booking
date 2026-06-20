// Stripe Connect — Express accounts for per-tenant payments.
//
// We use the Direct Charges pattern: the connected account is the merchant
// of record, the platform takes a percentage via application_fee_amount, and
// the tenant's Stripe dashboard shows their own charges / refunds / taxes.
//
// New tenants connect via /admin/settings/payments → AccountLink (Stripe-
// hosted KYC) → back to /admin/settings/payments. Status fields on the
// businesses row are refreshed when the user lands back on the page, and
// also via the account.updated webhook.

import Stripe from 'stripe';
import { stripe } from './index';

export type ConnectStatus = 'pending' | 'active' | 'restricted' | 'disabled';

export interface ConnectAccountSummary {
  accountId: string;
  status: ConnectStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
  /** True iff the platform can safely route charges through this account. */
  ready: boolean;
}

/**
 * Create an Express connected account for a tenant. Returns the account id —
 * the caller stores it on businesses.stripe_account_id.
 */
export async function createConnectExpressAccount(args: {
  email: string;
  businessName: string;
  country?: string;
}): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    country: args.country || 'US',
    email: args.email,
    business_profile: {
      name: args.businessName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

/**
 * Generate a Stripe-hosted onboarding link. These expire (~5 min), so the
 * caller mints a fresh one each time the owner clicks the connect button.
 */
export async function createOnboardingAccountLink(args: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: args.accountId,
    refresh_url: args.refreshUrl,
    return_url: args.returnUrl,
    type: 'account_onboarding',
  });
  return link.url;
}

/** Pull current status from Stripe so the local row can be refreshed. */
export async function fetchAccountSummary(
  accountId: string
): Promise<ConnectAccountSummary> {
  const account = await stripe.accounts.retrieve(accountId);
  return summarizeAccount(account);
}

export function summarizeAccount(account: Stripe.Account): ConnectAccountSummary {
  const chargesEnabled = !!account.charges_enabled;
  const payoutsEnabled = !!account.payouts_enabled;
  const detailsSubmitted = !!account.details_submitted;
  const due =
    account.requirements?.currently_due ?? account.requirements?.past_due ?? [];

  let status: ConnectStatus;
  if (account.requirements?.disabled_reason) {
    status = 'disabled';
  } else if (chargesEnabled && payoutsEnabled) {
    status = 'active';
  } else if (detailsSubmitted && (chargesEnabled || payoutsEnabled)) {
    // Submitted but only some capabilities -- usually missing payouts info
    status = 'restricted';
  } else {
    status = 'pending';
  }

  return {
    accountId: account.id,
    status,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requirementsDue: due,
    ready: chargesEnabled,
  };
}

// ============================================================
// PAYMENT ROUTING
// ============================================================

export interface ConnectRouting {
  /** Pass as the second argument to stripe.paymentIntents.create. */
  requestOptions?: { stripeAccount: string };
  /** Pass on the PI body. */
  applicationFeeAmount?: number;
}

/**
 * Build the Connect routing for a payment. Returns an empty object for
 * tenants that haven't connected yet — those payments still flow through
 * the platform account exactly as before, so existing tenants don't break
 * when this rolls out.
 */
export function buildConnectRouting(
  business: {
    stripe_account_id: string | null;
    stripe_account_status?: string | null;
    platform_fee_percent?: number | string | null;
  },
  amountCents: number
): ConnectRouting {
  if (!business.stripe_account_id) return {};
  // Skip if the account isn't usable yet (pending KYC, restricted, etc.) --
  // a payment with stripeAccount on an un-onboarded account just errors.
  if (business.stripe_account_status && business.stripe_account_status !== 'active') {
    return {};
  }

  const feePct = Number(business.platform_fee_percent ?? 0);
  const applicationFeeAmount =
    feePct > 0 ? Math.floor((amountCents * feePct) / 100) : 0;

  return {
    requestOptions: { stripeAccount: business.stripe_account_id },
    applicationFeeAmount: applicationFeeAmount > 0 ? applicationFeeAmount : undefined,
  };
}

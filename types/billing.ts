// Stripe Subscription Types for x3o.ai billing

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type SubscriptionPlan =
  | 'free'
  | 'trinity_monthly'
  | 'trinity_annual'
  | 'starter'; // Legacy plan name

export interface SubscriptionDetails {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  plan_status: SubscriptionStatus;
  subscription_current_period_start: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  subscription_canceled_at: string | null;
  trial_ends_at: string | null;
}

export interface SubscriptionProduct {
  priceId: string;
  name: string;
  amount: number; // in cents
  interval?: 'month' | 'year';
  type?: 'one_time';
  features: string[];
}

export interface BillingPortalConfig {
  businessId: string;
  returnUrl: string;
}

export interface CheckoutConfig {
  businessId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UsageLimits {
  campaigns_per_month: number;
  ai_generations_per_month: number;
  sms_messages_per_month: number;
  team_members: number;
}

// Plan-specific usage limits
export const PLAN_LIMITS: Record<SubscriptionPlan, UsageLimits> = {
  free: {
    campaigns_per_month: 0,
    ai_generations_per_month: 10,
    sms_messages_per_month: 0,
    team_members: 1,
  },
  trinity_monthly: {
    campaigns_per_month: 10,
    ai_generations_per_month: 500,
    sms_messages_per_month: 1000,
    team_members: 10,
  },
  trinity_annual: {
    campaigns_per_month: 20,
    ai_generations_per_month: 1000,
    sms_messages_per_month: 2000,
    team_members: 20,
  },
  starter: {
    // Legacy plan
    campaigns_per_month: 5,
    ai_generations_per_month: 100,
    sms_messages_per_month: 500,
    team_members: 5,
  },
};

// Webhook event types we handle
export type SubscriptionWebhookEvent =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'checkout.session.completed';

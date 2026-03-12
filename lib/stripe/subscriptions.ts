import Stripe from 'stripe';
import { stripe } from './index';
import { createClient } from '@/lib/supabase/server';

// ============================================
// STRIPE SUBSCRIPTION PRODUCTS
// ============================================

// x3o.ai Pricing Model (from case study):
// - Trinity AI Monthly: $297/mo
// - Revenue Sprint: $1,500 one-time

export const SUBSCRIPTION_PRODUCTS = {
  TRINITY_MONTHLY: {
    priceId: process.env.STRIPE_PRICE_TRINITY_MONTHLY!,
    name: 'Trinity AI - Monthly',
    amount: 29700, // $297.00 in cents
    interval: 'month' as const,
    features: [
      'Ghost client reactivation campaigns',
      'Conversation recovery (abandoned DMs)',
      'Instant slot filling (waitlist)',
      '24/7 AI chatbot (Kela)',
      'Trinity content generation',
      'Monthly revenue recovery report',
      'Email & SMS support',
    ],
  },
  TRINITY_ANNUAL: {
    priceId: process.env.STRIPE_PRICE_TRINITY_ANNUAL!,
    name: 'Trinity AI - Annual',
    amount: 297000, // $2,970.00 (save $594/year)
    interval: 'year' as const,
    features: [
      'All Monthly features',
      'Save $594/year (2 months free)',
      'Priority support',
      'Quarterly strategy calls',
    ],
  },
  REVENUE_SPRINT: {
    priceId: process.env.STRIPE_PRICE_REVENUE_SPRINT!,
    name: 'Revenue Sprint (7-Day)',
    amount: 150000, // $1,500.00 one-time
    type: 'one_time' as const,
    features: [
      '7-day intensive campaign',
      '100% ghost client list outreach',
      'Hummingbird cadence (4-day protocol)',
      'Personal concierge support',
      'Guaranteed results or refund',
    ],
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PRODUCTS;

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

interface CreateSubscriptionCustomerParams {
  businessId: string;
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

/**
 * Creates or retrieves a Stripe Customer for a business
 */
export async function createSubscriptionCustomer({
  businessId,
  email,
  name,
  phone,
  metadata = {},
}: CreateSubscriptionCustomerParams): Promise<string> {
  const supabase = await createClient();

  // Check if customer already exists
  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_customer_id')
    .eq('id', businessId)
    .single();

  if (business?.stripe_customer_id) {
    return business.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    phone,
    metadata: {
      business_id: businessId,
      ...metadata,
    },
  });

  // Store customer ID in database
  await supabase
    .from('businesses')
    .update({ stripe_customer_id: customer.id })
    .eq('id', businessId);

  return customer.id;
}

/**
 * Gets a business's Stripe Customer ID (creates if doesn't exist)
 */
export async function getOrCreateCustomer(businessId: string): Promise<string> {
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select('stripe_customer_id, email, name, phone')
    .eq('id', businessId)
    .single();

  if (error) throw error;

  if (business.stripe_customer_id) {
    return business.stripe_customer_id;
  }

  // Create customer if doesn't exist
  return createSubscriptionCustomer({
    businessId,
    email: business.email,
    name: business.name,
    phone: business.phone,
  });
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

interface CreateSubscriptionParams {
  businessId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

/**
 * Creates a new Stripe subscription for a business
 */
export async function createSubscription({
  businessId,
  priceId,
  trialDays,
  metadata = {},
}: CreateSubscriptionParams) {
  const customerId = await getOrCreateCustomer(businessId);

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      business_id: businessId,
      ...metadata,
    },
  });

  // Update database
  const supabase = await createClient();
  await supabase
    .from('businesses')
    .update({
      stripe_subscription_id: subscription.id,
      plan_status: subscription.status,
      subscription_current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
    .eq('id', businessId);

  return subscription;
}

/**
 * Updates a business's subscription plan
 */
export async function updateSubscription(
  businessId: string,
  newPriceId: string
) {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_subscription_id')
    .eq('id', businessId)
    .single();

  if (!business?.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(
    business.stripe_subscription_id
  );

  // Update subscription items
  const updatedSubscription = await stripe.subscriptions.update(
    business.stripe_subscription_id,
    {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    }
  );

  // Update database
  await supabase
    .from('businesses')
    .update({
      plan_status: updatedSubscription.status,
      subscription_current_period_end: new Date(
        updatedSubscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('id', businessId);

  return updatedSubscription;
}

/**
 * Cancels a subscription (at period end)
 */
export async function cancelSubscription(
  businessId: string,
  cancelImmediately = false
) {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_subscription_id')
    .eq('id', businessId)
    .single();

  if (!business?.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  const subscription = cancelImmediately
    ? await stripe.subscriptions.cancel(business.stripe_subscription_id)
    : await stripe.subscriptions.update(
        business.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

  // Update database
  await supabase
    .from('businesses')
    .update({
      subscription_cancel_at_period_end: subscription.cancel_at_period_end,
      subscription_canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      ...(cancelImmediately && { plan_status: 'canceled' }),
    })
    .eq('id', businessId);

  return subscription;
}

/**
 * Reactivates a canceled subscription (before period end)
 */
export async function reactivateSubscription(businessId: string) {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_subscription_id')
    .eq('id', businessId)
    .single();

  if (!business?.stripe_subscription_id) {
    throw new Error('No subscription found');
  }

  const subscription = await stripe.subscriptions.update(
    business.stripe_subscription_id,
    {
      cancel_at_period_end: false,
    }
  );

  // Update database
  await supabase
    .from('businesses')
    .update({
      subscription_cancel_at_period_end: false,
      subscription_canceled_at: null,
    })
    .eq('id', businessId);

  return subscription;
}

// ============================================
// ONE-TIME PAYMENTS (Revenue Sprint)
// ============================================

interface CreateOneTimePaymentParams {
  businessId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a Stripe Checkout session for one-time payments (Revenue Sprint)
 */
export async function createOneTimeCheckout({
  businessId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: CreateOneTimePaymentParams) {
  const customerId = await getOrCreateCustomer(businessId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      business_id: businessId,
      product_type: 'revenue_sprint',
      ...metadata,
    },
  });

  return session;
}

// ============================================
// CHECKOUT SESSIONS (Subscription)
// ============================================

interface CreateCheckoutParams {
  businessId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

/**
 * Creates a Stripe Checkout session for subscription signup
 */
export async function createCheckoutSession({
  businessId,
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
  metadata = {},
}: CreateCheckoutParams) {
  const customerId = await getOrCreateCustomer(businessId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        business_id: businessId,
        ...metadata,
      },
    },
    metadata: {
      business_id: businessId,
      ...metadata,
    },
  });

  return session;
}

// ============================================
// CUSTOMER PORTAL
// ============================================

/**
 * Creates a Stripe Customer Portal session for self-service billing
 */
export async function createPortalSession(
  businessId: string,
  returnUrl: string
) {
  const customerId = await getOrCreateCustomer(businessId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// ============================================
// SUBSCRIPTION QUERIES
// ============================================

/**
 * Gets subscription details for a business
 */
export async function getSubscriptionDetails(businessId: string) {
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select(
      `
      stripe_customer_id,
      stripe_subscription_id,
      plan,
      plan_status,
      subscription_current_period_start,
      subscription_current_period_end,
      subscription_cancel_at_period_end,
      subscription_canceled_at,
      trial_ends_at
    `
    )
    .eq('id', businessId)
    .single();

  if (error) throw error;

  // If has subscription, fetch from Stripe for latest data
  if (business.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(
      business.stripe_subscription_id,
      {
        expand: ['default_payment_method', 'latest_invoice'],
      }
    );

    return {
      ...business,
      stripeSubscription: subscription,
    };
  }

  return business;
}

/**
 * Checks if a business has an active subscription
 */
export async function hasActiveSubscription(businessId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('plan_status, trial_ends_at')
    .eq('id', businessId)
    .single();

  if (!business) return false;

  // Active if status is active or trialing
  const isActive = ['active', 'trialing'].includes(business.plan_status);

  // Check if trial is still valid
  if (business.plan_status === 'trialing' && business.trial_ends_at) {
    const trialEnd = new Date(business.trial_ends_at);
    const now = new Date();
    return trialEnd > now;
  }

  return isActive;
}

/**
 * Gets a business's subscription plan name
 */
export async function getBusinessPlan(businessId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single();

  return business?.plan || null;
}

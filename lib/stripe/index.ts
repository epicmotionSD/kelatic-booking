import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// ============================================
// PAYMENT INTENTS
// ============================================

interface CreatePaymentIntentParams {
  amount: number; // in cents
  customerId?: string;
  appointmentId: string;
  isDeposit?: boolean;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent({
  amount,
  customerId,
  appointmentId,
  isDeposit = false,
  metadata = {},
}: CreatePaymentIntentParams) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId,
    metadata: {
      appointment_id: appointmentId,
      is_deposit: String(isDeposit),
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.confirm(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

// ============================================
// REFUNDS
// ============================================

interface CreateRefundParams {
  paymentIntentId: string;
  amount?: number; // in cents, partial refund if specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export async function createRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
}: CreateRefundParams) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // undefined = full refund
    reason,
  });
}

// ============================================
// CUSTOMERS
// ============================================

interface CreateCustomerParams {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export async function createCustomer({
  email,
  name,
  phone,
  metadata = {},
}: CreateCustomerParams) {
  return stripe.customers.create({
    email,
    name,
    phone,
    metadata,
  });
}

export async function getCustomer(customerId: string) {
  return stripe.customers.retrieve(customerId);
}

export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
) {
  return stripe.customers.update(customerId, params);
}

// ============================================
// STRIPE TERMINAL (POS)
// ============================================

// Create a connection token for the Terminal SDK
export async function createTerminalConnectionToken() {
  const connectionToken = await stripe.terminal.connectionTokens.create();
  return connectionToken.secret;
}

// Create a payment intent specifically for Terminal
export async function createTerminalPaymentIntent({
  amount,
  appointmentId,
  metadata = {},
}: Omit<CreatePaymentIntentParams, 'customerId'>) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    payment_method_types: ['card_present'],
    capture_method: 'automatic',
    metadata: {
      appointment_id: appointmentId,
      payment_type: 'terminal',
      ...metadata,
    },
  });

  return paymentIntent;
}

// Process payment on a specific reader
export async function processTerminalPayment(
  readerId: string,
  paymentIntentId: string
) {
  return stripe.terminal.readers.processPaymentIntent(readerId, {
    payment_intent: paymentIntentId,
  });
}

// List available readers
export async function listTerminalReaders() {
  const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;
  
  return stripe.terminal.readers.list({
    location: locationId,
    status: 'online',
  });
}

// Cancel current action on reader
export async function cancelReaderAction(readerId: string) {
  return stripe.terminal.readers.cancelAction(readerId);
}

// ============================================
// WEBHOOKS
// ============================================

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

// ============================================
// UTILITIES
// ============================================

// Convert dollars to cents for Stripe
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars for display
export function toDollars(cents: number): number {
  return cents / 100;
}

// Format currency for display
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(toDollars(cents));
}

// Global kill switch for card / Stripe payments across the app.
// Flip to `true` to restore Stripe card flow, or delete this flag and
// its call sites when PayPal replaces it.
export const CARD_PAYMENTS_ENABLED = false;

export const CARD_PAYMENTS_PAUSED_MESSAGE =
  'Card payments are temporarily paused while we switch providers.';

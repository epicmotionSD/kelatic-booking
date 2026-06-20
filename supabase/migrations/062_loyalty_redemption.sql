-- ============================================================
-- Migration 062: Loyalty redemption on commerce orders
-- Adds a discount column to orders so checkout can apply a redeemed
-- reward and the receipt / reporting can show what was deducted.
--
-- The actual redemption (account debit + ledger row) still flows
-- through loyalty_transactions, written by the Stripe webhook on
-- successful payment. The pre-payment intent stays parked in
-- payment_intent.metadata until then -- if the payment fails or is
-- cancelled, no points are deducted.
-- ============================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0;

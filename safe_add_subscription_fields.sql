-- ============================================
-- SAFE MIGRATION: Add Stripe Subscription Fields to Existing Businesses Table
-- This will NOT delete any existing data
-- ============================================

-- Add Stripe subscription fields to existing businesses table
DO $$
BEGIN
    -- Stripe Customer ID (links business to Stripe Customer object)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE businesses ADD COLUMN stripe_customer_id TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS businesses_stripe_customer_id_key ON businesses(stripe_customer_id);
    END IF;

    -- Stripe Subscription ID (current active subscription)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE businesses ADD COLUMN stripe_subscription_id TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS businesses_stripe_subscription_id_key ON businesses(stripe_subscription_id);
    END IF;

    -- Subscription period start date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'subscription_current_period_start'
    ) THEN
        ALTER TABLE businesses ADD COLUMN subscription_current_period_start TIMESTAMPTZ;
    END IF;

    -- Subscription period end date (renewal date)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'subscription_current_period_end'
    ) THEN
        ALTER TABLE businesses ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
    END IF;

    -- Subscription cancel at period end flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'subscription_cancel_at_period_end'
    ) THEN
        ALTER TABLE businesses ADD COLUMN subscription_cancel_at_period_end BOOLEAN DEFAULT false;
    END IF;

    -- Subscription canceled timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'subscription_canceled_at'
    ) THEN
        ALTER TABLE businesses ADD COLUMN subscription_canceled_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription ON businesses(stripe_subscription_id);

-- Add helpful comments
COMMENT ON COLUMN businesses.stripe_customer_id IS 'Stripe Customer ID for subscription billing';
COMMENT ON COLUMN businesses.stripe_subscription_id IS 'Current active Stripe subscription ID';
COMMENT ON COLUMN businesses.subscription_current_period_start IS 'Current billing period start date';
COMMENT ON COLUMN businesses.subscription_current_period_end IS 'Current billing period end date (renewal date)';
COMMENT ON COLUMN businesses.subscription_cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN businesses.subscription_canceled_at IS 'Timestamp when subscription was canceled';

-- Show success message with existing business count
SELECT
    'SUCCESS! Subscription fields added to businesses table.' as status,
    COUNT(*) as existing_businesses_count
FROM businesses;

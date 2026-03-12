-- Add Stripe subscription fields to businesses table
-- This enables x3o.ai subscription billing model: $297/mo + $1,500 sprint

DO $$
BEGIN
    -- Stripe Customer ID (links business to Stripe Customer object)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'businesses' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE businesses ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;

    -- Stripe Subscription ID (current active subscription)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'businesses' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE businesses ADD COLUMN stripe_subscription_id TEXT UNIQUE;
    END IF;

    -- Subscription period (for renewal date display)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'businesses' AND column_name = 'subscription_current_period_start') THEN
        ALTER TABLE businesses ADD COLUMN subscription_current_period_start TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'businesses' AND column_name = 'subscription_current_period_end') THEN
        ALTER TABLE businesses ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
    END IF;

    -- Subscription cancel tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'businesses' AND column_name = 'subscription_cancel_at_period_end') THEN
        ALTER TABLE businesses ADD COLUMN subscription_cancel_at_period_end BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'businesses' AND column_name = 'subscription_canceled_at') THEN
        ALTER TABLE businesses ADD COLUMN subscription_canceled_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription ON businesses(stripe_subscription_id);

-- Add comment for documentation
COMMENT ON COLUMN businesses.stripe_customer_id IS 'Stripe Customer ID for subscription billing';
COMMENT ON COLUMN businesses.stripe_subscription_id IS 'Current active Stripe subscription ID';
COMMENT ON COLUMN businesses.plan IS 'Plan name: free, trinity_monthly, trinity_annual';
COMMENT ON COLUMN businesses.plan_status IS 'Status: active, trialing, past_due, canceled, incomplete';

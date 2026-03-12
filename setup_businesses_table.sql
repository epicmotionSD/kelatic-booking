-- ============================================
-- COMPLETE BUSINESSES TABLE SETUP WITH SUBSCRIPTIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop and recreate (safe because table doesn't exist yet)
DROP TABLE IF EXISTS business_members CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- Create businesses table with ALL columns at once
CREATE TABLE businesses (
    -- Core fields
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,

    -- Location
    timezone TEXT DEFAULT 'America/Chicago',

    -- Branding
    primary_color TEXT DEFAULT '#f59e0b',

    -- Subscription (base fields)
    plan TEXT DEFAULT 'free',
    plan_status TEXT DEFAULT 'active',
    trial_ends_at TIMESTAMPTZ,

    -- Stripe subscription fields (NEW)
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    subscription_current_period_start TIMESTAMPTZ,
    subscription_current_period_end TIMESTAMPTZ,
    subscription_cancel_at_period_end BOOLEAN DEFAULT false,
    subscription_canceled_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create business_members table
CREATE TABLE business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- Create indexes
CREATE INDEX idx_businesses_stripe_customer ON businesses(stripe_customer_id);
CREATE INDEX idx_businesses_stripe_subscription ON businesses(stripe_subscription_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_business_members_user ON business_members(user_id);
CREATE INDEX idx_business_members_business ON business_members(business_id);

-- Add comments
COMMENT ON TABLE businesses IS 'Multi-tenant businesses for x3o.ai platform';
COMMENT ON COLUMN businesses.stripe_customer_id IS 'Stripe Customer ID for subscription billing';
COMMENT ON COLUMN businesses.stripe_subscription_id IS 'Current active Stripe subscription ID';
COMMENT ON COLUMN businesses.plan IS 'Plan name: free, trinity_monthly, trinity_annual';
COMMENT ON COLUMN businesses.plan_status IS 'Status: active, trialing, past_due, canceled, incomplete';

-- Enable RLS (Row Level Security)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view their own businesses"
    ON businesses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = businesses.id
            AND business_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own businesses"
    ON businesses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = businesses.id
            AND business_members.user_id = auth.uid()
            AND business_members.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for business_members
CREATE POLICY "Users can view members of their businesses"
    ON business_members FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
        )
    );

-- Success message
SELECT
    'SUCCESS! Businesses table created with subscription fields.' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('businesses', 'business_members');

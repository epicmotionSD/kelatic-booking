-- Multi-Tenant Architecture for x3o.ai Platform
-- Migration: 010_multi_tenant
-- Transforms single-tenant Kelatic booking into white-label platform

-- ============================================
-- BUSINESSES TABLE (Core Tenant Entity)
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    slug TEXT UNIQUE NOT NULL,              -- Subdomain: kelatic.x3o.ai
    name TEXT NOT NULL,                     -- Display name: "Kelatic Hair Lounge"

    -- Contact
    email TEXT NOT NULL,
    phone TEXT,

    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'US',
    timezone TEXT DEFAULT 'America/Chicago',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#f59e0b',
    secondary_color TEXT DEFAULT '#eab308',
    accent_color TEXT DEFAULT '#78350f',
    font_family TEXT DEFAULT 'Inter',

    -- Business type for AI context
    business_type TEXT DEFAULT 'salon',     -- salon, barbershop, spa, academy
    brand_voice TEXT DEFAULT 'professional', -- professional, casual, luxury, edgy
    tagline TEXT,

    -- Social
    website_url TEXT,
    instagram_handle TEXT,
    facebook_url TEXT,
    tiktok_handle TEXT,

    -- Stripe Connect (for white-label payments)
    stripe_account_id TEXT,                 -- Connected account ID
    stripe_account_status TEXT DEFAULT 'pending', -- pending, active, restricted
    platform_fee_percent DECIMAL(5,2) DEFAULT 2.50, -- x3o platform fee

    -- Subscription
    plan TEXT DEFAULT 'starter',            -- starter, professional, enterprise
    plan_status TEXT DEFAULT 'active',
    trial_ends_at TIMESTAMPTZ,

    -- Feature flags
    features JSONB DEFAULT '{"ai_content": true, "pos_terminal": false, "academy": false, "newsletter": true}'::jsonb,

    -- Custom domain (enterprise)
    custom_domain TEXT,                     -- app.kelatic.com
    custom_domain_verified BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- BUSINESS SETTINGS (Extended Config)
-- ============================================

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    -- Booking settings
    booking_advance_days INTEGER DEFAULT 60,
    booking_min_notice_hours INTEGER DEFAULT 2,
    cancellation_hours INTEGER DEFAULT 24,
    cancellation_policy TEXT,
    deposit_policy TEXT,

    -- Business hours (JSONB for flexibility)
    business_hours JSONB DEFAULT '{
        "sunday": null,
        "monday": {"open": "09:00", "close": "18:00"},
        "tuesday": {"open": "09:00", "close": "18:00"},
        "wednesday": {"open": "09:00", "close": "18:00"},
        "thursday": {"open": "09:00", "close": "18:00"},
        "friday": {"open": "09:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "17:00"}
    }'::jsonb,

    -- Notification settings
    send_booking_confirmations BOOLEAN DEFAULT true,
    send_reminder_24h BOOLEAN DEFAULT true,
    send_reminder_2h BOOLEAN DEFAULT true,
    send_followup_review BOOLEAN DEFAULT true,

    -- AI settings
    ai_brand_context TEXT,                  -- Custom context for Trinity AI
    ai_hashtags TEXT[],                     -- Default hashtags
    ai_tone TEXT DEFAULT 'warm',            -- warm, professional, edgy, luxury

    -- Email settings (SendGrid)
    sendgrid_api_key_encrypted TEXT,
    sendgrid_from_email TEXT,
    sendgrid_from_name TEXT,

    -- SMS settings (Twilio)
    twilio_account_sid_encrypted TEXT,
    twilio_auth_token_encrypted TEXT,
    twilio_phone_number TEXT,

    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    google_analytics_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(business_id)
);

-- ============================================
-- BUSINESS INTEGRATIONS (External Services)
-- ============================================

CREATE TABLE IF NOT EXISTS business_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    integration_type TEXT NOT NULL,         -- stripe, sendgrid, twilio, google_calendar
    status TEXT DEFAULT 'pending',          -- pending, connected, error

    -- Encrypted credentials stored as JSONB
    credentials_encrypted JSONB,

    -- Integration-specific config
    config JSONB,

    last_sync_at TIMESTAMPTZ,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(business_id, integration_type)
);

-- ============================================
-- BUSINESS MEMBERS (Team/Staff Association)
-- ============================================

CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    role TEXT NOT NULL DEFAULT 'member',    -- owner, admin, stylist, member

    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    invited_by UUID REFERENCES auth.users(id),

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(business_id, user_id)
);

-- ============================================
-- ADD business_id TO EXISTING TABLES
-- ============================================

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

-- Services
ALTER TABLE services ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Chat conversations
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Trinity generations
ALTER TABLE trinity_generations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Newsletter subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Newsletter campaigns
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Academy courses
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Stylist services
ALTER TABLE stylist_services ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Stylist schedules
ALTER TABLE stylist_schedules ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Stylist time off
ALTER TABLE stylist_time_off ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Client hair history
ALTER TABLE client_hair_history ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Rebooking reminders
ALTER TABLE rebooking_reminders ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- ============================================
-- INSERT KELATIC AS FIRST TENANT
-- ============================================

INSERT INTO businesses (
    slug,
    name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    timezone,
    latitude,
    longitude,
    logo_url,
    primary_color,
    secondary_color,
    business_type,
    brand_voice,
    tagline,
    instagram_handle,
    features,
    plan,
    is_active
) VALUES (
    'kelatic',
    'Kelatic Hair Lounge',
    'kelatic@gmail.com',
    '(713) 485-4000',
    '9430 Richmond Ave',
    'Houston',
    'TX',
    '77063',
    'America/Chicago',
    29.7289,
    -95.5277,
    '/logo.png',
    '#f59e0b',
    '#eab308',
    'salon',
    'warm',
    'Houston''s Premier Loc Specialists',
    '@kelatichairlounge',
    '{"ai_content": true, "pos_terminal": true, "academy": true, "newsletter": true, "barber_block": true}'::jsonb,
    'professional',
    true
) ON CONFLICT (slug) DO NOTHING;

-- Insert Kelatic settings
INSERT INTO business_settings (
    business_id,
    cancellation_policy,
    deposit_policy,
    ai_brand_context,
    ai_hashtags,
    ai_tone,
    meta_title,
    meta_description
)
SELECT
    id,
    'Appointments must be cancelled at least 24 hours in advance. Late cancellations may result in a cancellation fee.',
    'A deposit is required for services over $100 or lasting more than 2 hours. Deposits are non-refundable but can be applied to rescheduled appointments.',
    'Kelatic is a brand ecosystem serving the loc and natural hair community with three sub-brands: Loc Shop (professional services), Loc Academy (training), and Loc Vitality (products). Brand voice is warm, professional, and empowering. Celebrates Black beauty and natural hair culture.',
    ARRAY['#houstonlocs', '#houstonstylist', '#kelatic', '#locjourney', '#naturalhair', '#houstonhairstylist'],
    'warm',
    'Kelatic Hair Lounge | Houston''s Premier Loc Specialists',
    'Book your loc retwist, starter locs, or natural hair service at Kelatic Hair Lounge in Houston, TX. Expert stylists specializing in locs, braids, and natural hair care.'
FROM businesses
WHERE slug = 'kelatic'
ON CONFLICT (business_id) DO NOTHING;

-- ============================================
-- UPDATE EXISTING DATA WITH KELATIC business_id
-- ============================================

-- Update all existing services to belong to Kelatic
UPDATE services SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- Update all existing appointments
UPDATE appointments SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- Update all existing payments
UPDATE payments SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- Update all existing profiles (staff) to belong to Kelatic
UPDATE profiles SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL AND role IN ('stylist', 'admin', 'owner');

-- Update chat conversations
UPDATE chat_conversations SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- Update trinity generations
UPDATE trinity_generations SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- Update newsletter tables
UPDATE newsletter_subscribers SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE newsletter_campaigns SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- Update stylist-related tables
UPDATE stylist_services SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE stylist_schedules SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE stylist_time_off SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- ============================================
-- INDEXES FOR MULTI-TENANT QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_custom_domain ON businesses(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_business ON chat_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_trinity_generations_business ON trinity_generations(business_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_business ON newsletter_subscribers(business_id);

CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR MULTI-TENANT ISOLATION
-- ============================================

-- Businesses: Anyone can read active businesses, owners can manage own
CREATE POLICY "Anyone can view active businesses" ON businesses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can update own business" ON businesses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = businesses.id
            AND business_members.user_id = auth.uid()
            AND business_members.role IN ('owner', 'admin')
        )
    );

-- Business Settings: Business admins only
CREATE POLICY "Business admins can manage settings" ON business_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = business_settings.business_id
            AND business_members.user_id = auth.uid()
            AND business_members.role IN ('owner', 'admin')
        )
    );

-- Business Members: Admins can manage, members can view own business
CREATE POLICY "Members can view own business team" ON business_members
    FOR SELECT USING (
        business_id IN (
            SELECT bm.business_id FROM business_members bm
            WHERE bm.user_id = auth.uid()
        )
    );

CREATE POLICY "Business admins can manage members" ON business_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_members bm
            WHERE bm.business_id = business_members.business_id
            AND bm.user_id = auth.uid()
            AND bm.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- UPDATE EXISTING RLS POLICIES FOR TENANT ISOLATION
-- ============================================

-- Drop old policies that don't account for business_id
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage services" ON services;

-- Services: Filter by business
CREATE POLICY "Business admins can manage services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = services.business_id
            AND business_members.user_id = auth.uid()
            AND business_members.role IN ('owner', 'admin')
        )
    );

-- Appointments: Filter by business
CREATE POLICY "Business staff view appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = appointments.business_id
            AND business_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Business staff manage appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = appointments.business_id
            AND business_members.user_id = auth.uid()
            AND business_members.role IN ('owner', 'admin', 'stylist')
        )
    );

-- Profiles: Business staff can view profiles in their business
CREATE POLICY "Business staff can view profiles" ON profiles
    FOR SELECT USING (
        -- User can see their own profile
        auth.uid() = id
        OR
        -- Or profiles in their business
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = profiles.business_id
            AND business_members.user_id = auth.uid()
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get business by slug
CREATE OR REPLACE FUNCTION get_business_by_slug(p_slug TEXT)
RETURNS UUID AS $$
    SELECT id FROM businesses WHERE slug = p_slug AND is_active = true;
$$ LANGUAGE sql STABLE;

-- Function to get business by custom domain
CREATE OR REPLACE FUNCTION get_business_by_domain(p_domain TEXT)
RETURNS UUID AS $$
    SELECT id FROM businesses
    WHERE custom_domain = p_domain
    AND custom_domain_verified = true
    AND is_active = true;
$$ LANGUAGE sql STABLE;

-- Function to check if user is member of business
CREATE OR REPLACE FUNCTION is_business_member(p_business_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM business_members
        WHERE business_id = p_business_id
        AND user_id = p_user_id
        AND is_active = true
    );
$$ LANGUAGE sql STABLE;

-- Function to get user's role in business
CREATE OR REPLACE FUNCTION get_business_role(p_business_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM business_members
    WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND is_active = true;
$$ LANGUAGE sql STABLE;

-- Trigger to update businesses.updated_at
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

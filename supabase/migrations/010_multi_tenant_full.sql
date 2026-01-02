-- Complete Multi-Tenant Migration
-- This script handles missing tables AND missing columns on existing tables

-- ============================================
-- ENSURE PREREQUISITE TABLES EXIST
-- ============================================

-- Trinity Generations (from 004)
CREATE TABLE IF NOT EXISTS trinity_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter tables (from 009)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website',
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  preview_text TEXT,
  headline TEXT NOT NULL,
  content TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- BUSINESSES TABLE - Create if not exists with minimal columns
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD ALL MISSING COLUMNS TO BUSINESSES TABLE
-- ============================================

DO $$
BEGIN
    -- Core columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_active') THEN
        ALTER TABLE businesses ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Contact
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'phone') THEN
        ALTER TABLE businesses ADD COLUMN phone TEXT;
    END IF;

    -- Location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'address') THEN
        ALTER TABLE businesses ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'city') THEN
        ALTER TABLE businesses ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'state') THEN
        ALTER TABLE businesses ADD COLUMN state TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'zip') THEN
        ALTER TABLE businesses ADD COLUMN zip TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'country') THEN
        ALTER TABLE businesses ADD COLUMN country TEXT DEFAULT 'US';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'timezone') THEN
        ALTER TABLE businesses ADD COLUMN timezone TEXT DEFAULT 'America/Chicago';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'latitude') THEN
        ALTER TABLE businesses ADD COLUMN latitude DECIMAL(10, 7);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'longitude') THEN
        ALTER TABLE businesses ADD COLUMN longitude DECIMAL(10, 7);
    END IF;

    -- Branding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'logo_url') THEN
        ALTER TABLE businesses ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'favicon_url') THEN
        ALTER TABLE businesses ADD COLUMN favicon_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'primary_color') THEN
        ALTER TABLE businesses ADD COLUMN primary_color TEXT DEFAULT '#f59e0b';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'secondary_color') THEN
        ALTER TABLE businesses ADD COLUMN secondary_color TEXT DEFAULT '#eab308';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'accent_color') THEN
        ALTER TABLE businesses ADD COLUMN accent_color TEXT DEFAULT '#78350f';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'font_family') THEN
        ALTER TABLE businesses ADD COLUMN font_family TEXT DEFAULT 'Inter';
    END IF;

    -- Business type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'business_type') THEN
        ALTER TABLE businesses ADD COLUMN business_type TEXT DEFAULT 'salon';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'brand_voice') THEN
        ALTER TABLE businesses ADD COLUMN brand_voice TEXT DEFAULT 'professional';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'tagline') THEN
        ALTER TABLE businesses ADD COLUMN tagline TEXT;
    END IF;

    -- Social
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'website_url') THEN
        ALTER TABLE businesses ADD COLUMN website_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'instagram_handle') THEN
        ALTER TABLE businesses ADD COLUMN instagram_handle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'facebook_url') THEN
        ALTER TABLE businesses ADD COLUMN facebook_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'tiktok_handle') THEN
        ALTER TABLE businesses ADD COLUMN tiktok_handle TEXT;
    END IF;

    -- Stripe Connect
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'stripe_account_id') THEN
        ALTER TABLE businesses ADD COLUMN stripe_account_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'stripe_account_status') THEN
        ALTER TABLE businesses ADD COLUMN stripe_account_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'platform_fee_percent') THEN
        ALTER TABLE businesses ADD COLUMN platform_fee_percent DECIMAL(5,2) DEFAULT 2.50;
    END IF;

    -- Subscription
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'plan') THEN
        ALTER TABLE businesses ADD COLUMN plan TEXT DEFAULT 'starter';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'plan_status') THEN
        ALTER TABLE businesses ADD COLUMN plan_status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE businesses ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;

    -- Features
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'features') THEN
        ALTER TABLE businesses ADD COLUMN features JSONB DEFAULT '{"ai_content": true, "pos_terminal": false, "academy": false, "newsletter": true}'::jsonb;
    END IF;

    -- Custom domain
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'custom_domain') THEN
        ALTER TABLE businesses ADD COLUMN custom_domain TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'custom_domain_verified') THEN
        ALTER TABLE businesses ADD COLUMN custom_domain_verified BOOLEAN DEFAULT false;
    END IF;

    -- Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'updated_at') THEN
        ALTER TABLE businesses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'created_by') THEN
        ALTER TABLE businesses ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================
-- BUSINESS SETTINGS - Create with all columns
-- ============================================

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    booking_advance_days INTEGER DEFAULT 60,
    booking_min_notice_hours INTEGER DEFAULT 2,
    cancellation_hours INTEGER DEFAULT 24,
    cancellation_policy TEXT,
    deposit_policy TEXT,
    business_hours JSONB DEFAULT '{
        "sunday": null,
        "monday": {"open": "09:00", "close": "18:00"},
        "tuesday": {"open": "09:00", "close": "18:00"},
        "wednesday": {"open": "09:00", "close": "18:00"},
        "thursday": {"open": "09:00", "close": "18:00"},
        "friday": {"open": "09:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "17:00"}
    }'::jsonb,
    send_booking_confirmations BOOLEAN DEFAULT true,
    send_reminder_24h BOOLEAN DEFAULT true,
    send_reminder_2h BOOLEAN DEFAULT true,
    send_followup_review BOOLEAN DEFAULT true,
    ai_brand_context TEXT,
    ai_hashtags TEXT[],
    ai_tone TEXT DEFAULT 'warm',
    sendgrid_api_key_encrypted TEXT,
    sendgrid_from_email TEXT,
    sendgrid_from_name TEXT,
    twilio_account_sid_encrypted TEXT,
    twilio_auth_token_encrypted TEXT,
    twilio_phone_number TEXT,
    meta_title TEXT,
    meta_description TEXT,
    google_analytics_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id)
);

-- ============================================
-- BUSINESS INTEGRATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS business_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    credentials_encrypted JSONB,
    config JSONB,
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, integration_type)
);

-- ============================================
-- BUSINESS MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
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

DO $$
BEGIN
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_id') THEN
        ALTER TABLE profiles ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
    END IF;

    -- Services
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'business_id') THEN
        ALTER TABLE services ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Appointments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'business_id') THEN
        ALTER TABLE appointments ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Payments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'business_id') THEN
        ALTER TABLE payments ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Chat conversations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'business_id') THEN
        ALTER TABLE chat_conversations ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Trinity generations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trinity_generations' AND column_name = 'business_id') THEN
        ALTER TABLE trinity_generations ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Newsletter subscribers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'business_id') THEN
        ALTER TABLE newsletter_subscribers ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Newsletter campaigns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_campaigns' AND column_name = 'business_id') THEN
        ALTER TABLE newsletter_campaigns ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;

    -- Academy courses (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'academy_courses') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_courses' AND column_name = 'business_id') THEN
            ALTER TABLE academy_courses ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Stylist services (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stylist_services') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stylist_services' AND column_name = 'business_id') THEN
            ALTER TABLE stylist_services ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Stylist schedules (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stylist_schedules') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stylist_schedules' AND column_name = 'business_id') THEN
            ALTER TABLE stylist_schedules ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Stylist time off (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stylist_time_off') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stylist_time_off' AND column_name = 'business_id') THEN
            ALTER TABLE stylist_time_off ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Client hair history (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_hair_history') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_hair_history' AND column_name = 'business_id') THEN
            ALTER TABLE client_hair_history ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Rebooking reminders (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rebooking_reminders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rebooking_reminders' AND column_name = 'business_id') THEN
            ALTER TABLE rebooking_reminders ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ============================================
-- INSERT KELATIC AS FIRST TENANT
-- ============================================

INSERT INTO businesses (
    slug, name, email, phone, address, city, state, zip, timezone,
    latitude, longitude, logo_url, primary_color, secondary_color,
    business_type, brand_voice, tagline, instagram_handle, features, plan, is_active
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
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    timezone = EXCLUDED.timezone,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    logo_url = EXCLUDED.logo_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    business_type = EXCLUDED.business_type,
    brand_voice = EXCLUDED.brand_voice,
    tagline = EXCLUDED.tagline,
    instagram_handle = EXCLUDED.instagram_handle,
    features = EXCLUDED.features,
    plan = EXCLUDED.plan;

-- Insert Kelatic settings
INSERT INTO business_settings (
    business_id, cancellation_policy, deposit_policy, ai_brand_context,
    ai_hashtags, ai_tone, meta_title, meta_description
)
SELECT
    id,
    'Appointments must be cancelled at least 24 hours in advance.',
    'A deposit is required for services over $100.',
    'Kelatic is a brand ecosystem serving the loc and natural hair community.',
    ARRAY['#houstonlocs', '#houstonstylist', '#kelatic', '#locjourney', '#naturalhair'],
    'warm',
    'Kelatic Hair Lounge | Houston''s Premier Loc Specialists',
    'Book your loc services at Kelatic Hair Lounge in Houston, TX.'
FROM businesses WHERE slug = 'kelatic'
ON CONFLICT (business_id) DO NOTHING;

-- ============================================
-- UPDATE EXISTING DATA
-- ============================================

UPDATE services SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE appointments SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE payments SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE profiles SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL AND role IN ('stylist', 'admin', 'owner');
UPDATE chat_conversations SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE trinity_generations SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE newsletter_subscribers SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;
UPDATE newsletter_campaigns SET business_id = (SELECT id FROM businesses WHERE slug = 'kelatic') WHERE business_id IS NULL;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_custom_domain ON businesses(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_trinity_generations_business ON trinity_generations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Anyone can view active businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can update own business" ON businesses;
DROP POLICY IF EXISTS "Business admins can manage settings" ON business_settings;
DROP POLICY IF EXISTS "Members can view own business team" ON business_members;
DROP POLICY IF EXISTS "Business admins can manage members" ON business_members;

-- Businesses
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

-- Business Settings
CREATE POLICY "Business admins can manage settings" ON business_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_members
            WHERE business_members.business_id = business_settings.business_id
            AND business_members.user_id = auth.uid()
            AND business_members.role IN ('owner', 'admin')
        )
    );

-- Business Members
CREATE POLICY "Members can view own business team" ON business_members
    FOR SELECT USING (
        business_id IN (
            SELECT bm.business_id FROM business_members bm WHERE bm.user_id = auth.uid()
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
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_business_by_slug(p_slug TEXT)
RETURNS UUID AS $$
    SELECT id FROM businesses WHERE slug = p_slug AND is_active = true;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_business_member(p_business_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM business_members
        WHERE business_id = p_business_id AND user_id = p_user_id AND is_active = true
    );
$$ LANGUAGE sql STABLE;

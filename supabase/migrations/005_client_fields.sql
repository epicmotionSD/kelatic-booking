-- Add enhanced client fields for AI chatbot and communications
-- Migration: 005_client_fields

-- ============================================
-- ADD NEW COLUMNS TO PROFILES
-- ============================================

-- Communication preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_contact TEXT CHECK (preferred_contact IN ('sms', 'email', 'both')) DEFAULT 'both';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Personal info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_stylist_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_times TEXT[] DEFAULT '{}'; -- ['morning', 'afternoon', 'evening']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- AI chatbot context
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_notes TEXT; -- Summary from AI conversations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Rename hair_texture to texture for consistency (if needed)
-- Note: The column is named hair_texture in schema but client page uses texture
-- Keep both for backwards compatibility
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS texture TEXT;

-- ============================================
-- CREATE INDEX FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_zip ON profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_stylist ON profiles(preferred_stylist_id);
CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON profiles(birthday);
CREATE INDEX IF NOT EXISTS idx_profiles_sms_opt_in ON profiles(sms_opt_in) WHERE sms_opt_in = true;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.preferred_contact IS 'Preferred contact method: sms, email, or both';
COMMENT ON COLUMN profiles.sms_opt_in IS 'Client opted in to receive SMS notifications';
COMMENT ON COLUMN profiles.marketing_opt_in IS 'Client opted in to receive marketing messages';
COMMENT ON COLUMN profiles.preferred_times IS 'Array of preferred appointment times: morning, afternoon, evening';
COMMENT ON COLUMN profiles.ai_notes IS 'AI-generated summary of client preferences from chatbot conversations';
COMMENT ON COLUMN profiles.referral_source IS 'How the client heard about KeLatic: social, friend, walk-in, etc.';

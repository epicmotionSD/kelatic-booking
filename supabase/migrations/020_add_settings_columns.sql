-- Add missing columns to business_settings table
-- These columns are used by the admin settings page

ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS closed_days INTEGER[] DEFAULT ARRAY[0, 1],
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT false;

-- Update Kelatic business settings with default values
UPDATE business_settings 
SET 
    timezone = COALESCE(timezone, 'America/Chicago'),
    currency = COALESCE(currency, 'USD'),
    closed_days = COALESCE(closed_days, ARRAY[0, 1]),
    google_calendar_connected = COALESCE(google_calendar_connected, false),
    sms_email_enabled = COALESCE(sms_email_enabled, false),
    stripe_connected = COALESCE(stripe_connected, true)
WHERE business_id = (SELECT id FROM businesses WHERE slug = 'kelatic');

-- Ensure business_hours uses numeric keys for consistency with the frontend
-- The frontend uses 0=Sunday, 1=Monday, etc.
UPDATE business_settings 
SET business_hours = '{
    "0": null,
    "1": null,
    "2": {"open": "10:00", "close": "19:00"},
    "3": {"open": "10:00", "close": "19:00"},
    "4": {"open": "10:00", "close": "19:00"},
    "5": {"open": "10:00", "close": "19:00"},
    "6": {"open": "09:00", "close": "17:00"}
}'::jsonb
WHERE business_id = (SELECT id FROM businesses WHERE slug = 'kelatic')
AND (business_hours IS NULL OR business_hours ? 'sunday');

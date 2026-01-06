-- Migration: Create business_settings table for tenant configuration
-- This table stores all business/tenant specific settings and configuration

CREATE TABLE IF NOT EXISTS business_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one settings record per user
  UNIQUE(owner_id)
);

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can manage their own business settings" ON business_settings
  FOR ALL USING (auth.uid() = owner_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS business_settings_owner_id_idx ON business_settings(owner_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_settings_updated_at 
  BEFORE UPDATE ON business_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional)
-- INSERT INTO business_settings (owner_id, settings) VALUES
-- (
--   (SELECT id FROM auth.users LIMIT 1),
--   '{
--     "name": "KeLatic Hair Lounge",
--     "address": "9430 Richmond Ave, Houston, TX 77063",
--     "phone": "(713) 485-4000",
--     "email": "kelatic@gmail.com",
--     "timezone": "America/Chicago",
--     "currency": "USD",
--     "bookingLeadTime": 2,
--     "bookingWindowDays": 60,
--     "googleCalendarConnected": false,
--     "smsEmailEnabled": false,
--     "stripeConnected": true
--   }'
-- ) ON CONFLICT (owner_id) DO NOTHING;
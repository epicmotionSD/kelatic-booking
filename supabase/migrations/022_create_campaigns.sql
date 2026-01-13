-- =============================================================================
-- CAMPAIGNS TABLE
-- Stores reactivation campaigns per tenant (business)
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaign status enum
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

-- Lead segment enum
CREATE TYPE lead_segment AS ENUM ('ghost', 'near_miss', 'vip');

-- Script variant enum
CREATE TYPE script_variant AS ENUM ('direct_inquiry', 'file_closure', 'gift', 'breakup', 'custom');

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Campaign info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment lead_segment NOT NULL DEFAULT 'ghost',
  script_variant script_variant NOT NULL DEFAULT 'direct_inquiry',
  
  -- Script templates (personalized per campaign)
  script_template TEXT NOT NULL,
  script_variables JSONB DEFAULT '{}',
  
  -- Cadence config
  cadence_type VARCHAR(50) DEFAULT 'hummingbird', -- 'hummingbird' | 'custom'
  cadence_config JSONB DEFAULT '[
    {"day": 1, "time": "09:00", "channel": "sms", "script": "direct_inquiry"},
    {"day": 2, "time": "11:00", "channel": "voice", "script": "voicemail"},
    {"day": 4, "time": "14:00", "channel": "sms", "script": "file_closure"},
    {"day": 7, "time": "10:00", "channel": "sms", "script": "breakup"}
  ]',
  
  -- Targeting
  total_leads INTEGER NOT NULL DEFAULT 0,
  daily_send_limit INTEGER DEFAULT 100,
  
  -- Status
  status campaign_status NOT NULL DEFAULT 'draft',
  current_day INTEGER DEFAULT 0,
  
  -- Timing
  scheduled_start TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  -- Metrics (denormalized for fast dashboard reads)
  metrics JSONB DEFAULT '{
    "sent": 0,
    "delivered": 0,
    "failed": 0,
    "responses": 0,
    "positive_responses": 0,
    "negative_responses": 0,
    "opt_outs": 0,
    "bookings": 0,
    "revenue": 0
  }',
  
  -- Costs
  sms_cost DECIMAL(10, 4) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_campaigns_business ON campaigns(business_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_segment ON campaigns(segment);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Users can only see campaigns for their business
CREATE POLICY "Users can view own business campaigns"
  ON campaigns FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Users can create campaigns for their business
CREATE POLICY "Users can create campaigns for own business"
  ON campaigns FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Users can update own business campaigns
CREATE POLICY "Users can update own business campaigns"
  ON campaigns FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE campaigns IS 'Reactivation campaigns for lead recovery';
COMMENT ON COLUMN campaigns.cadence_config IS 'JSON array of {day, time, channel, script} for Hummingbird protocol';
COMMENT ON COLUMN campaigns.metrics IS 'Denormalized metrics updated by triggers for fast dashboard reads';

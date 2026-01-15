-- =============================================================================
-- A2P 10DLC COMPLIANCE INFRASTRUCTURE
-- Critical for carrier deliverability and TCPA legal compliance
-- References: Technical Due Diligence Report - Section 3
-- =============================================================================

-- =============================================================================
-- 1. COMPLIANCE STATUS ENUMS
-- =============================================================================

-- A2P Registration status
CREATE TYPE a2p_registration_status AS ENUM (
  'not_registered',    -- No registration attempted
  'pending',           -- Submitted to TCR, awaiting approval
  'approved',          -- TCR approved, carriers will deliver
  'rejected',          -- TCR rejected, needs remediation
  'suspended',         -- Was approved but suspended
  'unverified'         -- Using toll-free/shared (high risk)
);

-- TCPA relationship type (determines consent window)
CREATE TYPE tcpa_relationship AS ENUM (
  'ebr',       -- Established Business Relationship: 18 month window
  'inquiry',   -- Inquiry only: 90 day window
  'express',   -- Express written consent: indefinite until revoked
  'unknown'    -- Unknown: treat as non-compliant
);

-- =============================================================================
-- 2. BUSINESS COMPLIANCE TABLE
-- Tracks A2P registration status per business
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- A2P 10DLC Registration
  a2p_status a2p_registration_status NOT NULL DEFAULT 'not_registered',
  tcr_brand_id VARCHAR(50),           -- The Campaign Registry Brand ID
  tcr_campaign_id VARCHAR(50),        -- TCR Campaign ID
  tcr_submission_date TIMESTAMPTZ,
  tcr_approval_date TIMESTAMPTZ,
  tcr_rejection_reason TEXT,
  
  -- Carrier trust scores (0-100)
  trust_score INTEGER DEFAULT 0,
  att_trust_score INTEGER DEFAULT 0,
  tmobile_trust_score INTEGER DEFAULT 0,
  verizon_trust_score INTEGER DEFAULT 0,
  
  -- Volume limits based on trust score
  daily_sms_limit INTEGER DEFAULT 50,  -- Start conservative
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Compliance documentation
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  opt_in_language TEXT,
  sample_messages TEXT[],
  
  -- Risk assessment
  is_high_risk_industry BOOLEAN DEFAULT FALSE,
  compliance_notes TEXT,
  last_compliance_review TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_compliance UNIQUE (business_id)
);

-- Index for quick lookups
CREATE INDEX idx_business_compliance_business ON business_compliance(business_id);
CREATE INDEX idx_business_compliance_status ON business_compliance(a2p_status);

-- =============================================================================
-- 3. CAMPAIGN COMPLIANCE FIELDS
-- Add compliance tracking to existing campaigns table
-- =============================================================================

-- Add compliance columns to campaigns
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS compliance_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compliance_check_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tcpa_compliant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tcpa_non_compliant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS opt_out_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS blocked_by_carrier_count INTEGER DEFAULT 0;

-- =============================================================================
-- 4. LEAD CONSENT TRACKING
-- Enhanced TCPA compliance for individual leads
-- =============================================================================

-- Add consent tracking to campaign_leads
ALTER TABLE campaign_leads
ADD COLUMN IF NOT EXISTS relationship_type tcpa_relationship DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS consent_language TEXT,
ADD COLUMN IF NOT EXISTS ebr_expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inquiry_expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_failures INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS carrier_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_delivery_status VARCHAR(50);

-- =============================================================================
-- 5. MESSAGE DELIVERY TRACKING
-- Enhanced tracking for carrier filtering detection
-- =============================================================================

-- Add carrier tracking to campaign_messages
ALTER TABLE campaign_messages
ADD COLUMN IF NOT EXISTS carrier VARCHAR(50),
ADD COLUMN IF NOT EXISTS carrier_filtered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS final_status VARCHAR(50);

-- =============================================================================
-- 6. DAILY VOLUME RESET FUNCTION
-- Resets daily send counters at midnight
-- =============================================================================

CREATE OR REPLACE FUNCTION reset_daily_sms_limits()
RETURNS void AS $$
BEGIN
  UPDATE business_compliance
  SET 
    messages_sent_today = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. COMPLIANCE CHECK FUNCTION
-- Validates a lead can be contacted based on TCPA rules
-- =============================================================================

CREATE OR REPLACE FUNCTION check_tcpa_compliance(
  p_lead_id UUID,
  p_relationship_type tcpa_relationship DEFAULT NULL
)
RETURNS TABLE (
  is_compliant BOOLEAN,
  reason TEXT,
  days_remaining INTEGER
) AS $$
DECLARE
  v_lead campaign_leads%ROWTYPE;
  v_relationship tcpa_relationship;
  v_days_since INTEGER;
  v_window_days INTEGER;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM campaign_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Lead not found', 0;
    RETURN;
  END IF;
  
  -- Check if opted out
  IF v_lead.opted_out_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Lead has opted out', 0;
    RETURN;
  END IF;
  
  -- Determine relationship type
  v_relationship := COALESCE(p_relationship_type, v_lead.relationship_type, 'unknown');
  
  -- Calculate days since last contact
  v_days_since := COALESCE(
    EXTRACT(DAY FROM NOW() - v_lead.original_last_contact)::INTEGER,
    9999
  );
  
  -- Determine compliance window based on relationship
  CASE v_relationship
    WHEN 'ebr' THEN 
      v_window_days := 548; -- 18 months
    WHEN 'inquiry' THEN 
      v_window_days := 90;  -- 90 days
    WHEN 'express' THEN 
      v_window_days := 99999; -- Indefinite
    ELSE 
      v_window_days := 0; -- Unknown = non-compliant
  END CASE;
  
  -- Check compliance
  IF v_relationship = 'unknown' THEN
    RETURN QUERY SELECT FALSE, 'Unknown relationship type - verify consent', 0;
  ELSIF v_days_since > v_window_days THEN
    RETURN QUERY SELECT FALSE, 
      format('Contact window expired (%s days since contact, %s day limit)', v_days_since, v_window_days),
      0;
  ELSE
    RETURN QUERY SELECT TRUE, 
      'Compliant',
      (v_window_days - v_days_since);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. VOLUME THROTTLE CHECK FUNCTION
-- Returns whether a business can send more messages today
-- =============================================================================

CREATE OR REPLACE FUNCTION can_send_sms(p_business_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  remaining_today INTEGER,
  daily_limit INTEGER,
  a2p_status a2p_registration_status
) AS $$
DECLARE
  v_compliance business_compliance%ROWTYPE;
BEGIN
  -- Get compliance record
  SELECT * INTO v_compliance 
  FROM business_compliance 
  WHERE business_id = p_business_id;
  
  -- If no compliance record, create one with conservative limits
  IF NOT FOUND THEN
    INSERT INTO business_compliance (business_id, daily_sms_limit)
    VALUES (p_business_id, 50)
    RETURNING * INTO v_compliance;
  END IF;
  
  -- Reset counter if new day
  IF v_compliance.last_reset_date < CURRENT_DATE THEN
    UPDATE business_compliance
    SET messages_sent_today = 0, last_reset_date = CURRENT_DATE
    WHERE business_id = p_business_id;
    v_compliance.messages_sent_today := 0;
  END IF;
  
  -- Return status
  RETURN QUERY SELECT 
    (v_compliance.messages_sent_today < v_compliance.daily_sms_limit),
    (v_compliance.daily_sms_limit - v_compliance.messages_sent_today),
    v_compliance.daily_sms_limit,
    v_compliance.a2p_status;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. INCREMENT SMS COUNTER FUNCTION
-- Call after each SMS is sent
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_sms_counter(p_business_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE business_compliance
  SET messages_sent_today = messages_sent_today + 1
  WHERE business_id = p_business_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. CAMPAIGN METRICS UPDATE TRIGGER
-- Updates delivery/reply rates when messages change
-- =============================================================================

CREATE OR REPLACE FUNCTION update_campaign_rates()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
  v_sent INTEGER;
  v_delivered INTEGER;
  v_responses INTEGER;
  v_opt_outs INTEGER;
  v_blocked INTEGER;
BEGIN
  v_campaign_id := COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  SELECT 
    COUNT(*) FILTER (WHERE direction = 'outbound' AND status IN ('sent', 'delivered')),
    COUNT(*) FILTER (WHERE direction = 'outbound' AND status = 'delivered'),
    COUNT(*) FILTER (WHERE direction = 'inbound'),
    COUNT(*) FILTER (WHERE is_opt_out = TRUE),
    COUNT(*) FILTER (WHERE carrier_filtered = TRUE)
  INTO v_sent, v_delivered, v_responses, v_opt_outs, v_blocked
  FROM campaign_messages
  WHERE campaign_id = v_campaign_id;
  
  UPDATE campaigns
  SET 
    messages_sent = v_sent,
    messages_delivered = v_delivered,
    responses_received = v_responses,
    delivery_rate = CASE WHEN v_sent > 0 THEN ROUND((v_delivered::DECIMAL / v_sent) * 100, 2) ELSE 0 END,
    reply_rate = CASE WHEN v_delivered > 0 THEN ROUND((v_responses::DECIMAL / v_delivered) * 100, 2) ELSE 0 END,
    opt_out_rate = CASE WHEN v_delivered > 0 THEN ROUND((v_opt_outs::DECIMAL / v_delivered) * 100, 2) ELSE 0 END,
    blocked_by_carrier_count = v_blocked,
    updated_at = NOW()
  WHERE id = v_campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS update_rates_on_message ON campaign_messages;
CREATE TRIGGER update_rates_on_message
  AFTER INSERT OR UPDATE ON campaign_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_rates();

-- =============================================================================
-- 11. RLS POLICIES
-- =============================================================================

ALTER TABLE business_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business compliance"
  ON business_compliance FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own business compliance"
  ON business_compliance FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE business_compliance IS 'A2P 10DLC registration and compliance tracking per business';
COMMENT ON FUNCTION check_tcpa_compliance IS 'Validates TCPA compliance: 18mo EBR, 90d inquiry windows';
COMMENT ON FUNCTION can_send_sms IS 'Volume throttling check - prevents carrier filtering';
COMMENT ON COLUMN business_compliance.trust_score IS 'TCR trust score determines daily limits: 0-49=50/day, 50-74=500/day, 75+=2000/day';

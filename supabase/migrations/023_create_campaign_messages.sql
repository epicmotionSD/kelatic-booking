-- =============================================================================
-- CAMPAIGN LEADS TABLE
-- Leads enrolled in a campaign with their current status
-- =============================================================================

-- Lead status in campaign
CREATE TYPE campaign_lead_status AS ENUM (
  'pending',      -- Not yet contacted
  'in_progress',  -- Cadence in progress
  'responded',    -- Got a response (positive or negative)
  'booked',       -- Converted to booking
  'opted_out',    -- Said STOP
  'completed',    -- Cadence finished, no response
  'failed'        -- Delivery failures
);

-- Response sentiment
CREATE TYPE response_sentiment AS ENUM ('positive', 'negative', 'neutral', 'opt_out');

CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Lead info (denormalized for performance)
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20) NOT NULL, -- E.164 format
  email VARCHAR(255),
  
  -- Segmentation
  segment lead_segment NOT NULL,
  days_since_contact INTEGER,
  estimated_value DECIMAL(10, 2),
  
  -- Source tracking
  source_platform VARCHAR(50), -- 'styleseat', 'tebra', 'square', etc.
  original_first_contact TIMESTAMPTZ,
  original_last_contact TIMESTAMPTZ,
  
  -- Campaign status
  status campaign_lead_status NOT NULL DEFAULT 'pending',
  current_cadence_day INTEGER DEFAULT 0,
  
  -- Response tracking
  has_responded BOOLEAN DEFAULT FALSE,
  response_sentiment response_sentiment,
  last_response_at TIMESTAMPTZ,
  last_response_text TEXT,
  
  -- Conversion
  converted_to_booking BOOLEAN DEFAULT FALSE,
  booking_id UUID, -- Reference to appointments table if converted
  booking_value DECIMAL(10, 2),
  
  -- TCPA compliance
  tcpa_compliant BOOLEAN DEFAULT TRUE,
  opted_out_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_business ON campaign_leads(business_id);
CREATE INDEX idx_campaign_leads_phone ON campaign_leads(phone);
CREATE INDEX idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX idx_campaign_leads_segment ON campaign_leads(segment);

-- Unique constraint: one lead per phone per campaign
CREATE UNIQUE INDEX idx_campaign_leads_unique ON campaign_leads(campaign_id, phone);

-- RLS
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business campaign leads"
  ON campaign_leads FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign leads for own business"
  ON campaign_leads FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own business campaign leads"
  ON campaign_leads FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );


-- =============================================================================
-- CAMPAIGN MESSAGES TABLE
-- Individual messages sent/received in a campaign
-- =============================================================================

-- Message direction
CREATE TYPE message_direction AS ENUM ('outbound', 'inbound');

-- Message status
CREATE TYPE message_status AS ENUM (
  'queued',
  'sent',
  'delivered',
  'failed',
  'undelivered',
  'received'  -- For inbound
);

-- Channel type
CREATE TYPE message_channel AS ENUM ('sms', 'mms', 'voice', 'email');

CREATE TABLE campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_lead_id UUID NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Message info
  direction message_direction NOT NULL,
  channel message_channel NOT NULL DEFAULT 'sms',
  
  -- Content
  to_phone VARCHAR(20) NOT NULL,
  from_phone VARCHAR(20) NOT NULL,
  body TEXT NOT NULL,
  media_urls JSONB, -- For MMS
  
  -- Cadence tracking
  cadence_day INTEGER, -- Which day of the Hummingbird cadence
  script_variant script_variant,
  
  -- Delivery status
  status message_status NOT NULL DEFAULT 'queued',
  
  -- Twilio tracking
  twilio_sid VARCHAR(50),
  twilio_status VARCHAR(50),
  error_code VARCHAR(10),
  error_message TEXT,
  
  -- Costs
  price DECIMAL(10, 4),
  price_unit VARCHAR(10) DEFAULT 'USD',
  
  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ, -- For inbound
  
  -- Response analysis (for inbound)
  sentiment response_sentiment,
  is_opt_out BOOLEAN DEFAULT FALSE,
  is_booking_intent BOOLEAN DEFAULT FALSE,
  extracted_datetime TEXT, -- "Friday at 2pm" extracted
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_lead ON campaign_messages(campaign_lead_id);
CREATE INDEX idx_campaign_messages_business ON campaign_messages(business_id);
CREATE INDEX idx_campaign_messages_twilio ON campaign_messages(twilio_sid);
CREATE INDEX idx_campaign_messages_status ON campaign_messages(status);
CREATE INDEX idx_campaign_messages_direction ON campaign_messages(direction);
CREATE INDEX idx_campaign_messages_created ON campaign_messages(created_at DESC);

-- RLS
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business messages"
  ON campaign_messages FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for own business"
  ON campaign_messages FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );


-- =============================================================================
-- FUNCTION: Update campaign metrics on message insert/update
-- =============================================================================

CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign metrics based on message status
  UPDATE campaigns
  SET metrics = (
    SELECT jsonb_build_object(
      'sent', COUNT(*) FILTER (WHERE status IN ('sent', 'delivered') AND direction = 'outbound'),
      'delivered', COUNT(*) FILTER (WHERE status = 'delivered' AND direction = 'outbound'),
      'failed', COUNT(*) FILTER (WHERE status IN ('failed', 'undelivered') AND direction = 'outbound'),
      'responses', COUNT(*) FILTER (WHERE direction = 'inbound'),
      'positive_responses', COUNT(*) FILTER (WHERE direction = 'inbound' AND sentiment = 'positive'),
      'negative_responses', COUNT(*) FILTER (WHERE direction = 'inbound' AND sentiment = 'negative'),
      'opt_outs', COUNT(*) FILTER (WHERE is_opt_out = TRUE)
    )
    FROM campaign_messages
    WHERE campaign_id = NEW.campaign_id
  ),
  sms_cost = (
    SELECT COALESCE(SUM(price), 0)
    FROM campaign_messages
    WHERE campaign_id = NEW.campaign_id AND direction = 'outbound'
  )
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_on_message
  AFTER INSERT OR UPDATE ON campaign_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_metrics();


-- =============================================================================
-- FUNCTION: Update lead status on response
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lead_on_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'inbound' THEN
    UPDATE campaign_leads
    SET 
      has_responded = TRUE,
      response_sentiment = NEW.sentiment,
      last_response_at = NEW.received_at,
      last_response_text = NEW.body,
      status = CASE 
        WHEN NEW.is_opt_out THEN 'opted_out'
        WHEN NEW.is_booking_intent THEN 'booked'
        ELSE 'responded'
      END,
      opted_out_at = CASE WHEN NEW.is_opt_out THEN NOW() ELSE opted_out_at END,
      updated_at = NOW()
    WHERE id = NEW.campaign_lead_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_on_inbound
  AFTER INSERT ON campaign_messages
  FOR EACH ROW
  WHEN (NEW.direction = 'inbound')
  EXECUTE FUNCTION update_lead_on_response();


-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE campaign_leads IS 'Leads enrolled in reactivation campaigns';
COMMENT ON TABLE campaign_messages IS 'All SMS/voice messages for campaigns (outbound and inbound)';
COMMENT ON COLUMN campaign_messages.cadence_day IS 'Day in the Hummingbird cadence (1, 2, 4, 7)';
COMMENT ON COLUMN campaign_messages.extracted_datetime IS 'AI-extracted booking intent like "Friday at 2pm"';

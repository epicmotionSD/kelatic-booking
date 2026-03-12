-- Migration: business_a2p_requests table
-- For tracking A2P 10DLC registration requests from businesses

CREATE TABLE IF NOT EXISTS business_a2p_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Business Information
  legal_name VARCHAR(255) NOT NULL,
  ein VARCHAR(50) NOT NULL,
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('llc', 'corporation', 'sole_proprietor', 'nonprofit')),
  website VARCHAR(500) NOT NULL,

  -- Address
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,

  -- Business Details
  vertical VARCHAR(100) NOT NULL,
  estimated_monthly_volume INTEGER DEFAULT 1000,

  -- Contact Information
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,

  -- Request Status
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN (
    'submitted',
    'brand_registered',
    'campaign_registered',
    'approved',
    'rejected',
    'cancelled'
  )),

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  brand_registered_at TIMESTAMPTZ,
  campaign_registered_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Registration Details (filled after submission to Twilio)
  twilio_brand_sid VARCHAR(100),
  twilio_campaign_sid VARCHAR(100),
  trust_score INTEGER,
  estimated_activation_date TIMESTAMPTZ,

  -- Rejection/Notes
  rejection_reason TEXT,
  internal_notes TEXT,

  -- Tracking
  requested_by UUID REFERENCES users(id),
  processed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_business_a2p_requests_business ON business_a2p_requests(business_id);
CREATE INDEX idx_business_a2p_requests_status ON business_a2p_requests(status);
CREATE INDEX idx_business_a2p_requests_submitted ON business_a2p_requests(submitted_at);

-- RLS Policies
ALTER TABLE business_a2p_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own business's A2P requests
CREATE POLICY "Users can view own business A2P requests"
ON business_a2p_requests FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid()
  )
);

-- Users can insert A2P requests for their business
CREATE POLICY "Users can create A2P requests"
ON business_a2p_requests FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid()
  )
);

-- Only admins can update A2P requests (status changes, approval, etc.)
CREATE POLICY "Admins can update A2P requests"
ON business_a2p_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = business_a2p_requests.business_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Add comment
COMMENT ON TABLE business_a2p_requests IS 'Tracks A2P 10DLC registration requests for SMS campaigns';

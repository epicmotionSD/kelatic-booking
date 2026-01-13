-- Migration: Create clients table for non-authenticated clients (imported from Amelia)
-- These are clients who book appointments but don't have Supabase auth accounts

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) DEFAULT '',
  email VARCHAR(255),
  phone VARCHAR(63),
  
  -- Optional details
  gender VARCHAR(10),
  birthday DATE,
  notes TEXT,
  
  -- Source tracking
  source VARCHAR(50) DEFAULT 'amelia_import', -- 'amelia_import', 'walk_in', 'online_booking', 'manual'
  amelia_id INTEGER, -- Original ID from Amelia for reference
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure email uniqueness per business (allow null emails)
  CONSTRAINT clients_email_business_unique UNIQUE NULLS NOT DISTINCT (business_id, email)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(business_id, last_name, first_name);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Business members can view their clients"
  ON clients FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business members can insert clients"
  ON clients FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business members can update their clients"
  ON clients FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

-- Service role bypass for imports
CREATE POLICY "Service role full access to clients"
  ON clients FOR ALL
  USING (auth.role() = 'service_role');

-- Updated timestamp trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE clients IS 'Non-authenticated clients (imported from Amelia or walk-ins)';

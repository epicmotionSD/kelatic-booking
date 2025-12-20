-- Trinity AI Content Generations
CREATE TABLE IF NOT EXISTS trinity_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('social', 'email', 'blog', 'video', 'education', 'graphics')),
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for filtering by type
CREATE INDEX idx_trinity_generations_type ON trinity_generations(type);

-- Index for recent generations
CREATE INDEX idx_trinity_generations_created_at ON trinity_generations(created_at DESC);

-- RLS Policies
ALTER TABLE trinity_generations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all generations
CREATE POLICY "Authenticated users can view generations"
  ON trinity_generations FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert generations
CREATE POLICY "Authenticated users can create generations"
  ON trinity_generations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role has full access"
  ON trinity_generations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

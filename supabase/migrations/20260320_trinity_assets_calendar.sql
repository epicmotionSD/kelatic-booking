-- Trinity Assets Library
CREATE TABLE IF NOT EXISTS trinity_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'graphic', 'document')),
  mime_type TEXT,
  file_size_bytes BIGINT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  uploaded_by TEXT DEFAULT 'admin',
  manager_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trinity Content Calendar Posts
CREATE TABLE IF NOT EXISTS trinity_calendar_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'email', 'all')),
  content_type TEXT NOT NULL CHECK (content_type IN ('reel', 'post', 'story', 'carousel', 'email', 'blog', 'video')),
  title TEXT,
  caption TEXT,
  hashtags TEXT,
  asset_id UUID REFERENCES trinity_assets(id) ON DELETE SET NULL,
  asset_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'scheduled', 'published', 'approved', 'needs_revision')),
  assigned_to TEXT,
  manager_notes TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trinity Managers
CREATE TABLE IF NOT EXISTS trinity_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'content_manager',
  focus TEXT DEFAULT 'content',
  color TEXT DEFAULT '#8b5cf6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default managers
INSERT INTO trinity_managers (name, email, role, focus, color) VALUES
  ('Manager 1', null, 'content_manager', 'Social & Video Content', '#8b5cf6'),
  ('Manager 2', null, 'content_manager', 'Email & Blog Content', '#d97706')
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trinity_assets_file_type ON trinity_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_trinity_assets_created_at ON trinity_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trinity_calendar_date ON trinity_calendar_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_trinity_calendar_status ON trinity_calendar_posts(status);
CREATE INDEX IF NOT EXISTS idx_trinity_calendar_assigned ON trinity_calendar_posts(assigned_to);

-- RLS
ALTER TABLE trinity_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trinity_calendar_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trinity_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON trinity_assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON trinity_calendar_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON trinity_managers FOR ALL USING (auth.role() = 'authenticated');

-- Storage bucket (run via Supabase dashboard if not using CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trinity-assets', 'trinity-assets', true);

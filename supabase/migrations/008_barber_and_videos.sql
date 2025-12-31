-- Migration 008: Add barber flag and stylist videos table
-- For video carousel feature and Barber Block sub-brand

-- Add is_barber flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_barber BOOLEAN DEFAULT false;

-- Create stylist_videos table for carousel content
CREATE TABLE IF NOT EXISTS stylist_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stylist_videos_stylist ON stylist_videos(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_videos_featured ON stylist_videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_barber ON profiles(is_barber) WHERE is_barber = true;

-- Trigger for updated_at (if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
        CREATE TRIGGER update_stylist_videos_updated_at
            BEFORE UPDATE ON stylist_videos
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable RLS on stylist_videos
ALTER TABLE stylist_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for stylist_videos
CREATE POLICY "Public can view featured videos"
    ON stylist_videos FOR SELECT
    USING (is_featured = true);

CREATE POLICY "Admins can manage videos"
    ON stylist_videos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner')
        )
    );

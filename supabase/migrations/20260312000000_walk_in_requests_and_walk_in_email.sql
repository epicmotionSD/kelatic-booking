-- Ensure walk-in request intake table exists and align appointments schema for walk-in email support

CREATE TABLE IF NOT EXISTS public.walk_in_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  heard_about TEXT,
  preferred_stylist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  preferred_stylist_name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.walk_in_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_walk_in_requests_business_created
  ON public.walk_in_requests (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_walk_in_requests_status
  ON public.walk_in_requests (status);

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS walk_in_email TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_walk_in_requests_updated_at'
    ) THEN
      CREATE TRIGGER update_walk_in_requests_updated_at
        BEFORE UPDATE ON public.walk_in_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    END IF;
  ELSIF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_walk_in_requests_updated_at'
    ) THEN
      CREATE TRIGGER update_walk_in_requests_updated_at
        BEFORE UPDATE ON public.walk_in_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

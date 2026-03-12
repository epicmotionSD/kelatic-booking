ALTER TABLE public.walk_in_requests
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_walk_in_requests_email
  ON public.walk_in_requests (email)
  WHERE email IS NOT NULL;

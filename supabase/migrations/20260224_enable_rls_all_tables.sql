-- Enable RLS on all 12 flagged public tables
-- All access is via service_role (createAdminClient), which bypasses RLS,
-- so no additional policies are needed. This blocks anon/authenticated direct access.

ALTER TABLE public.agent_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_communications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trinity_generations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_in_requests      ENABLE ROW LEVEL SECURITY;

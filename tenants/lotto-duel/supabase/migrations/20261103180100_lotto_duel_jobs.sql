CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Internal secret + functions base URL live in Vault (never in code)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'lotto_internal_secret') THEN
        PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'lotto_internal_secret', 'Shared secret for Lotto Duel internal Edge Function calls');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'lotto_functions_url') THEN
        PERFORM vault.create_secret('https://oospqrsutjiiejbikpof.supabase.co/functions/v1', 'lotto_functions_url', 'Lotto Duel Edge Functions base URL');
    END IF;
END $$;

-- Edge Functions verify the caller by asking the DB (service role only),
-- so the secret never has to be copied into function env vars.
CREATE OR REPLACE FUNCTION lotto_internal_secret_ok(p_secret TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT coalesce(p_secret, '') <> '' AND EXISTS (
        SELECT 1 FROM vault.decrypted_secrets WHERE name = 'lotto_internal_secret' AND decrypted_secret = p_secret
    );
$$;
REVOKE EXECUTE ON FUNCTION lotto_internal_secret_ok(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION lotto_internal_secret_ok(TEXT) TO service_role;

-- Fire the draw fetcher via pg_net (async)
CREATE OR REPLACE FUNCTION lotto_kick_fetch_draws()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lotto_functions_url') || '/lotto-fetch-draws',
        headers := jsonb_build_object('Content-Type', 'application/json',
            'x-lotto-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lotto_internal_secret')),
        body := '{}'::jsonb
    );
END $$;
REVOKE EXECUTE ON FUNCTION lotto_kick_fetch_draws() FROM PUBLIC, anon, authenticated;

-- Powerball: Mon/Wed/Sat · Mega Millions: Tue/Fri · both ~11pm ET.
-- NY Open Data can lag, so check twice: 05:15 UTC and 13:15 UTC daily.
-- The fetcher is idempotent (UNIQUE game+draw_date), so extra runs are free.
SELECT cron.schedule('lotto-fetch-draws', '15 5,13 * * *', $$SELECT lotto_kick_fetch_draws()$$);

-- Safety net: retry any notifications still pending (e.g. a dropped wake-up)
SELECT cron.schedule('lotto-alerts-sweep', '*/10 * * * *', $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lotto_functions_url') || '/lotto-alerts',
        headers := jsonb_build_object('Content-Type', 'application/json',
            'x-lotto-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lotto_internal_secret')),
        body := '{}'::jsonb)
    WHERE EXISTS (SELECT 1 FROM public.lotto_notifications WHERE status = 'pending' AND created_at < now() - interval '2 minutes')
$$);

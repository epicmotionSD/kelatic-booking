// Shared helpers for LottoDuel Edge Functions
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

export const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

// Internal callers (pg_cron / pg_net) send x-lotto-secret; the DB checks it
// against Vault, so the secret never lives in function env vars.
export async function isInternalCaller(req: Request): Promise<boolean> {
  const secret = req.headers.get("x-lotto-secret");
  if (!secret) return false;
  const { data, error } = await admin.rpc("lotto_internal_secret_ok", { p_secret: secret });
  return !error && data === true;
}

export const APP_URL = (Deno.env.get("LOTTO_APP_URL") ?? "https://kelatic.com").replace(/\/$/, "");

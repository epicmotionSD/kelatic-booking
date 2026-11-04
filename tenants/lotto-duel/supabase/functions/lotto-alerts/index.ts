// lotto-alerts — drains the lotto_notifications outbox and sends SMS via Twilio.
// Woken asynchronously by pg_net after the draw trigger queues rows, plus a
// 10-minute pg_cron sweep. Nothing here runs inside a DB transaction.
//
// Send rules:
//   • LOTTO_SMS_ENABLED must be "true" (kill switch — off until A2P is approved)
//   • recipient has a phone + explicit opt-in and hasn't replied STOP
//   • hit/win texts only for leagues whose Commissioner is Pro
//   • capacity (upgrade) texts go to the Commissioner
import { admin, APP_URL, isInternalCaller, json } from "../_shared/lotto.ts";

const SMS_ON = Deno.env.get("LOTTO_SMS_ENABLED") === "true";
const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
const MSG_SERVICE = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
const MAX_ATTEMPTS = 3;

type Note = {
  id: string;
  user_id: string;
  pool_id: string | null;
  kind: "hit" | "win" | "capacity";
  payload: Record<string, unknown>;
  attempts: number;
};

function body(n: Note): string {
  const p = n.payload as Record<string, string | number>;
  const link = n.pool_id ? `${APP_URL}/lotto/league/${n.pool_id}` : `${APP_URL}/lotto`;
  let text: string;
  switch (n.kind) {
    case "hit":
      text = `Lotto Duel: you hit a number in ${p.pool_name}! ${p.matches}/${p.needed} on your card. ${link}`;
      break;
    case "win":
      text = `Lotto Duel: you completed your card in ${p.pool_name}! You won the league. ${link}`;
      break;
    case "capacity":
      text = `Lotto Duel: ${p.player_name} tried to join ${p.pool_name}, but it's full at ${p.limit} players. ` +
        `Upgrade to Pro for 100 slots: ${link}`;
      break;
  }
  return `${text} Reply STOP to opt out.`;
}

async function finish(id: string, status: "sent" | "skipped" | "failed" | "pending", detail: string) {
  await admin.from("lotto_notifications").update({ status, detail }).eq("id", id);
}

async function sendSms(to: string, text: string) {
  const params = new URLSearchParams({ To: to, Body: text });
  if (MSG_SERVICE) params.set("MessagingServiceSid", MSG_SERVICE);
  else params.set("From", FROM!);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, code: data?.code as number | undefined, sid: data?.sid as string | undefined, message: data?.message as string | undefined };
}

Deno.serve(async (req) => {
  if (!(await isInternalCaller(req))) return json({ error: "unauthorized" }, 401);

  const { data: notes, error } = await admin.rpc("lotto_claim_notifications", { p_limit: 50 });
  if (error) return json({ error: error.message }, 500);

  const results: Record<string, number> = {};
  const bump = (k: string) => (results[k] = (results[k] ?? 0) + 1);

  for (const n of (notes ?? []) as Note[]) {
    if (!SMS_ON) { await finish(n.id, "skipped", "sms_disabled"); bump("sms_disabled"); continue; }
    if (!SID || !TOKEN || (!FROM && !MSG_SERVICE)) { await finish(n.id, "skipped", "twilio_not_configured"); bump("no_twilio"); continue; }

    const { data: player } = await admin.from("lotto_players")
      .select("phone_e164, sms_opt_in_at, sms_opted_out_at").eq("id", n.user_id).single();
    if (!player?.phone_e164 || !player.sms_opt_in_at || player.sms_opted_out_at) {
      await finish(n.id, "skipped", "no_consent"); bump("no_consent"); continue;
    }

    if (n.kind !== "capacity" && n.pool_id) {
      const { data: pool } = await admin.from("lotto_pools")
        .select("commissioner:lotto_players!lotto_pools_commissioner_id_fkey(tier)")
        .eq("id", n.pool_id).single();
      // deno-lint-ignore no-explicit-any
      if ((pool as any)?.commissioner?.tier !== "pro") {
        await finish(n.id, "skipped", "free_tier"); bump("free_tier"); continue;
      }
    }

    if (n.kind === "hit" && n.pool_id) {
      // A winner gets the win text, not a hit text for the same draw
      const { data: entry } = await admin.from("lotto_entries")
        .select("won_at").eq("pool_id", n.pool_id).eq("user_id", n.user_id).single();
      if (entry?.won_at) { await finish(n.id, "skipped", "superseded_by_win"); bump("superseded"); continue; }
    }

    try {
      const r = await sendSms(player.phone_e164, body(n));
      if (r.ok) { await finish(n.id, "sent", r.sid ?? "sent"); bump("sent"); continue; }
      if (r.code === 21610) {
        // Recipient replied STOP — honor it permanently
        await admin.from("lotto_players").update({ sms_opted_out_at: new Date().toISOString() }).eq("id", n.user_id);
        await finish(n.id, "skipped", "opted_out"); bump("opted_out"); continue;
      }
      await finish(n.id, n.attempts >= MAX_ATTEMPTS ? "failed" : "pending", `twilio ${r.code}: ${r.message}`);
      bump("error");
    } catch (e) {
      await finish(n.id, n.attempts >= MAX_ATTEMPTS ? "failed" : "pending", String(e));
      bump("error");
    }
  }
  return json({ ok: true, processed: notes?.length ?? 0, results });
});

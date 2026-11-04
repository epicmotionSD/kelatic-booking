// lotto-create-checkout — Commissioner upgrade to Pro via Stripe Checkout.
// Called from the browser with the player's Supabase JWT.
// Body: { plan: "monthly" | "yearly", return_path?: "/lotto/league/<id>" }
import Stripe from "npm:stripe@17.2.1";
import { admin, APP_URL, json } from "../_shared/lotto.ts";

const stripe = new Stripe(Deno.env.get("LOTTO_STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});
const PRICES: Record<string, string | undefined> = {
  monthly: Deno.env.get("LOTTO_STRIPE_PRICE_MONTHLY"),
  yearly: Deno.env.get("LOTTO_STRIPE_PRICE_YEARLY"),
};

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const { data: auth } = await admin.auth.getUser(token ?? "");
  const user = auth?.user;
  if (!user) return json({ error: "not_authenticated" }, 401, cors);

  const { plan = "monthly", return_path = "/lotto" } = await req.json().catch(() => ({}));
  const price = PRICES[plan];
  if (!price) return json({ error: "billing_not_configured" }, 503, cors);
  // Only allow same-site relative return paths
  const path = typeof return_path === "string" && return_path.startsWith("/lotto") ? return_path : "/lotto";

  const { data: player } = await admin.from("lotto_players")
    .select("stripe_customer_id, tier").eq("id", user.id).single();
  if (!player) return json({ error: "player_not_found" }, 404, cors);
  if (player.tier === "pro") return json({ error: "already_pro" }, 409, cors);

  let customer = player.stripe_customer_id as string | null;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email, metadata: { lotto_user_id: user.id } });
    customer = c.id;
    await admin.from("lotto_players").update({ stripe_customer_id: customer }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { lotto_user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${APP_URL}${path}?upgraded=1`,
    cancel_url: `${APP_URL}${path}`,
  });

  return json({ url: session.url }, 200, cors);
});

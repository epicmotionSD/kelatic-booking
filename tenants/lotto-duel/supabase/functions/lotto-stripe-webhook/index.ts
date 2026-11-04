// lotto-stripe-webhook — flips Commissioners between free and pro.
// Stripe endpoint events: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted
import Stripe from "npm:stripe@17.2.1";
import { admin, json } from "../_shared/lotto.ts";

const stripe = new Stripe(Deno.env.get("LOTTO_STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});
const WEBHOOK_SECRET = Deno.env.get("LOTTO_STRIPE_WEBHOOK_SECRET") ?? "";
const crypto = Stripe.createSubtleCryptoProvider();
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

async function userForCustomer(customer: string, meta?: Stripe.Metadata | null) {
  if (meta?.lotto_user_id) return meta.lotto_user_id;
  const { data } = await admin.from("lotto_players").select("id").eq("stripe_customer_id", customer).single();
  return data?.id as string | undefined;
}

async function setTier(user: string, tier: "free" | "pro", customer?: string) {
  const { error } = await admin.rpc("lotto_set_tier", { p_user: user, p_tier: tier, p_stripe_customer: customer ?? null });
  if (error) throw error;
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !WEBHOOK_SECRET) return json({ error: "unsigned" }, 400);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), sig, WEBHOOK_SECRET, undefined, crypto);
  } catch (e) {
    return json({ error: `bad signature: ${e}` }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.client_reference_id) {
          await setTier(s.client_reference_id, "pro", s.customer as string);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await userForCustomer(sub.customer as string, sub.metadata);
        if (user) {
          const active = event.type !== "customer.subscription.deleted" && PRO_STATUSES.has(sub.status);
          await setTier(user, active ? "pro" : "free", sub.customer as string);
        }
        break;
      }
    }
  } catch (e) {
    // 500 makes Stripe retry
    return json({ error: String(e) }, 500);
  }
  return json({ received: true });
});

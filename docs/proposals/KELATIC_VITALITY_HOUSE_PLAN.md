# Kelatic Vitality House — Architecture & Build Plan

**Status:** Plan for review (no feature code written yet)
**Date:** 2026-06-19
**Decisions locked in:** New tenant inside `kelatic-booking` · physical/cafe products · plan + schema first

---

## 1. What we're building

Kelatic Vitality House is a **plant-based wellness café** — herbal teas, detox lemonades, sea moss
drinks, mushroom coffee/matcha, organic smoothies, and dairy-free breakfast. It runs as a **new
tenant** on the existing `kelatic-booking` platform (the same codebase that already powers Kelatic
Hair Lounge and Barber Block), reusing the same Stripe account, auth, and admin patterns.

Four surfaces to deliver:

| # | Surface | Who uses it | Purpose |
|---|---------|-------------|---------|
| 1 | **Landing** | Public | Brand story + menu preview + "Order Now" CTA |
| 2 | **Dashboard** | Owner/staff | Live orders, revenue, product management entry point |
| 3 | **Product entry** | Owner/staff | Create/edit menu items, categories, modifiers, prices |
| 4 | **Customer checkout** | Public | Browse menu → cart → pay (Stripe) → pickup/ship |

---

## 2. Why this fits the existing system (evaluation summary)

The repo is a mature, production **multi-tenant SaaS** (internally "x3o.ai platform"):
Next.js 15 App Router · Supabase (Postgres + RLS, ~30 migrations) · Stripe · Twilio · SendGrid ·
Vercel. Kelatic is the flagship tenant.

**Directly reusable for Vitality House — no rebuild:**

- **Stripe wrapper** `lib/stripe/index.ts` — PaymentIntents, Terminal/card-present POS, connection
  tokens, refunds, customers, `constructWebhookEvent`. We add product checkout on top of this; we do
  not write a new payment layer.
- **Multi-tenancy** `lib/tenant/*` + `middleware.ts` — resolves tenant by subdomain **and custom
  domain** against the `businesses` table. `kelaticvitalityhouse.com` plugs in as a custom domain.
  `lib/tenant/server.ts` already special-cases custom domains (e.g. kelatic.com) — we extend that map.
- **Admin shell** `app/admin/*` (services, clients, reports, **pos**) — the product-entry and
  dashboard pages follow these exact conventions.
- **Service-role write pattern** — `app/api/pos/create-payment/route.ts` uses `createAdminClient()`
  to insert `payments` while bypassing RLS. Public storefront order-writes use the identical pattern.
- **Webhook pipeline** `app/api/webhooks/stripe/route.ts` already verifies signatures and updates
  `payments` — we branch it on `metadata.order_id` to also fulfill product orders.

**The one real gap:** everything is anchored to **appointments**. `payments` keys to
`appointment_id`; there is **no products or orders schema**. That is exactly what the companion
migration (`vitality_house_commerce.sql`) adds — and it links back into `payments` so the proven
Stripe/webhook flow records product sales without a parallel system.

---

## 3. Data model (see `vitality_house_commerce.sql`)

New tables, all tenant-scoped by `business_id` with RLS mirroring migration `010`:

- **`product_categories`** — menu sections (Herbal Teas, Sea Moss Drinks, Breakfast…).
- **`products`** — menu items. Price stored in **cents** (matches Stripe), `tags[]` for
  dairy-free/no-refined-sugar badges, optional `track_inventory`/`stock_quantity`, and a
  `fulfillment` flag (pickup / shipping / both).
- **`product_option_groups`** + **`product_options`** — café modifiers (Size, Hot/Cold, Add-ins)
  with `price_delta_cents`. Lets one product flex without a row per variant.
- **`orders`** — the checkout anchor (parallels `appointments`). Guest checkout supported, money in
  cents, status lifecycle `pending→paid→preparing→ready→completed`, pickup time or shipping address,
  Stripe PaymentIntent / Checkout Session IDs.
- **`order_items`** — line items with **snapshotted** name/price/options so past orders survive menu
  edits.
- **`payments.order_id`** — new nullable FK so the existing payments table and Stripe webhook serve
  both appointments and orders.

**Money convention:** new tables use integer **cents** end-to-end (the existing `payments` table uses
`DECIMAL` dollars; the order→payment boundary converts once, consistent with `lib/currency.ts#toCents`).

---

## 4. Routes to build

Naming follows existing conventions (`app/(public)/*`, `app/admin/*`, `app/api/*`).

### Public storefront
- `app/(public)/shop/page.tsx` — menu grid by category (server component, reads active catalog).
- `app/(public)/shop/[slug]/page.tsx` — product detail + modifier selection → add to cart.
- `app/(public)/cart/page.tsx` — cart review (cart state client-side; no DB until checkout).
- `app/(public)/checkout/page.tsx` — customer info + Stripe **Payment Element** + pickup/ship choice.
- `app/(public)/checkout/success/page.tsx` — confirmation + order number.

### Landing
- Tenant-aware home: extend `app/page.tsx` / `app/(public)` so the Vitality House domain renders the
  wellness landing (hero, philosophy, "What We Offer", featured items, Order Now). Mirrors how
  Barber Block already gets its own identity off the same root.

### Admin (owner/staff)
- `app/admin/products/page.tsx` — product list + categories.
- `app/admin/products/new/page.tsx` & `app/admin/products/[id]/page.tsx` — **product entry** form
  (name, category, price, tags, image, modifiers, inventory toggle).
- `app/admin/orders/page.tsx` — live order queue (new → preparing → ready → completed).
- Dashboard: extend `app/admin` landing / `app/api/dashboard/overview` with order count + revenue
  tiles for the tenant.

### API
- `GET  app/api/shop/products` — public catalog read (tenant-scoped).
- `POST app/api/shop/checkout` — create `order` + `order_items`, create Stripe PaymentIntent
  (reuse `createPaymentIntent`, add `metadata.order_id`), return `clientSecret`. Service-role write.
- `app/api/admin/products/*` — CRUD for products/categories/modifiers (admin-guarded).
- `app/api/admin/orders/*` — list + status transitions.
- Extend `app/api/webhooks/stripe/route.ts` — on `payment_intent.succeeded`, if `metadata.order_id`,
  mark order `paid` + write `payments` row (mirrors current appointment branch).

---

## 5. Checkout payment flow (reusing Stripe)

```
Customer → /checkout
   POST /api/shop/checkout
        → insert orders (status=pending) + order_items   [service role]
        → createPaymentIntent({ amount: total_cents, metadata:{ order_id }})
        → return clientSecret
   <Stripe Payment Element> confirms on client
   Stripe → /api/webhooks/stripe  (payment_intent.succeeded)
        → order.status = paid, insert payments(order_id, ...)
        → (optional) SendGrid order confirmation, staff notification
   Staff → /admin/orders moves paid → preparing → ready → completed
```

Online card uses `createPaymentIntent` (already supports `automatic_payment_methods`). In-store sales
of the same products can later reuse the **Terminal** path (`createTerminalPaymentIntent` +
`/api/pos/*`) since the owner already has the reader — same Stripe account, same `orders` table.

---

## 6. Build phases (proposed)

1. **Phase 0 — Foundation (this doc + migration).** Approve schema, apply
   `050_vitality_house_commerce.sql`, register `kelaticvitalityhouse.com` in the tenant custom-domain
   map + DNS. *No user-facing change yet.*
2. **Phase 1 — Product entry + Dashboard.** Admin CRUD for categories/products/modifiers; order
   queue shell; seed the real menu. Owner can manage the catalog.
3. **Phase 2 — Storefront + Checkout.** Public menu, cart, Stripe Payment Element checkout, webhook
   fulfillment, confirmation emails.
4. **Phase 3 — Landing + polish.** Branded wellness landing page, featured items, SEO/metadata,
   the wellness disclaimer ("we do not diagnose, treat, or cure disease"), pickup scheduling.

Each phase is independently shippable and reviewable.

---

## 7. Open items to confirm before Phase 1

- **Fulfillment:** pickup-only to start, or pickup **and** shipping? (Schema supports both; affects
  checkout UI + tax/shipping calc.)
- **Tax:** flat rate, Stripe Tax, or none initially?
- **Tips:** offer tipping at checkout? (Schema has `tip_cents`.)
- **Brand palette/logo:** the migration uses placeholder herbal-green hex — swap for real brand
  colors + logo when available.
- **Accounts:** guest checkout only, or optional customer login (reuse existing Supabase auth)?
- **Stripe:** same Stripe account/keys as Kelatic (single dashboard), confirmed — any need for a
  separate Stripe Connect account per the `platform_fee_percent` model?

---

## 8. Risk / safety notes

- **Tenant isolation:** every new table carries `business_id` + RLS; storefront reads are public but
  scoped to active rows; all writes go through service-role API routes (same trust boundary as the
  current POS).
- **Wellness compliance:** product copy and landing must keep the non-medical disclaimer; avoid
  health claims on individual products.
- **No destructive changes:** migration is purely additive (`CREATE TABLE IF NOT EXISTS`,
  `ADD COLUMN IF NOT EXISTS`); it does not alter appointment/booking behavior.

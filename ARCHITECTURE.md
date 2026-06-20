# Architecture

x3o is a multi-tenant, AI-powered platform for local service and retail businesses. One Next.js app and
one Supabase database serve every tenant; each business gets its own branding, domain, data isolation, and
a team of AI agents. Kelatic Hair Lounge is the flagship tenant; Barber Block and Kelatic Vitality House
run on the same codebase.

## Stack

- **Next.js 15** (App Router) · React 18 · TypeScript · Tailwind CSS
- **Supabase** (Postgres + Row-Level Security + Auth) — project `kelatic` (`evdogroqltyvwdddkgwv`)
- **Stripe** — online payments + in-person Terminal (POS)
- **Twilio** (SMS) · **SendGrid / Resend** (email) · **Anthropic Claude** (AI agents & content)
- **Vercel** (hosting) · **Inngest** (background jobs)

## Multi-tenancy

A request is resolved to a tenant by host, then everything is scoped by `business_id`.

- Resolution lives in `lib/tenant/` (`server.ts`, `index.ts`) and `middleware.ts`. It maps
  subdomains (`kelatic.x3o.ai`), custom domains (`kelatic.com`, `barbershopblock.ai`,
  `kelaticvitalityhouse.com`), and `*.localhost` to a `businesses.slug`.
- The resolved slug is written to the `x-tenant-slug` cookie/header (not httpOnly) so client code can read it.
- Tenants live in the `businesses` table (migration `010_multi_tenant.sql`) with `business_settings`,
  `business_members` (owner/admin/stylist roles), and per-tenant branding/feature flags.
- RLS isolates tenant data; public reads (storefront, catalog) are allowed for active rows; privileged
  writes go through service-role API routes (`createAdminClient`).

Current tenants: `kelatic` (Kelatic Hair Lounge, also serves Barber Block) and `vitality`
(Kelatic Vitality House, `business_type = 'cafe'`).

## Two business models on one platform

### Appointments (salon / barbershop)
Services, stylists, schedules, availability, appointments, and `payments` (anchored to `appointment_id`).
Admin under `app/admin/*`; public booking under `app/(public)/book`.

### Commerce (café / retail) — Kelatic Vitality House
Added in migration `050_vitality_house_commerce.sql` (pickup-only):

- `product_categories`, `products` (price in **cents**, tags, optional inventory),
  `product_option_groups` / `product_options` (modifiers), `orders`, `order_items`.
- `payments.order_id` links the existing Stripe/webhook pipeline to product orders.
- Admin: `app/admin/products` (catalog), `app/admin/orders` (queue), `app/admin/register` (in-person POS),
  and a commerce dashboard at `app/admin/page.tsx` (branches by tenant).
- Storefront: `app/(public)/shop`, `app/(public)/checkout` (Stripe Payment Element),
  `app/(public)/checkout/success`. APIs: `app/api/shop/products`, `app/api/shop/checkout`.
- The Stripe webhook (`app/api/webhooks/stripe`) fulfills product orders by branching on
  `payment_intent.metadata.order_id`.

The admin nav adapts per tenant (`app/admin/layout.tsx`): commerce tenants get a simplified top level
(Dashboard, Point of Sale, Orders, Products) with the salon tools tucked under a collapsible **Booking** group.

## AI agents — three primary agents

The owner interacts with **three** agents; each owns modules, each module exposes tools. Source of truth:
`lib/agents/primary/` (`types.ts`, `registry.ts`, `index.ts`).

| Agent | Owns | Backed by |
|---|---|---|
| **Attract** | Content Studio, Campaigns | `lib/agents/modules/content` (Trinity), `/api/agents/marketing/*` |
| **Retain** | Win-Back, Rebooking & Scheduling | `/api/reactivation/*`, `/api/agents/scheduling/*` |
| **Serve** | Client Support, Reminders & Notifications | `/api/agents/support/*`, `/api/notifications/*` |

- Trinity content generation now lives in `lib/agents/modules/content` (tools `runContentGeneration`,
  `listContentHistory`, `getContentStats`); the `app/api/trinity/*` routes are thin delegators.
- Admin UI is driven entirely by the registry: `app/admin/agents` (board) and `app/admin/agents/[id]`
  (detail). Runnable tools have an inline action (`components/agents/actions/*`) that calls the real
  endpoint — content/campaign generation, find-gaps, ghost-clients, tickets, knowledge search, support chat.
- Underneath sit older layers still in the codebase: the "Board of Directors" agents
  (`lib/agents/types.ts`, CEO/CTO/CMO/CFO — power the Command Center) and the raw functional agents
  (`lib/agents/functional/*`). The three primary agents are the owner-facing layer on top.

## Marketing site (x3o.ai)

The platform root domain renders `app/platform/page.tsx` (middleware rewrites `/` → `/platform`). It's a
single-scroll, owner-facing marketing site (dark + mint accent) that showcases the three agents
(Attract / Retain / Serve), Kelatic proof metrics, and pricing. Positioning is captured in
`docs/proposals/X3O_POSITIONING.md`.

## Key directories

```
app/
  (public)/        storefront, booking, shop, checkout, landing pages
  admin/           tenant admin (dashboard, agents, products, orders, register, appointments, …)
  platform/        x3o.ai marketing site + intel
  api/             route handlers (shop, admin, agents, trinity, webhooks, notifications, …)
components/        UI (agents/, pos/, home/, dashboard/, booking/, …)
lib/
  agents/primary/  the 3-agent registry (source of truth)
  agents/modules/  agent modules (content/ = Trinity)
  agents/functional/  older functional agents
  tenant/          multi-tenant resolution
  stripe/          Stripe wrapper (PaymentIntents, Terminal, webhooks)
  commerce/        cart + admin guard for commerce
  supabase/        client/server/admin Supabase clients
supabase/migrations/  schema (010 multi-tenant, 050 commerce, …)
docs/                 current docs (+ proposals/, archive/)
```

## Environments

- **Production** runs on the live host(s); the admin login is at `/login` on the tenant/platform host.
- **Local** (`next dev`) uses the same Supabase project. Note: a session cookie from production does not
  carry to `localhost` — log in again on localhost to access the backend there.

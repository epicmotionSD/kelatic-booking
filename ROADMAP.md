# x3o.ai / KeLatic Booking — Implementation Roadmap

> Aligned with OpenConductor Q1 2026 Roadmap
> Approved: February 11, 2026

---

## TL;DR

Ship three things to hit the $1,700 MRR target: **(1)** Stripe subscription billing so the $1,500 sprint and $297/mo plan actually collect money, **(2)** integrate the campaign dashboard prototype into the admin panel with real data, and **(3)** automate tenant onboarding so new salons go from signup → payment → live subdomain without manual intervention.

**Decisions locked:**
- Stripe Checkout (hosted) — no custom payment forms
- No free trial — payment required upfront
- Sprint purchase required before $297/mo subscription
- Auto-provision subdomains via Vercel API on payment
- All secrets stored as Vercel environment variables
- Campaign dashboard integrated into `app/admin/`, not a separate `/dashboard` route

---

## Current State

| Area | Status | Gap |
|------|--------|-----|
| Booking system | **LIVE** | — |
| Admin dashboard | **LIVE** (13 sections) | No campaign/hot-leads pages |
| AI chat (Kela) | **LIVE** | — |
| Trinity content generation | **LIVE** | — |
| Revenue recovery engine | **Built** (Hummingbird cadence) | MCP client mocked |
| Campaign management | **Built** (DB + APIs) | Dashboard uses mock data |
| Onboarding wizard | **Built** (6-step flow) | No payment collection |
| Platform landing page | **Built** ($1,500 + $297/mo) | Buttons non-functional |
| Stripe integration | **Built** (payments, POS, refunds) | No subscriptions |
| Multi-tenant architecture | **Built** (subdomain routing, RLS) | Manual provisioning |

---

## Phase 1: Stripe Subscription Billing

**Goal:** Collect revenue. Sprint purchases and monthly subscriptions.
**Estimate:** ~2 days

### 1.1 Create Stripe Products & Prices

- Create in Stripe Dashboard (test mode first, then live):
  - **Product:** "7-Day Revenue Sprint" → **Price:** $1,500 one-time
  - **Product:** "Trinity Agent" → **Price:** $297/mo recurring (no trial)
- Store price IDs as Vercel env vars:
  - `STRIPE_PRICE_SPRINT` — one-time sprint price ID
  - `STRIPE_PRICE_MONTHLY` — recurring monthly price ID

### 1.2 Database Migration

**New file:** `supabase/migrations/XXX_subscription_billing.sql`

Add columns to `businesses` table:
- `stripe_customer_id TEXT` — Stripe customer for billing
- `stripe_subscription_id TEXT` — active subscription reference
- `subscription_status TEXT DEFAULT 'none'` — (`none`, `active`, `past_due`, `canceled`)
- `subscription_plan TEXT` — maps to product tier
- `sprint_purchased_at TIMESTAMPTZ` — when sprint was bought
- `sprint_completed_at TIMESTAMPTZ` — when sprint finished (unlocks monthly)

### 1.3 Checkout API

**New file:** `app/api/checkout/route.ts`

- `POST { priceId, businessId, successUrl, cancelUrl }`
- Creates/retrieves Stripe customer → stores `stripe_customer_id` on business
- Calls `stripe.checkout.sessions.create()`:
  - Mode: `payment` (sprint) or `subscription` (monthly)
  - Metadata: `{ businessId }`
- Returns `{ url }` for client redirect
- Guard: monthly plan requires `sprint_purchased_at IS NOT NULL`

### 1.4 Wire Onboarding Sprint Step

**Modify:** `app/(platform)/onboarding/page.tsx`

- After `handleSubmit()` creates business record (line ~268), redirect to checkout API with `STRIPE_PRICE_SPRINT`
- Checkout success URL: `/onboarding/success?session_id={CHECKOUT_SESSION_ID}`

### 1.5 Wire $297/mo Button

**Modify:** `app/platform/page.tsx` (line ~441)

- Replace disabled "Available After Sprint" button:
  - If authenticated + sprint purchased → redirect to checkout with `STRIPE_PRICE_MONTHLY`
  - If authenticated + no sprint → show "Complete Sprint First" tooltip
  - If not authenticated → redirect to `/login?redirect=/platform`

### 1.6 Extend Stripe Webhook

**Modify:** `app/api/webhooks/stripe/route.ts`

Add handlers for:
- `checkout.session.completed` → update `subscription_status`, `sprint_purchased_at`, activate business
- `customer.subscription.updated` → sync `subscription_status`
- `customer.subscription.deleted` → set `subscription_status = 'canceled'`
- `invoice.payment_failed` → set `subscription_status = 'past_due'`

### 1.7 Type Safety

**Modify:** `types/database.ts`

- Add `Business` interface with all columns including new subscription fields
- Run `npm run db:types` after migration

### Verification

- [ ] Create test subscription in Stripe test mode
- [ ] Webhook updates `businesses.subscription_status` correctly
- [ ] Sprint purchase gates monthly subscription access
- [ ] Onboarding flow redirects to Stripe → returns to success page
- [ ] $297/mo button works for sprint-completed users

---

## Phase 2: Campaign Dashboard Integration

**Goal:** Replace mock dashboard prototype with real admin pages connected to live campaign data.
**Estimate:** ~2 days

### 2.1 Add Admin Navigation

**Modify:** `app/admin/layout.tsx` (NAV_ITEMS array, line ~24)

Insert after "Marketing":
- **Campaigns** → `/admin/campaigns` (icon: `Megaphone`)
- **Hot Leads** → `/admin/hot-leads` (icon: `Flame`)

### 2.2 Campaigns List Page

**New file:** `app/admin/campaigns/page.tsx`

- Port from `dashboard-ui/app/dashboard/campaigns/page.tsx`
- Wire to existing `GET /api/campaigns` (already returns correct shape)
- Features: search, status filter, progress bars, revenue per campaign
- 30s polling for live updates
- "New Campaign" button → `/admin/campaigns/new`

### 2.3 Campaign Detail Page

**New file:** `app/admin/campaigns/[campaignId]/page.tsx`

- Port from `dashboard-ui/app/dashboard/campaigns/[campaignId]/page.tsx`
- Wire to existing `GET /api/campaigns/[campaignId]`
- Features: real-time metrics (10s refresh), hot leads panel, activity feed, pause/resume/cancel
- `PATCH /api/campaigns/[campaignId]` for actions (already exists)

### 2.4 New Campaign Wizard

**New file:** `app/admin/campaigns/new/page.tsx`

- Port from `dashboard-ui/app/dashboard/campaigns/new/page.tsx`
- Steps: Upload CSV → Parse & Segment → Configure (name, segment, script, timing) → Launch
- Wire to existing APIs:
  - `POST /api/reactivation/parse`
  - `POST /api/reactivation/analyze`
  - `POST /api/reactivation/launch`

### 2.5 Hot Leads Page

**New file:** `app/admin/hot-leads/page.tsx`

- Port from `dashboard-ui/app/dashboard/hot-leads/page.tsx`
- Replace mock data with new API endpoint
- Features: search, status filter (new/contacted/booked/no_show), Call/Text buttons, status quick-update, detail modal

### 2.6 Hot Leads API

**New file:** `app/api/hot-leads/route.ts`

- `GET` — query `campaign_leads` joined with `campaigns`:
  - Filter: `sentiment = 'positive'`, optionally filter by `status`
  - Return: lead name, phone, email, response text, extracted intent, campaign name, segment, responded_at, status
- `PATCH` — update lead status (contacted, booked, no_show) with notes

### 2.7 Revenue Recovery KPIs on Admin Dashboard

**Modify:** `app/admin/page.tsx`

Add "Revenue Recovery" card:
- Active campaigns count
- Total recovered revenue (sum of `campaigns.total_revenue`)
- Hot leads awaiting contact (count of positive-sentiment uncontacted leads)
- Link to `/admin/campaigns` and `/admin/hot-leads`

### Verification

- [ ] Navigate to `/admin/campaigns` → see real campaign data from database
- [ ] Click into campaign → metrics match DB, 10s refresh works
- [ ] Hot leads page shows positive-sentiment leads from `campaign_leads`
- [ ] Pause/resume/cancel campaign works from detail page
- [ ] New campaign wizard uploads CSV and creates campaign
- [ ] Admin dashboard shows recovery KPIs

---

## Phase 3: Self-Service Tenant Onboarding

**Goal:** New salon signs up → pays → gets live subdomain automatically.
**Estimate:** ~1.5 days

### 3.1 Gate Business Activation on Payment

**Modify:** `app/api/onboarding/route.ts`

- Create business with `is_active: false`, `plan_status: 'pending_payment'`
- Return `businessId` to client
- Client redirects to Stripe Checkout (Phase 1 checkout API)
- On `checkout.session.completed` webhook → set `is_active: true`, `plan_status: 'active'`

### 3.2 Auto-Provision Subdomain

**Modify:** `app/api/webhooks/stripe/route.ts` (inside `checkout.session.completed` handler)

After activating business:
- Call Vercel API: `POST https://api.vercel.com/v10/projects/{projectId}/domains`
- Body: `{ name: "{slug}.x3o.ai" }`
- Env vars required:
  - `VERCEL_API_TOKEN` — Vercel API token with project access
  - `VERCEL_PROJECT_ID` — project to add domain to

### 3.3 Post-Payment Success Page

**New file:** `app/(platform)/onboarding/success/page.tsx`

- Verify Stripe session via `stripe.checkout.sessions.retrieve(session_id)`
- Display:
  - "Your dashboard is ready at `{slug}.x3o.ai`"
  - Next steps: add services, configure business hours, invite team
  - CTA → `{slug}.x3o.ai/admin`

### 3.4 Tenant Access Guard

**Modify:** `middleware.ts`

- When routing to tenant admin pages (`/admin/*`), check `businesses.is_active`
- If `is_active = false` → redirect to a "Subscription Required" page
- Skip check for platform routes (`x3o.ai/*`)

### Verification

- [ ] Full onboarding flow: signup → upload CSV → sprint payment → business activated
- [ ] Subdomain `{slug}.x3o.ai` resolves after payment
- [ ] Inactive tenant redirected from admin to subscription page
- [ ] Success page shows correct subdomain and next steps

---

## Phase 4: Cleanup & Polish

**Goal:** Remove prototype code, update documentation, ensure type safety.
**Estimate:** ~0.5 days

### 4.1 Remove Dashboard Prototype

- Delete `dashboard-ui/` directory (all pages now live in `app/admin/`)

### 4.2 Update Documentation

- Update `docs/X3O_PLATFORM.md` pricing section — remove "Planned" labels, add implementation details
- Update `README.md` if it references the old dashboard-ui

### 4.3 Type Safety

- Ensure `Business` type in `types/database.ts` covers full schema
- Verify all admin pages import types from `types/database.ts`
- Run `npm run db:types` to regenerate from Supabase

---

## File Change Summary

| Action | Path | Phase |
|--------|------|-------|
| **Create** | `supabase/migrations/XXX_subscription_billing.sql` | 1 |
| **Create** | `app/api/checkout/route.ts` | 1 |
| **Modify** | `app/(platform)/onboarding/page.tsx` | 1 |
| **Modify** | `app/platform/page.tsx` | 1 |
| **Modify** | `app/api/webhooks/stripe/route.ts` | 1 |
| **Modify** | `types/database.ts` | 1 |
| **Modify** | `lib/stripe/index.ts` | 1 |
| **Modify** | `app/admin/layout.tsx` | 2 |
| **Create** | `app/admin/campaigns/page.tsx` | 2 |
| **Create** | `app/admin/campaigns/[campaignId]/page.tsx` | 2 |
| **Create** | `app/admin/campaigns/new/page.tsx` | 2 |
| **Create** | `app/admin/hot-leads/page.tsx` | 2 |
| **Create** | `app/api/hot-leads/route.ts` | 2 |
| **Modify** | `app/admin/page.tsx` | 2 |
| **Modify** | `app/api/onboarding/route.ts` | 3 |
| **Create** | `app/(platform)/onboarding/success/page.tsx` | 3 |
| **Modify** | `middleware.ts` | 3 |
| **Delete** | `dashboard-ui/` | 4 |
| **Modify** | `docs/X3O_PLATFORM.md` | 4 |

---

## Environment Variables Required

| Variable | Purpose | Where |
|----------|---------|-------|
| `STRIPE_PRICE_SPRINT` | $1,500 one-time price ID | Vercel |
| `STRIPE_PRICE_MONTHLY` | $297/mo recurring price ID | Vercel |
| `VERCEL_API_TOKEN` | Auto-provision subdomains | Vercel |
| `VERCEL_PROJECT_ID` | Target project for domain aliases | Vercel |

---

## Success Criteria

- [ ] A new salon can complete onboarding → pay $1,500 → get a live subdomain automatically
- [ ] Sprint-completed salons can subscribe to $297/mo from the platform page
- [ ] Admin dashboard shows campaign metrics, hot leads, and revenue recovery KPIs with real data
- [ ] Inactive tenants are blocked from admin access
- [ ] Existing booking flow (`npm run test:booking`) still passes
- [ ] `businesses` table tracks subscription lifecycle via Stripe webhooks

---

*Last updated: February 11, 2026*
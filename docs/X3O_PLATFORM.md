# x3o.ai - Platform Architecture

> **"The Shopify for Platform Builds"**

x3o.ai is a platform-as-a-service that enables businesses to launch fully-featured platforms using pre-built templates and AI-powered sub-agents.

---

## Platform Vision

```
x3o.ai (Platform-as-a-Service)
│
├── Platform Templates
│   ├── Trinity Booking ← Salon/Service booking (LIVE)
│   ├── [Future: E-commerce template]
│   ├── [Future: Membership/Community template]
│   └── [Future: Course/Academy template]
│
├── Sub-Agents (AI Integrations)
│   ├── AI Marketing Automation ← Content generation (LIVE)
│   ├── [Future: AI Customer Support]
│   ├── [Future: AI Analytics & Insights]
│   └── [Future: AI Scheduling Optimization]
│
├── MCP Servers (via OpenConductor)
│   ├── Custom tool integrations
│   ├── Third-party API connectors
│   ├── Business-specific automation
│   └── White-label customizations
│
└── Tenants
    ├── kelatic.com → First production tenant
    └── [Future tenants...]
```

---

## Core Components

### 1. Platform Templates

Pre-built, white-label platforms that businesses can deploy instantly.

| Template | Description | Status |
|----------|-------------|--------|
| **Trinity Booking** | Full-featured booking system for salons, barbershops, spas | LIVE |
| **Commerce** | Product catalog, in-person POS + online checkout, pickup/shipping fulfillment | LIVE (Vitality House) |
| Membership | Community, subscriptions, content | Planned |
| Academy | Courses, training, certifications | Planned |

**Trinity Booking Features:**
- Multi-tenant with subdomain routing
- Service & stylist management
- Online booking with Stripe payments
- POS terminal integration
- Client management & history
- Email/SMS notifications
- Newsletter system
- Blog/SEO pages

**Commerce Features:**

- Product categories + modifiers (option groups, price deltas)
- Public storefront with cart + Stripe Payment Element checkout
- Admin orders queue + in-person register (Stripe Terminal)
- `payments.order_id` reuses the same Stripe/webhook pipeline as bookings
- Tenant-aware admin nav (commerce vs salon)

### 2. Primary Agents (with Modules)

The owner interacts with **three** AI agents. Each owns modules; each module exposes tools. Source of truth lives in `lib/agents/primary/registry.ts` and is the same shape every UI surface and API caller consumes.

| Primary Agent | Modules (LIVE) | What it does |
| ------------- | -------------- | ------------ |
| **Attract** | Content Studio (Trinity), Campaigns | Generates on-brand content and runs email / SMS / social campaigns |
| **Retain** | Win-Back, Rebooking & Scheduling | Reactivates ghost clients and fills calendar gaps |
| **Serve** | Client Support, Reminders & Notifications, Loyalty & Rewards | 24/7 client answers, appointment reminders, two-sided loyalty + referrals |

**Loyalty & Rewards (newest module on Serve):**

- Flexible JSONB earn rules — same schema covers appointment-per-visit *and* commerce-per-dollar
- Polymorphic rewards catalog (percent_off / amount_off / free_product / free_service / free_addon)
- Two-sided referrals — referee earns on signup, referrer earns on referee's first paid event
- Customer-facing widget on checkout success + booking confirmation
- Commerce checkout redemption (account only debited after Stripe confirms succeeded)
- Optional cross-brand wallet via `program_group_id` (one owner, multiple tenants)

**Primary orchestrator:** `PrimaryOrchestrator` at `/api/agents/orchestrator` routes intent across the three agents, dispatches tools, and serves the readiness snapshot the admin dashboard renders.

**Planned next:**

- AI Analytics (cross-tenant business insights, predictions)
- AI Scheduling Optimization (demand forecasting on top of the existing Rebooking module)

### 3. MCP Servers (OpenConductor)

Custom Model Context Protocol servers for tool integrations.

**Architecture:**
```
OpenConductor
├── MCP Server Registry
│   ├── Stripe MCP (payments, invoices)
│   ├── SendGrid MCP (email campaigns)
│   ├── Twilio MCP (SMS notifications)
│   ├── Calendar MCP (scheduling)
│   └── Custom business MCPs
│
└── Tool Orchestration
    ├── Claude AI integration
    ├── Sub-agent coordination
    └── Workflow automation
```

**Use Cases:**
- Custom integrations for specific business needs
- Third-party API standardization
- AI tool access for sub-agents
- White-label customizations

---

## Multi-Tenant Architecture

### Tenant Isolation

```
Database Schema:
├── businesses (tenant registry)
│   ├── id, name, slug, custom_domain
│   ├── primary_color, secondary_color
│   ├── stripe_account_id
│   └── settings (JSON)
│
├── business_settings (per-tenant config)
│   ├── ai_brand_context
│   ├── ai_hashtags, ai_tone
│   └── feature flags
│
└── All data tables have business_id FK
    ├── services, categories
    ├── stylists, clients
    ├── appointments, transactions
    └── trinity_generations
```

### Subdomain Routing

```
Request Flow:
1. User visits: kelatic.x3o.ai
2. Middleware extracts subdomain: "kelatic"
3. Lookup business by slug
4. Inject tenant context into request
5. All queries scoped by business_id
```

### Custom Domains

```
kelatic.com → CNAME → kelatic.x3o.ai
                      ↓
              Middleware detects custom domain
                      ↓
              Maps to kelatic tenant
```

---

## Tenant Onboarding

### Self-Service Flow (Future)

1. **Sign Up** at x3o.ai
2. **Choose Template** (Trinity Booking, etc.)
3. **Configure Business**
   - Name, logo, colors
   - Services, pricing
   - Team members
4. **Connect Payments** (Stripe Connect)
5. **Launch** → tenant.x3o.ai

### Current Process (Manual)

1. Create business record in Supabase
2. Configure business_settings
3. Set up Stripe Connect account
4. Configure DNS (if custom domain)
5. Seed initial data (services, stylists)

---

## Pricing Model (Planned)

| Plan | Monthly | Features |
|------|---------|----------|
| **Starter** | $49 | 1 location, basic features, 50 AI generations |
| **Professional** | $149 | Unlimited locations, all features, unlimited AI |
| **Agency** | $499 | White-label, multiple tenants, API access |

Revenue splits:
- Platform fee: x3o.ai
- Payment processing: Stripe Connect (tenant receives direct)
- Custom development: Per-project

---

## Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Server Components

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Edge Functions (Vercel)
- Stripe Connect (Payments)

**AI/Integrations:**
- Anthropic Claude (AI generation)
- OpenConductor (MCP servers)
- SendGrid (Email)
- Twilio (SMS)

**Infrastructure:**
- Vercel (Hosting)
- Supabase Cloud (Database)
- Cloudflare (DNS/CDN)

---

## Live Tenants

### Tenant 1 — Kelatic Hair Lounge

**Business:** Kelatic Hair Lounge
**Domain:** kelatic.com / kelatic.x3o.ai
**Template:** Trinity Booking
**Location:** Houston, TX

**Sub-brands:**

- **Loc Shop** - Professional loc services
- **Loc Academy** - Training & education
- **Loc Vitality** - Products & wellness

**Configuration:**

```json
{
  "slug": "kelatic",
  "name": "Kelatic Hair Lounge",
  "tagline": "Houston's Premier Loc Specialists",
  "primary_color": "#f59e0b",
  "secondary_color": "#eab308",
  "business_type": "salon",
  "ai_tone": "warm"
}
```

### Tenant 2 — Kelatic Vitality House

**Business:** Kelatic Vitality House (same owner, separate brand)
**Domain:** kelaticvitalityhouse.com
**Template:** Commerce
**Location:** Houston, TX

Plant-based wellness café running on the Commerce template (products, modifiers, public storefront, in-person Stripe Terminal register). Same Supabase project + Stripe account; isolated by `business_id`.

**Configuration:**

```json
{
  "slug": "vitality",
  "name": "Kelatic Vitality House",
  "business_type": "cafe",
  "primary_color": "#3f7d4f",
  "ai_tone": "warm"
}
```

Loyalty programs for both tenants share a `program_group_id`, so the same owner can flip on a cross-brand wallet later without a schema change.

---

## Roadmap

### Phase 1: Foundation — COMPLETE

- [x] Trinity Booking template
- [x] Multi-tenant architecture
- [x] AI Marketing Automation (now Content Studio under Attract)
- [x] Kelatic as first tenant
- [x] Production deployment (Vercel + Supabase, custom domain on kelatic.com)
- [x] Stripe live (PaymentIntents + Terminal for in-person; webhook pipeline shared with commerce)

### Phase 2: Platform Growth — IN PROGRESS

**Shipped:**

- [x] Second template — Commerce (Vitality House live)
- [x] Three-agent registry (Attract / Retain / Serve) + primary orchestrator
- [x] Additional modules — Loyalty & Rewards, two-sided Referrals, Reminders & Notifications
- [x] Multi-tenant scaling — two tenants live on the same codebase + DB

**Next:**

- [ ] Self-service tenant onboarding (signup → choose template → configure → live subdomain)
- [ ] Agency dashboard (operator-level: cross-tenant health, revenue, plan status)
- [ ] OpenConductor MCP integration (custom tool servers exposed to the agents)
- [ ] Stripe Connect (per-tenant payout, not just shared account)
- [ ] Additional sub-agents (AI Analytics, AI Scheduling Optimization)

### Phase 3: Scale

- [ ] Marketplace for templates
- [ ] Third-party sub-agent ecosystem
- [ ] White-label reseller program
- [ ] Enterprise features

---

## File Structure

```
kelatic-booking/  (Trinity Booking Template)
├── app/
│   ├── (public)/          # Public booking pages
│   ├── admin/             # Admin dashboard
│   │   └── trinity/       # AI Marketing sub-agent
│   └── api/               # API routes
├── components/
│   ├── booking/           # Booking UI
│   └── trinity/           # AI Marketing UI
├── lib/
│   ├── supabase/          # Database client
│   ├── stripe/            # Payment processing
│   ├── tenant.ts          # Multi-tenant utilities
│   └── trinity/           # AI Marketing logic
├── middleware.ts          # Subdomain routing
└── docs/
    ├── X3O_PLATFORM.md    # This document
    └── AI_MARKETING_PLAN.md
```

---

## Contact

**Platform:** x3o.ai
**First Tenant:** kelatic.com
**Development:** OpenConductor MCP integration

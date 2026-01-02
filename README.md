# x3o.ai - White-Label Booking Platform

A multi-tenant, AI-powered booking platform for salons, barbershops, spas, and beauty agencies. Built on the proven Kelatic booking system.

**Platform URL:** x3o.ai
**First Tenant:** kelatic.x3o.ai (Kelatic Hair Lounge)

## Platform Architecture

```
x3o.ai (Root)
├── Landing page, signup, onboarding
├── Platform admin & billing
└── Tenant subdomains:
    ├── kelatic.x3o.ai    → Kelatic Hair Lounge
    ├── example.x3o.ai    → Future tenant
    └── *.x3o.ai          → Any new business
```

## Tech Stack

- **Frontend**: Next.js 15+ (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Auth**: Supabase Auth (multi-tenant aware)
- **Payments**: Stripe Connect (platform + tenant payouts)
- **AI**: Claude API (Anthropic) - Trinity AI Content Generation
- **Email**: SendGrid (per-tenant configuration)
- **SMS**: Twilio (per-tenant configuration)
- **Deployment**: Vercel (wildcard subdomains)

## Multi-Tenant Features

### Database Schema
- `businesses` - Core tenant table with branding, settings, Stripe Connect
- `business_settings` - Extended configuration (hours, policies, AI settings)
- `business_members` - Team association (owner, admin, stylist roles)
- `business_id` - Foreign key on all tenant-scoped tables

### Tenant Isolation
- **Subdomain Routing**: Middleware extracts tenant from `*.x3o.ai`
- **Row-Level Security**: All queries filtered by `business_id`
- **Dynamic Theming**: CSS variables injected from business branding
- **Scoped AI**: Trinity AI uses tenant's brand context

### White-Label Capabilities
- Custom colors, logo, favicon per tenant
- Custom domains (enterprise tier)
- Branded email templates
- Tenant-specific AI voice/tone

## Features

### Platform (x3o.ai)
- [x] Landing page with pricing tiers
- [x] Business onboarding wizard (4 steps)
- [x] Tenant provisioning (auto-creates subdomain)
- [x] AI Board of Directors showcase
- [ ] Platform admin dashboard
- [ ] Subscription billing (Stripe)

### Per-Tenant Features
- [x] Public booking portal (5-step wizard)
- [x] Service & stylist management
- [x] Appointment management (list/calendar)
- [x] Client management with history
- [x] Email/SMS notifications (branded)
- [x] Stripe payments with deposits
- [x] POS terminal integration
- [x] Trinity AI content generation
- [x] AI chatbot for booking assistance
- [x] Reports & analytics
- [ ] Newsletter campaigns
- [ ] Academy/class registration

## Project Structure

```
kelatic-booking/
├── app/
│   ├── (platform)/                    # x3o.ai root domain
│   │   ├── page.tsx                   # Landing page
│   │   ├── onboarding/page.tsx        # Business signup wizard
│   │   ├── login/page.tsx             # Platform login
│   │   └── signup/page.tsx            # Create account
│   ├── (public)/                      # Tenant public pages
│   │   ├── page.tsx                   # Tenant landing
│   │   ├── book/page.tsx              # Booking wizard
│   │   └── appointments/[id]/         # View/reschedule
│   ├── (admin)/                       # Tenant admin dashboard
│   │   ├── layout.tsx                 # Admin layout
│   │   ├── page.tsx                   # Dashboard home
│   │   ├── appointments/              # Manage bookings
│   │   ├── clients/                   # Client CRM
│   │   ├── services/                  # Service CRUD
│   │   ├── team/                      # Staff management
│   │   ├── trinity/                   # AI content studio
│   │   ├── pos/                       # Point of sale
│   │   └── settings/                  # Business settings
│   └── api/
│       ├── onboarding/route.ts        # Create new tenant
│       ├── bookings/                  # Booking endpoints
│       ├── trinity/                   # AI generation
│       └── webhooks/stripe/           # Payment webhooks
├── lib/
│   ├── tenant/
│   │   ├── index.ts                   # Tenant types
│   │   ├── context.tsx                # React context/hooks
│   │   └── server.ts                  # Server-side helpers
│   ├── trinity/
│   │   ├── prompts.ts                 # Multi-tenant AI prompts
│   │   └── service.ts                 # Generation service
│   ├── notifications/service.ts       # Branded email/SMS
│   └── supabase/                      # Database clients
├── components/
│   ├── board/                         # AI Board of Directors
│   ├── booking/                       # Booking wizard
│   ├── trinity/                       # AI content UI
│   └── pos/                           # POS components
├── middleware.ts                       # Subdomain routing
└── supabase/migrations/
    └── 010_multi_tenant_full.sql      # Multi-tenant schema
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (with Connect enabled)
- Anthropic API key
- SendGrid account
- Twilio account

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Platform account for Connect)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Platform
NEXT_PUBLIC_ROOT_DOMAIN=x3o.ai
NEXT_PUBLIC_APP_URL=https://x3o.ai

# Cron Security
CRON_SECRET=your-random-secret
```

### Installation

```bash
# Clone and install
cd kelatic-booking
npm install

# Run migrations
npx supabase db push

# Or run SQL directly in Supabase Dashboard:
# supabase/migrations/010_multi_tenant_full.sql

# Start development
npm run dev
```

### Local Subdomain Testing

Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 kelatic.localhost
127.0.0.1 test.localhost
```

Visit:
- `http://localhost:3000` - Platform landing
- `http://kelatic.localhost:3000` - Kelatic tenant

## Deployment

### Vercel Configuration

1. **Import to Vercel**
   - Connect GitHub repo
   - Framework: Next.js (auto-detected)

2. **Add Environment Variables**
   - All variables from `.env.local`
   - Set `NEXT_PUBLIC_ROOT_DOMAIN=x3o.ai`

3. **Configure Domains**
   - Add `x3o.ai` as primary domain
   - Add `*.x3o.ai` as wildcard subdomain

4. **DNS Configuration**
   ```
   A     @        76.76.21.21
   CNAME *        cname.vercel-dns.com
   CNAME www      cname.vercel-dns.com
   ```

5. **Deploy**
   - Push to main branch
   - Vercel auto-deploys

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | $49/mo | 1 location, unlimited bookings, 50 AI generations |
| **Professional** | $149/mo | 5 locations, POS terminal, custom domain, unlimited AI |
| **Agency** | $497/mo | Unlimited locations, white-label, API access, resell |

## AI Board of Directors

Four AI agents power the platform:

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Atlas** | CEO | Strategic planning, task delegation, decision approval |
| **Nova** | CTO | Platform management, template deployment, tech ops |
| **Pulse** | CMO | Growth marketing, campaign optimization, lead gen |
| **Apex** | CFO | Revenue analytics, subscription management, forecasting |

## Tenant Onboarding Flow

1. **Business Info** - Name, email, URL slug, business type
2. **Branding** - Colors, logo, tagline
3. **Services** - Default services by business type
4. **Integrations** - Stripe, SendGrid, Twilio (optional)
5. **AI Board** - Meet your AI team
6. **Complete** - Launch platform

## Trinity AI Content Generation

Multi-tenant AI content with business context:

- **Social Posts** - Instagram/Facebook with brand hashtags
- **Email Campaigns** - Branded templates
- **Blog Articles** - SEO-optimized content
- **Video Scripts** - TikTok/Reels ready
- **Education** - Client aftercare guides
- **Promo Graphics** - Marketing copy

Each generation uses tenant's:
- Business name, tagline, brand voice
- Primary/secondary colors
- AI context and custom hashtags
- Service catalog

## Database Migrations

```bash
# Push all migrations
npx supabase db push

# Or run specific migration in SQL Editor
# Copy contents of supabase/migrations/010_multi_tenant_full.sql
```

## API Endpoints

### Platform
- `POST /api/onboarding` - Create new tenant

### Per-Tenant (with business_id)
- `GET/POST /api/bookings` - Manage appointments
- `POST /api/trinity/generate` - AI content generation
- `GET /api/availability` - Check stylist slots
- `POST /api/notifications/send` - Send email/SMS

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

Proprietary - All rights reserved.

---

**Kelatic Hair Lounge** is the anchor tenant and proof-of-concept for the x3o.ai platform.

For support: support@x3o.ai

# x3o.ai Platform - Deployment Guide

**Platform Domain:** x3o.ai
**First Tenant:** kelatic.x3o.ai (Kelatic Hair Lounge)
**Architecture:** Multi-tenant with subdomain routing

---

## Pre-Deployment Checklist

### 1. Database Setup (Supabase)

- [ ] **Verify Production Project**
  - Confirm you're using the production Supabase project
  - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - Copy anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy service role key → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Run Multi-Tenant Migration**
  - Go to Supabase Dashboard → SQL Editor
  - Paste contents of `supabase/migrations/010_multi_tenant_full.sql`
  - Run the migration
  - Verify tables: `businesses`, `business_settings`, `business_members`

- [ ] **Verify Kelatic Tenant**
  - Check `businesses` table has row with `slug = 'kelatic'`
  - Confirm existing data has `business_id` populated

### 2. Stripe Configuration

#### Platform Account (for Stripe Connect)

- [ ] **Enable Connect**
  - Go to [Stripe Dashboard](https://dashboard.stripe.com) → Connect
  - Set up your platform account
  - Configure branding for connected accounts

- [ ] **Platform API Keys**
  - Developers → API Keys → Live keys
  - `STRIPE_SECRET_KEY` → `sk_live_xxx`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_xxx`

- [ ] **Create Webhook Endpoint**
  - Developers → Webhooks → Add endpoint
  - URL: `https://x3o.ai/api/webhooks/stripe`
  - Events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `checkout.session.completed`
    - `account.updated` (for Connect)
  - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

- [ ] **Terminal Location (for Kelatic POS)**
  - Terminal → Locations → Create location
  - Name: "Kelatic Hair Lounge"
  - Address: 9430 Richmond Ave, Houston, TX 77063
  - Copy Location ID → `STRIPE_TERMINAL_LOCATION_ID`

### 3. SendGrid Email Setup

- [ ] **Domain Authentication**
  - Authenticate `x3o.ai` domain
  - Add DNS records as instructed
  - Wait for verification

- [ ] **API Key**
  - Settings → API Keys → Create (Full Access)
  - Copy → `SENDGRID_API_KEY`

Note: Per-tenant email settings stored in `business_settings` table.

### 4. Twilio SMS Setup

- [ ] **Production Credentials**
  - Copy Account SID → `TWILIO_ACCOUNT_SID`
  - Copy Auth Token → `TWILIO_AUTH_TOKEN`

- [ ] **Phone Number**
  - Buy or use existing number
  - Copy → `TWILIO_PHONE_NUMBER` (format: +1XXXXXXXXXX)

Note: Per-tenant SMS settings stored in `business_settings` table.

### 5. Anthropic AI

- [ ] **Get API Key**
  - Go to [Anthropic Console](https://console.anthropic.com)
  - Create/copy API key → `ANTHROPIC_API_KEY`

---

## Vercel Deployment

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Multi-tenant platform ready for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `/`
   - Build Command: `npm run build`

### Step 3: Environment Variables

Add ALL variables in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | Platform account |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | |
| `STRIPE_TERMINAL_LOCATION_ID` | `tml_xxx` | For Kelatic POS |
| `ANTHROPIC_API_KEY` | `sk-ant-xxx` | |
| `SENDGRID_API_KEY` | `SG.xxx` | Platform default |
| `TWILIO_ACCOUNT_SID` | `ACxxx` | Platform default |
| `TWILIO_AUTH_TOKEN` | `xxx` | |
| `TWILIO_PHONE_NUMBER` | `+1xxx` | |
| `CRON_SECRET` | (generate 32-char) | |
| `NEXT_PUBLIC_APP_URL` | `https://x3o.ai` | |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `x3o.ai` | **Critical for routing** |

### Step 4: Configure Domains

1. In Vercel → Settings → Domains

2. **Add Root Domain:**
   - Add `x3o.ai`
   - Add `www.x3o.ai` (redirect to apex)

3. **Add Wildcard Subdomain:**
   - Add `*.x3o.ai`
   - This enables `kelatic.x3o.ai`, `newbusiness.x3o.ai`, etc.

### Step 5: DNS Configuration

At your domain registrar (e.g., Cloudflare, Namecheap):

```dns
Type   Name    Value
A      @       76.76.21.21
CNAME  www     cname.vercel-dns.com
CNAME  *       cname.vercel-dns.com
```

Wait for DNS propagation (can take up to 48 hours, usually faster).

### Step 6: Deploy

- Push to main → Vercel auto-deploys
- SSL certificates are automatic

---

## Post-Deployment Testing

### Platform Root (x3o.ai)

- [ ] Landing page loads with pricing
- [ ] "Get Started" links to signup
- [ ] AI Board of Directors section visible

### Tenant Routing (kelatic.x3o.ai)

- [ ] Subdomain resolves correctly
- [ ] Kelatic branding loads (colors, logo)
- [ ] Booking flow accessible at `/book`

### Booking Flow Test

1. Go to `kelatic.x3o.ai/book`
2. Select a service
3. Select a stylist
4. Pick date/time
5. Enter client info
6. Complete payment (use test card first)
7. Verify:
   - [ ] Confirmation page shows
   - [ ] Email received
   - [ ] SMS received
   - [ ] Appointment in admin dashboard

### Admin Dashboard Test

1. Go to `kelatic.x3o.ai/admin`
2. Login as admin user
3. Verify:
   - [ ] Dashboard loads with business context
   - [ ] Appointments visible
   - [ ] Trinity AI works with Kelatic branding

### Onboarding Flow Test

1. Go to `x3o.ai/onboarding`
2. Create test business (use unique slug like `testbiz`)
3. Complete wizard
4. Verify:
   - [ ] Business created in database
   - [ ] `testbiz.x3o.ai` resolves
   - [ ] Default services seeded

### POS Test (Kelatic)

1. Go to `kelatic.x3o.ai/admin/pos`
2. Test payment terminal connection
3. Process test transaction

---

## Rollback Procedure

If critical issues arise:

1. **Revert Deployment**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Database Rollback** (if needed)
   - Supabase Dashboard → Database → Backups
   - Restore from point-in-time backup

---

## Monitoring

### Vercel

- Check deployment logs for errors
- Monitor function execution times

### Supabase

- Database → Logs for query issues
- Auth → Logs for authentication problems

### Stripe

- Developers → Webhooks → View logs
- Check for failed webhook deliveries

---

## Adding New Tenants

After deployment, new businesses can onboard:

1. User signs up at `x3o.ai/signup`
2. Completes onboarding wizard at `x3o.ai/onboarding`
3. System automatically:
   - Creates `businesses` record
   - Seeds default services
   - Provisions subdomain
4. New tenant accessible at `slug.x3o.ai`

---

## Custom Domain Support (Enterprise)

For enterprise tenants with custom domains:

1. Add custom domain in Vercel
2. Update `businesses.custom_domain` field
3. Set `custom_domain_verified = true` after DNS verification
4. Middleware will route custom domain to correct tenant

---

## Go-Live Checklist

- [ ] All environment variables set in Vercel
- [ ] DNS propagated for x3o.ai and *.x3o.ai
- [ ] SSL certificates active
- [ ] Kelatic booking flow tested end-to-end
- [ ] Payment processing verified (real transaction)
- [ ] Email notifications working
- [ ] SMS notifications working
- [ ] Admin dashboard accessible
- [ ] Trinity AI generating content
- [ ] Onboarding flow creates new tenants

**Go-Live Date:** ___________

**Sign-off:**
- [ ] Platform owner approved
- [ ] Kelatic (anchor tenant) approved
- [ ] All critical tests passed

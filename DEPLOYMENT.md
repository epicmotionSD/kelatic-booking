# Kelatic Booking - Production Deployment Checklist

**Target Domain:** kelatic.com
**Anchor Customer:** Rockal
**MVP Scope:** Booking + AI Receptionist + POS

---

## Pre-Deployment Checklist

### 1. Stripe Configuration (CRITICAL)

- [ ] **Switch to Live Stripe Keys**
  - Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
  - Copy your **live** keys (not test keys starting with `sk_test_`)
  - `STRIPE_SECRET_KEY` → `sk_live_xxx`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_xxx`

- [ ] **Create Webhook Endpoint**
  - Go to Stripe Dashboard → Developers → Webhooks
  - Add endpoint: `https://kelatic.com/api/webhooks/stripe`
  - Select events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `checkout.session.completed`
  - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

- [ ] **Set Up Terminal Location** (for POS)
  - Go to Stripe Dashboard → Terminal → Locations
  - Create location: "Kelatic Hair Lounge" with salon address
  - Copy Location ID → `STRIPE_TERMINAL_LOCATION_ID`

### 2. SendGrid Email Setup

- [ ] **Domain Authentication**
  - Go to [SendGrid](https://app.sendgrid.com) → Settings → Sender Authentication
  - Authenticate `kelatic.com` domain (add DNS records)
  - Verify domain shows "Authenticated"

- [ ] **API Key**
  - Settings → API Keys → Create API Key (Full Access)
  - Copy → `SENDGRID_API_KEY`

- [ ] **Sender Email**
  - Set `SENDGRID_FROM_EMAIL=bookings@kelatic.com`

### 3. Twilio SMS Setup

- [ ] **Get Production Credentials**
  - Go to [Twilio Console](https://console.twilio.com)
  - Copy Account SID → `TWILIO_ACCOUNT_SID`
  - Copy Auth Token → `TWILIO_AUTH_TOKEN`

- [ ] **Phone Number**
  - Buy or use existing number
  - Copy → `TWILIO_PHONE_NUMBER` (format: +1XXXXXXXXXX)

### 4. Supabase Database

- [ ] **Verify Production Project**
  - Confirm you're using production Supabase project (not local)
  - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - Copy anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy service role key → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Run Migrations**
  ```bash
  npx supabase db push
  ```

- [ ] **Seed Initial Data** (if fresh database)
  ```bash
  npx supabase db seed
  ```

### 5. Anthropic AI

- [ ] **Get API Key**
  - Go to [Anthropic Console](https://console.anthropic.com)
  - Create/copy API key → `ANTHROPIC_API_KEY`

---

## Vercel Deployment

### Step 1: Push to GitHub (if not already)
```bash
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/kelatic-booking.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Configure project:
   - Framework: Next.js (auto-detected)
   - Root Directory: `/`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Environment Variables

Add ALL of these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` |
| `STRIPE_TERMINAL_LOCATION_ID` | `tml_xxx` |
| `ANTHROPIC_API_KEY` | `sk-ant-xxx` |
| `SENDGRID_API_KEY` | `SG.xxx` |
| `SENDGRID_FROM_EMAIL` | `bookings@kelatic.com` |
| `TWILIO_ACCOUNT_SID` | `ACxxx` |
| `TWILIO_AUTH_TOKEN` | Your auth token |
| `TWILIO_PHONE_NUMBER` | `+1xxx` |
| `CRON_SECRET` | Generate random 32-char string |
| `NEXT_PUBLIC_APP_URL` | `https://kelatic.com` |

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete

### Step 5: Custom Domain

1. In Vercel → Settings → Domains
2. Add `kelatic.com`
3. Add DNS records to your domain registrar:
   - Type: `A` → `76.76.21.21`
   - Type: `CNAME` for `www` → `cname.vercel-dns.com`
4. Wait for SSL certificate (automatic)

---

## Post-Deployment Testing

### Critical Path Tests

- [ ] **Booking Flow**
  1. Go to kelatic.com/book
  2. Select a service
  3. Select a stylist
  4. Pick date/time
  5. Enter client info
  6. Complete payment (use real card for small amount)
  7. Verify confirmation page
  8. Check email received
  9. Check SMS received

- [ ] **Admin Dashboard**
  1. Go to kelatic.com/admin (or however admin auth works)
  2. Verify appointment appears
  3. Test status changes

- [ ] **AI Chatbot**
  1. Click chat widget
  2. Ask "What services do you offer?"
  3. Ask "Can I book an appointment?"

- [ ] **POS System**
  1. Go to kelatic.com/pos
  2. Select appointment
  3. Test card reader connection (if hardware available)

- [ ] **Reschedule/Cancel**
  1. Use link from confirmation email
  2. Test reschedule flow
  3. Test cancel flow

---

## Quick Commands Reference

```bash
# Build locally to check for errors
npm run build

# Test locally with production env
npm run start

# Check Stripe webhook logs
# Go to: stripe.com → Developers → Webhooks → Select endpoint → View logs
```

---

## Support Contacts

- **Stripe:** stripe.com/support
- **Supabase:** supabase.com/support
- **Vercel:** vercel.com/support
- **SendGrid:** sendgrid.com/support
- **Twilio:** twilio.com/help

---

## Go-Live Date: ___________

Sign-off:
- [ ] All tests passed
- [ ] Rockal approved booking flow
- [ ] Payment processing verified
- [ ] Notifications working

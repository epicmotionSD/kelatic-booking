# Stripe Subscription Setup Guide

## x3o.ai Revenue Model Implementation

This guide will walk you through setting up Stripe products and configuring the subscription billing system for x3o.ai.

---

## Overview

**Revenue Model (from case study):**
- Trinity AI Monthly: $297/mo (with 14-day trial)
- Trinity AI Annual: $2,970/year (save $594/year)
- Revenue Sprint: $1,500 one-time

**Expected Results:**
- $1,800-$3,100/month recovered revenue per location
- 6-10x ROI for customers
- Target: $1,700 MRR by Feb 28, 2026

---

## Step 1: Create Stripe Products

### 1.1 Trinity AI Monthly Subscription

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Fill in:
   - **Name:** Trinity AI - Monthly
   - **Description:** Multi-industry revenue recovery AI with ghost client reactivation, conversation recovery, and instant slot filling
   - **Pricing:**
     - **Price:** $297.00
     - **Billing period:** Monthly
     - **Currency:** USD
   - **Advanced Options:**
     - ✅ Enable "Customers can use trial periods"
     - Default trial period: 14 days
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_...`)
6. Add to `.env`:
   ```
   STRIPE_PRICE_TRINITY_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### 1.2 Trinity AI Annual Subscription

1. Click "Add product" again
2. Fill in:
   - **Name:** Trinity AI - Annual
   - **Description:** Multi-industry revenue recovery AI (annual billing - save $594/year)
   - **Pricing:**
     - **Price:** $2,970.00
     - **Billing period:** Yearly
     - **Currency:** USD
   - **Advanced Options:**
     - ✅ Enable "Customers can use trial periods"
     - Default trial period: 14 days
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env`:
   ```
   STRIPE_PRICE_TRINITY_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### 1.3 Revenue Sprint (One-Time Payment)

1. Click "Add product" again
2. Fill in:
   - **Name:** Revenue Sprint (7-Day Intensive)
   - **Description:** 7-day intensive campaign to recover lost revenue with 100% ghost client list outreach and Hummingbird cadence
   - **Pricing:**
     - **Price:** $1,500.00
     - **Billing period:** One time
     - **Currency:** USD
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env`:
   ```
   STRIPE_PRICE_REVENUE_SPRINT=price_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 2: Configure Stripe Webhooks

Webhooks keep your database in sync with Stripe subscription events.

### 2.1 Create Webhook Endpoint

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL:
   - **Development:** `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
   - **Production:** `https://kelatic.com/api/webhooks/stripe`
4. Click "Select events"
5. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `checkout.session.completed`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_...`)
8. Add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 3: Run Database Migration

Apply the subscription fields to your database:

```bash
# If using Supabase CLI
supabase migration up

# Or apply directly in Supabase Dashboard > SQL Editor
# Run: supabase/migrations/040_stripe_subscriptions.sql
```

This adds the following columns to `businesses` table:
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_current_period_start`
- `subscription_current_period_end`
- `subscription_cancel_at_period_end`
- `subscription_canceled_at`

---

## Step 4: Test Stripe Integration

### 4.1 Test Mode Setup

Use Stripe test keys for development:

```env
# Test keys (from Stripe Dashboard > Developers > API keys)
PAYMENT_PROVIDER_TEST_SECRET=<paste_test_secret_from_dashboard>
PAYMENT_PROVIDER_TEST_PUBLIC=<paste_test_publishable_from_dashboard>
```

### 4.2 Test Subscription Flow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to billing page:**
   ```
   http://localhost:3000/admin/billing
   ```

3. **Click "Start 14-Day Trial" on a plan**

4. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **Verify subscription created:**
   - Check Supabase `businesses` table for subscription data
   - Check Stripe Dashboard > Customers for new subscription

### 4.3 Test Webhook Delivery

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   ```

2. **Login and forward webhooks:**
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Trigger test events:**
   ```bash
   # Test subscription created
   stripe trigger customer.subscription.created

   # Test invoice paid
   stripe trigger invoice.paid

   # Test payment failed
   stripe trigger invoice.payment_failed
   ```

4. **Verify in logs:**
   - Check terminal for webhook delivery logs
   - Check Supabase table updates

---

## Step 5: Go Live (Production)

### 5.1 Switch to Production Keys

1. Go to Stripe Dashboard
2. Toggle "View test data" to OFF (top right)
3. Go to Developers > API keys
4. Copy **Live** keys to production `.env`:
   ```env
   PAYMENT_PROVIDER_LIVE_SECRET=<paste_live_secret_from_dashboard>
   PAYMENT_PROVIDER_LIVE_PUBLIC=<paste_live_publishable_from_dashboard>
   ```

### 5.2 Update Webhook Endpoint

1. Go to Developers > Webhooks (with test mode OFF)
2. Add new endpoint with production URL: `https://kelatic.com/api/webhooks/stripe`
3. Select same events as test mode
4. Copy production webhook secret to `.env`

### 5.3 Verify Production Deployment

1. Deploy to Vercel:
   ```bash
   git add .
   git commit -m "feat: add Stripe subscription billing"
   git push
   ```

2. Add environment variables in Vercel Dashboard:
   - Settings > Environment Variables
   - Add all `STRIPE_*` variables

3. Test live subscription:
   - Use real credit card
   - Verify webhook delivery
   - Check database updates

---

## Step 6: Customer Portal Configuration

The Customer Portal lets customers manage their own billing.

### 6.1 Configure Portal Settings

1. Go to [Stripe Dashboard > Settings > Customer portal](https://dashboard.stripe.com/settings/billing/portal)
2. Configure:
   - ✅ **Cancel subscriptions:** Allow immediate or at period end
   - ✅ **Update payment method:** Enabled
   - ✅ **Update billing information:** Enabled
   - ✅ **View invoices:** Enabled
   - ✅ **Promotional codes:** Optional
3. Click "Save changes"

---

## API Endpoints Reference

### Subscription Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/subscribe` | POST | Create subscription checkout session |
| `/api/billing/portal` | POST | Get customer portal link |
| `/api/billing/cancel` | POST | Cancel subscription |
| `/api/billing/reactivate` | POST | Reactivate canceled subscription |
| `/api/billing/status` | GET | Get subscription details |
| `/api/billing/revenue-sprint` | POST | Purchase Revenue Sprint |

### Request/Response Examples

**Subscribe:**
```bash
curl -X POST http://localhost:3000/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -d '{"plan":"trinity_monthly","trialDays":14}'

# Response: { "sessionId": "cs_test_...", "url": "https://checkout.stripe.com/..." }
```

**Get Status:**
```bash
curl http://localhost:3000/api/billing/status

# Response: {
#   "plan": "trinity_monthly",
#   "plan_status": "active",
#   "subscription_current_period_end": "2026-03-12T00:00:00Z",
#   ...
# }
```

---

## Monitoring & Analytics

### Stripe Dashboard Metrics

Track these metrics in Stripe Dashboard:

1. **MRR (Monthly Recurring Revenue):**
   - Dashboard > Home > MRR graph
   - Target: $1,700 by Feb 28, 2026

2. **Active Subscriptions:**
   - Dashboard > Subscriptions > Active
   - Goal: 5-6 customers at $297/mo

3. **Churn Rate:**
   - Dashboard > Analytics > Churn
   - Target: <5% monthly churn

4. **Trial Conversion:**
   - Dashboard > Analytics > Trials
   - Target: >50% trial-to-paid conversion

### Database Queries

**Count active subscriptions:**
```sql
SELECT
  plan,
  plan_status,
  COUNT(*) as count
FROM businesses
WHERE plan_status IN ('active', 'trialing')
GROUP BY plan, plan_status;
```

**Calculate MRR:**
```sql
SELECT
  SUM(
    CASE
      WHEN plan = 'trinity_monthly' THEN 297
      WHEN plan = 'trinity_annual' THEN 247.5 -- (2970/12)
      ELSE 0
    END
  ) as monthly_recurring_revenue
FROM businesses
WHERE plan_status IN ('active', 'trialing');
```

---

## Troubleshooting

### "Product not configured" error

**Problem:** `STRIPE_PRICE_TRINITY_MONTHLY` env var not set

**Solution:**
1. Create products in Stripe Dashboard (Step 1)
2. Copy Price IDs to `.env`
3. Restart dev server

---

### Webhook signature verification failed

**Problem:** Invalid webhook secret

**Solution:**
1. Check `STRIPE_WEBHOOK_SECRET` in `.env`
2. Verify it matches Stripe Dashboard webhook secret
3. For local testing, use Stripe CLI to forward webhooks

---

### Subscription not updating in database

**Problem:** Webhook not being received

**Solution:**
1. Check webhook endpoint URL is correct
2. Verify webhook is enabled in Stripe Dashboard
3. Check webhook delivery logs in Stripe Dashboard > Developers > Webhooks > [your endpoint] > Logs
4. Ensure app is deployed and accessible at webhook URL

---

### "No active subscription" on billing page

**Problem:** User not authenticated or business not found

**Solution:**
1. Ensure user is logged in
2. Verify user has `business_members` record with `owner` or `admin` role
3. Check Supabase RLS policies allow access

---

## Next Steps

1. ✅ **Products created** - Trinity Monthly, Annual, Revenue Sprint
2. ✅ **Webhooks configured** - All subscription events handled
3. ✅ **Billing page built** - `/admin/billing` fully functional
4. ⏳ **Add to onboarding** - Prompt for plan selection during signup
5. ⏳ **Add usage limits** - Enforce campaign limits based on plan
6. ⏳ **Send email notifications** - Trial ending, payment failed, etc.

---

## Support

**Stripe Documentation:**
- [Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

**Need help?**
- Stripe Dashboard > Help > Contact support
- [Stripe Discord](https://stripe.com/discord)

---

**Last Updated:** February 12, 2026
**Version:** 1.0

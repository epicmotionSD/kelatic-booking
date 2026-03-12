# Phase 1 Launch Plan - Email Only MVP (Ship Today!)

**Goal:** Launch ghost client campaigns with EMAIL ONLY, add SMS later

**Time Estimate:** 2-3 hours to production-ready

---

## Why Email First?

### ✅ Proven Working
- Your Jan 21 campaign: 1,000 emails sent successfully
- SendGrid already configured (shared API key)
- Hummingbird cadence working (Days 1, 3, 7)
- Zero A2P friction

### ✅ Email > SMS for Reactivation
- **Deliverability:** 90%+ (vs 60% SMS)
- **Cost:** $0.0001/email vs $0.0079/SMS (79x cheaper!)
- **Content:** Can include images, styling, multiple CTAs
- **Trust:** Less spammy than cold SMS
- **Tracking:** Opens, clicks, conversions

### ✅ Competitive Positioning
> "Email reactivation campaigns, live in 5 minutes"
> "SMS upgrade available - ready in 7 days"

---

## Changes Needed (2 hours)

### 1. Disable SMS UI Elements (30 min)

Create feature flag system:

```typescript
// lib/features.ts
export const FEATURES = {
  SMS_ENABLED: process.env.NEXT_PUBLIC_SMS_ENABLED === 'true',
  EMAIL_ENABLED: true, // Always on
  VOICE_ENABLED: false, // Future
} as const

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature]
}
```

Update campaign creation UI:

```typescript
// app/dashboard/campaigns/create/page.tsx
import { isFeatureEnabled } from '@/lib/features'

function ChannelSelector() {
  return (
    <div className="space-y-2">
      {/* Email - Always available */}
      <ChannelOption
        icon={Mail}
        label="Email"
        description="Send personalized email campaigns"
        value="email"
        badge="Recommended"
      />

      {/* SMS - Show as coming soon */}
      {!isFeatureEnabled('SMS_ENABLED') && (
        <ChannelOption
          icon={MessageSquare}
          label="SMS"
          description="Coming soon - ready in 7 days"
          value="sms"
          disabled
          badge="Upgrade"
          onClick={() => router.push('/dashboard/settings/upgrade-sms')}
        />
      )}

      {isFeatureEnabled('SMS_ENABLED') && (
        <ChannelOption
          icon={MessageSquare}
          label="SMS"
          description="Send text message campaigns"
          value="sms"
        />
      )}
    </div>
  )
}
```

### 2. Update Default Cadence to Email-Only (15 min)

```typescript
// lib/inngest/functions/hummingbird-cadence.ts

const HUMMINGBIRD_CADENCE_EMAIL = [
  { day: 1, delayHours: 0, script: 'direct_inquiry', channel: 'email' },
  { day: 3, delayHours: 48, script: 'file_closure', channel: 'email' },
  { day: 7, delayHours: 144, script: 'breakup', channel: 'email' },
] as const

// Use this instead of SMS cadence if SMS not enabled
export function getDefaultCadence(): typeof HUMMINGBIRD_CADENCE {
  if (process.env.SMS_ENABLED !== 'true') {
    return HUMMINGBIRD_CADENCE_EMAIL
  }
  return HUMMINGBIRD_CADENCE // Original with SMS
}
```

### 3. Add "Upgrade to SMS" Page (45 min)

```typescript
// app/dashboard/settings/upgrade-sms/page.tsx

export default function UpgradeSMSPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Add SMS to Your Campaigns</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">SMS Ready in 7 Days</h2>
        <p className="text-gray-700">
          We'll handle all A2P 10DLC compliance registration for you.
          Most customers wait 2-6 weeks doing this themselves - we get you approved in 7 days.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <h3 className="text-xl font-semibold">What We Need:</h3>

        <A2PInfoForm
          onSubmit={async (data) => {
            const supabase = createClient()
            await supabase.from('business_a2p_requests').insert({
              business_id: businessId,
              legal_name: data.legalName,
              ein: data.ein,
              business_type: data.businessType,
              website: data.website,
              address: data.address,
              vertical: data.vertical,
              estimated_volume: data.monthlyVolume,
              status: 'submitted',
            })

            // Notify your team
            await fetch('/api/internal/notify-a2p-submission', {
              method: 'POST',
              body: JSON.stringify({ businessId }),
            })

            toast.success('Submitted! We\'ll activate SMS within 7 days.')
            router.push('/dashboard/settings')
          }}
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="font-bold mr-2">Day 1:</span>
            Submit this form (5 minutes)
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">Day 1-3:</span>
            We register your brand with The Campaign Registry
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">Day 3-7:</span>
            Carriers approve your messaging campaign
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">Day 7:</span>
            SMS activated! You'll get an email notification
          </li>
        </ol>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-4">Pricing</h3>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">Professional Plan</p>
              <p className="text-sm text-gray-600">Includes SMS setup + 1,000 messages/mo</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">$99</p>
              <p className="text-sm text-gray-600">/month</p>
            </div>
          </div>
          <Button className="w-full mt-4">Upgrade Now</Button>
        </div>
      </div>
    </div>
  )
}
```

### 4. Update Launch Script (15 min)

```typescript
// scripts/launch-graveyard-campaign.ts

// Add channel parameter
interface ScriptArgs {
  // ... existing
  channel: 'email' | 'sms' | 'multi'
}

const channel = (args.get('channel') || 'email') as ScriptArgs['channel']

// Validate
if (channel === 'sms' && process.env.SMS_ENABLED !== 'true') {
  console.error('SMS not enabled. Use --channel email or upgrade your plan.')
  process.exit(1)
}

// Use appropriate cadence
const cadenceConfig = channel === 'email'
  ? HUMMINGBIRD_SCRIPTS_EMAIL
  : HUMMINGBIRD_SCRIPTS
```

### 5. Update Environment Variables (5 min)

```bash
# .env
NEXT_PUBLIC_SMS_ENABLED=false
SMS_SEND_DISABLED=true
TWILIO_A2P_APPROVED=false

# When you enable SMS later:
# NEXT_PUBLIC_SMS_ENABLED=true
# SMS_SEND_DISABLED=false
# TWILIO_A2P_APPROVED=true
```

---

## Testing Checklist

### ✅ Email Campaign Flow
```bash
# 1. Create test CSV
cat > test_email_only.csv << 'EOF'
firstname,lastname,phone,email,days_inactive,segment
Test,User,+13055551234,your.email@example.com,45,GRAVEYARD
EOF

# 2. Launch email-only campaign
bun run scripts/launch-graveyard-campaign.ts \
  --file test_email_only.csv \
  --businessId f0c07a53-c001-486b-a30d-c1102b4dfadf \
  --businessName "Kelatic Hair Lounge" \
  --service "locs retwist" \
  --count 1 \
  --channel email \
  --dryRun false \
  --direct true

# 3. Check email arrived
# 4. Verify Days 1, 3, 7 cadence
```

### ✅ UI Tests
- [ ] SMS option shows "Coming Soon" badge
- [ ] Clicking SMS opens upgrade page
- [ ] Upgrade page shows A2P form
- [ ] Form submission works
- [ ] Email campaigns work normally

---

## Deployment Steps

### 1. Configure SendGrid Webhook (10 min)
```
1. Go to: https://app.sendgrid.com/settings/mail_settings
2. Enable Event Webhook
3. URL: https://kelatic.com/api/webhooks/sendgrid
4. Check: Delivered, Opened, Clicked, Bounced
5. Save
```

### 2. Set Environment Variables in Vercel
```bash
# Production
NEXT_PUBLIC_SMS_ENABLED=false
SMS_SEND_DISABLED=true

# Keep these (for email):
SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=noreply@kelatic.com
```

### 3. Deploy
```bash
git add .
git commit -m "Launch Phase 1: Email-only campaigns"
git push origin main

# Vercel auto-deploys
```

### 4. Test in Production
```bash
# Send yourself a test email campaign
bun run scripts/launch-graveyard-campaign.ts \
  --file test_prod.csv \
  --businessId YOUR_BUSINESS_ID \
  --channel email \
  --count 1 \
  --dryRun false
```

---

## Marketing Copy

### Homepage
> **Email Campaigns That Bring Customers Back**
>
> Automatically re-engage inactive customers with personalized email sequences.
> Live in 5 minutes. No credit card required.
>
> [Start Free Trial]

### Dashboard Banner
> 📧 Email campaigns are live! Want to add SMS? [Upgrade now →](#)

### Pricing Page
```
FREE
- ✅ Email campaigns
- ✅ 500 contacts
- ✅ Basic analytics
- ❌ SMS (upgrade to add)

PRO - $99/mo
- ✅ Email campaigns (unlimited)
- ✅ SMS campaigns (1,000 msgs/mo)
- ✅ 5,000 contacts
- ✅ Advanced analytics
- ✅ White-glove A2P setup

ENTERPRISE - $299/mo
- ✅ Everything in Pro
- ✅ SMS campaigns (5,000 msgs/mo)
- ✅ Unlimited contacts
- ✅ Instant SMS activation
```

---

## Go-Live Checklist

### Pre-Launch
- [ ] SendGrid webhook configured
- [ ] Feature flags set (SMS disabled)
- [ ] UI updated (SMS shows upgrade)
- [ ] Email templates tested
- [ ] Email-only cadence working
- [ ] Upgrade page created
- [ ] A2P request form built
- [ ] Internal notification for A2P requests

### Launch Day
- [ ] Deploy to production
- [ ] Send test campaign to yourself
- [ ] Verify email delivery + tracking
- [ ] Check webhook data flowing
- [ ] Monitor error logs
- [ ] Test upgrade flow

### Post-Launch (Week 1)
- [ ] Onboard first 5 customers
- [ ] Collect feedback on email campaigns
- [ ] Track: signup → first campaign time
- [ ] Track: email open rates, click rates
- [ ] Monitor: how many request SMS upgrade

---

## Success Metrics

### Week 1 Goals
- 5 customers signed up
- 10 email campaigns launched
- 1,000+ emails sent
- >25% open rate
- >5% click rate
- 0 unsubscribes

### Month 1 Goals
- 25 customers signed up
- 50 email campaigns launched
- 10,000+ emails sent
- 3 customers request SMS upgrade (ready for Phase 2!)

---

## Next Steps After Launch

### Week 2: Collect A2P Requests
- Monitor how many customers want SMS
- Manually process first A2P registration
- Document the process

### Week 3-4: Build A2P Automation
- Integrate Twilio Brand Registry API
- Build approval status dashboard
- Automate notifications

### Month 2: Enable SMS for First Customers
- Launch SMS for customers who completed A2P
- Measure: email vs SMS performance
- Iterate on cadence (which channel converts better?)

---

## Questions?

**How long will email-only phase last?**
- Ship today, add SMS in 4 weeks (when first customers complete A2P)

**Will customers accept email-only?**
- Email has BETTER deliverability than SMS (90% vs 60%)
- Your Jan 21 campaign sent 1,000 emails successfully
- Most B2B SaaS starts with email (Klaviyo, HubSpot, Mailchimp all started email-only)

**What if they need SMS immediately?**
- Offer white-glove service: "We'll fast-track your A2P - ready in 7 days vs 6 weeks"
- Or: Use subaccount model for Enterprise tier ($299/mo)

**Can we enable SMS for Kelatic only?**
- Yes! Set `SMS_ENABLED=true` for just your business:
  ```typescript
  const smsEnabled = business.id === 'KELATIC_ID' || business.plan === 'enterprise'
  ```

---

## Ready to Ship?

1. Make the UI changes (2 hours)
2. Configure SendGrid webhook (10 min)
3. Deploy to Vercel (5 min)
4. Send test campaign to yourself (2 min)
5. Launch! 🚀

**You can literally launch TODAY.**

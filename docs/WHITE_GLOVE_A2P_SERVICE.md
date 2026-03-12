# White-Glove A2P Registration Service

## The Problem
A2P 10DLC registration is complex and takes 2-6 weeks:
1. Register business with The Campaign Registry (TCR)
2. Submit brand verification docs
3. Wait for trust score evaluation
4. Register messaging campaign use case
5. Wait for carrier approval

## The Solution
**You handle it for them** (concierge service)

---

## Onboarding Flow

### Step 1: Customer Signs Up (Day 1)
- Collect business info during signup:
  - Legal business name
  - EIN/Tax ID
  - Business address
  - Website URL
  - Business type (LLC, Corp, Sole Prop)
  - Industry vertical

### Step 2: Immediate Email Access
- Customer can start email campaigns right away
- See "SMS Pending Approval" status in dashboard

### Step 3: A2P Registration (Day 1-7)
**You do this on their behalf:**

1. Create their Twilio account (or use subaccount)
2. Register brand with TCR on their behalf
3. Upload required docs (articles of incorporation, proof of ownership)
4. Submit campaign use case:
   - Use Case: Customer Care / Account Notifications
   - Sample messages from your templates
   - Opt-in process description
   - Opt-out process (STOP handling)

### Step 4: Approval Notification (Day 7-14)
- Send email: "SMS Approved! Your trust score is 75 (High)"
- Auto-enable SMS in their account
- They can start SMS campaigns immediately

### Step 5: Ongoing Support
- Monitor trust score
- Handle carrier inquiries
- Ensure compliance

---

## Pricing Models

### Option A: One-Time Setup Fee
- $299 setup fee for SMS activation
- Includes A2P registration + phone number
- Customer pays Twilio usage directly (you passthrough costs)

### Option B: Platform Fee
- Free A2P setup (included in platform)
- You mark up SMS costs: $0.01/message → charge $0.015/message (50% margin)
- Covers your A2P management overhead

### Option C: Tiered Plans
- **Email Only Plan**: $0-49/mo (no SMS)
- **Email + SMS Plan**: $99/mo (includes A2P, 1000 SMS, $0.01/extra)
- **White Glove Plan**: $299/mo (unlimited, dedicated support)

---

## Required Customer Documents

Collect during onboarding:
- [ ] Business name (legal)
- [ ] EIN or Tax ID
- [ ] Business type (LLC, Corp, Sole Prop, Non-profit)
- [ ] Business website
- [ ] Business address
- [ ] Industry/vertical
- [ ] Estimated monthly message volume
- [ ] Sample message templates

Optional (for higher trust score):
- [ ] Articles of incorporation
- [ ] Business license
- [ ] IRS determination letter (non-profits)

---

## Automation Checklist

Build into your onboarding flow:

```typescript
// 1. Collect info during signup
interface A2PBusinessInfo {
  legalName: string
  ein: string
  businessType: 'llc' | 'corporation' | 'sole_proprietor' | 'nonprofit'
  website: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  vertical: string // 'healthcare', 'beauty', 'professional_services', etc
  monthlyVolume: number
}

// 2. Submit to Twilio Brand Registry API
// https://www.twilio.com/docs/usage/api/brand-registration

// 3. Poll for approval status
// 4. Auto-enable SMS when approved
```

---

## Timeline

| Day | Action | Who |
|-----|--------|-----|
| 1 | Customer completes A2P form | Customer (5 min) |
| 1 | Submit brand registration | You (automated) |
| 1-3 | TCR reviews brand | TCR |
| 3 | Brand approved, trust score assigned | TCR |
| 3 | Submit campaign use case | You (automated) |
| 3-7 | Carriers review campaign | Carriers |
| 7 | Campaign approved | Carriers |
| 7 | SMS enabled for customer | You (automated) |

**Total: 7 days** (vs 2-6 weeks if they do it themselves)

---

## Support Burden

### Low Effort (once automated):
- Brand registration: API call
- Campaign submission: API call
- Status polling: Cron job

### Medium Effort:
- Document collection/upload (if manual)
- Handling rejections (wrong business type, incomplete docs)

### High Effort:
- Complex cases (non-profits, startups without EIN)
- Appeals (if brand rejected)
- Low trust score optimization

---

## Competitive Advantage

**Most SaaS SMS platforms DON'T do this for you:**
- Twilio: DIY only
- Klaviyo: DIY or pay $500 setup
- Attentive: They handle it (but charge $$$)

**Your differentiator:**
> "SMS ready in 7 days, not 6 weeks. We handle all A2P compliance for you."

---

## Implementation Priority

1. **Week 1**: Build A2P data collection form in onboarding
2. **Week 2**: Integrate Twilio Brand Registry API
3. **Week 3**: Build status dashboard ("A2P Approval: 60% complete")
4. **Week 4**: Automate approval notifications

**Time to ship:** 1 month for full automation
**Time to MVP:** 1 week (collect data manually, submit via Twilio console)

# 🧪 Live Testing Guide - Kelatic Ghost Client Campaign

**Pilot User:** Kelatic Hair Lounge (kelatic.com)
**Test Date:** February 12, 2026
**Goal:** Verify ghost client reactivation flow with real contacts

---

## ✅ Pre-Flight Checklist

### 1. Environment Variables
```bash
# Verify these are set in .env or Vercel
SUPABASE_URL=✅
SUPABASE_SERVICE_ROLE_KEY=✅
TWILIO_ACCOUNT_SID=✅
TWILIO_AUTH_TOKEN=✅
TWILIO_PHONE_NUMBER=✅ (Must be A2P 10DLC registered)
SENDGRID_API_KEY=✅
CRON_SECRET=✅
INNGEST_EVENT_KEY=✅
NEXT_PUBLIC_APP_URL=https://kelatic.com
```

**Check now:**
```bash
cd C:\Users\shawn\Downloads\kelatic-booking
grep -E "(TWILIO|SUPABASE|SENDGRID|INNGEST)" .env
```

### 2. Kelatic Business ID
You need the UUID for Kelatic Hair Lounge in your database.

**Get it:**
```sql
-- Run in Supabase SQL Editor
SELECT id, name, slug, twilio_phone_number
FROM businesses
WHERE slug = 'kelatic' OR name LIKE '%Kelatic%';
```

**Save this:** `KELATIC_BUSINESS_ID=________`

### 3. Ghost Client CSV
You should have a CSV with inactive Kelatic clients (30-180 days).

**Required columns:**
- `firstname` or `first_name`
- `lastname` or `last_name`
- `phone` or `clean_phone` (will be converted to E.164)
- `email` (optional)
- `days_inactive` (how long since last contact)
- `segment` (should be "GRAVEYARD" or "ghost")

**Example row:**
```csv
firstname,lastname,phone,email,days_inactive,segment
John,Smith,(305) 555-1234,john@example.com,45,GRAVEYARD
```

---

## 🎯 Test Plan: 3-Phase Approach

### Phase 1: Dry Run (5 Test Leads)
**Purpose:** Verify campaign creation, no messages sent
**Duration:** 5 minutes
**Risk:** Zero (no SMS sent)

### Phase 2: Mini Live Test (3 Real Contacts)
**Purpose:** Test full Hummingbird cadence with your own numbers
**Duration:** 7 days
**Risk:** Low (use your own phone numbers)

### Phase 3: Small Production Sprint (25 Leads)
**Purpose:** First real revenue recovery attempt
**Duration:** 7 days
**Risk:** Moderate (real clients, monitored closely)

---

## 📋 Phase 1: Dry Run Test

### Step 1: Prepare Test CSV
Create `test_graveyard_5.csv` with 5 test contacts:

```bash
cd C:\Users\shawn\Downloads\kelatic-booking
cat > test_graveyard_5.csv << 'EOF'
firstname,lastname,phone,email,days_inactive,segment
Test,User1,+13055551234,test1@kelatic.com,45,GRAVEYARD
Test,User2,+13055551235,test2@kelatic.com,60,GRAVEYARD
Test,User3,+13055551236,test3@kelatic.com,90,GRAVEYARD
Test,User4,+13055551237,test4@kelatic.com,120,GRAVEYARD
Test,User5,+13055551238,test5@kelatic.com,150,GRAVEYARD
EOF
```

### Step 2: Run Dry Run
```bash
bun run scripts/launch-graveyard-campaign.ts \
  --file test_graveyard_5.csv \
  --businessId KELATIC_BUSINESS_ID \
  --businessName "KeLatic Hair Lounge" \
  --service "locs retwist" \
  --count 5 \
  --dryRun true \
  --direct true
```

### Step 3: Verify in Supabase
```sql
-- Check campaign was created
SELECT id, name, status, segment, total_leads, created_at
FROM campaigns
WHERE business_id = 'KELATIC_BUSINESS_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Should show: status='draft', total_leads=5

-- Check leads were inserted
SELECT
  first_name,
  last_name,
  phone,
  status,
  days_since_contact
FROM campaign_leads
WHERE campaign_id = 'CAMPAIGN_ID_FROM_ABOVE'
ORDER BY created_at;

-- Should show: 5 leads with status='pending'

-- Verify NO messages were sent
SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = 'CAMPAIGN_ID';
-- Should be: 0
```

### ✅ Phase 1 Success Criteria
- [ ] Campaign created with `status='draft'`
- [ ] 5 leads inserted with `status='pending'`
- [ ] 0 messages in `campaign_messages`
- [ ] Campaign visible in `/dashboard/campaigns`

---

## 📋 Phase 2: Mini Live Test (Your Numbers)

**IMPORTANT:** Use YOUR OWN phone numbers for this test!

### Step 1: Create Live Test CSV
Replace with your actual phone numbers:

```csv
firstname,lastname,phone,email,days_inactive,segment
Shawn,Test1,YOUR_PHONE_1,your_email@kelatic.com,45,GRAVEYARD
Rockal,Test2,YOUR_PHONE_2,rockal@kelatic.com,60,GRAVEYARD
Staff,Test3,STAFF_PHONE,staff@kelatic.com,90,GRAVEYARD
```

Save as `test_live_3.csv`

### Step 2: Launch Live Campaign
```bash
bun run scripts/launch-graveyard-campaign.ts \
  --file test_live_3.csv \
  --businessId KELATIC_BUSINESS_ID \
  --businessName "KeLatic Hair Lounge" \
  --service "locs retwist" \
  --count 3 \
  --dryRun false \
  --direct true
```

**Watch output:**
```bash
[leads] Loaded 3 leads from test_live_3.csv
[direct] Campaign CAMPAIGN_ID created with 3 leads (dryRun=false)
```

### Step 3: Monitor Timeline

#### **Immediately (Within 5 min):**
```sql
-- Check campaign is active
SELECT id, status, current_day, started_at
FROM campaigns
WHERE id = 'CAMPAIGN_ID';
-- Should show: status='active', started_at=NOW

-- Check Inngest triggered
-- Go to: https://app.inngest.com (your dashboard)
-- Look for: 'campaign/started' event
-- Should see: "hummingbird-cadence" function running
```

#### **Day 1 (First 10 minutes):**
```sql
-- Check Day 1 SMS sent
SELECT
  to_phone,
  body,
  status,
  cadence_day,
  sent_at,
  twilio_sid
FROM campaign_messages
WHERE campaign_id = 'CAMPAIGN_ID' AND cadence_day = 1
ORDER BY sent_at;
```

**Expected SMS:**
> Hey {Your Name}, it's been a while since we've seen you at KeLatic Hair Lounge! We'd love to have you back. Would you like me to get you on the books for locs retwist?
>
> Reply STOP to opt out

**✅ Check Your Phone:** You should receive this SMS within 2-3 minutes.

#### **Day 2 (+24 hours):**
```sql
SELECT
  to_phone,
  body,
  status,
  cadence_day,
  sent_at
FROM campaign_messages
WHERE campaign_id = 'CAMPAIGN_ID' AND cadence_day = 2;
```

**Expected:** Voicemail script SMS (or actual voicemail if configured)

#### **Day 4 (+72 hours):**
**Expected SMS:**
> Hi {Your Name}, I'm doing some housekeeping at KeLatic Hair Lounge and noticed your file. Before I close it out, I wanted to check - are you still interested in locs retwist or should I mark you as inactive?
>
> Reply STOP to opt out

#### **Day 7 (+144 hours):**
**Expected SMS:**
> Hey {Your Name}, this is my last reach out. I don't want to bother you but wanted to give you one final chance to get back on the books at KeLatic Hair Lounge. If I don't hear from you, I'll assume the timing isn't right. Either way, hope you're doing great!

### Step 4: Test Response Handling

**Respond to Day 1 SMS with: "Yes, interested!"**

Then check:
```sql
-- Should show your response captured
SELECT
  direction,
  body,
  sentiment,
  is_booking_intent,
  received_at
FROM campaign_messages
WHERE campaign_lead_id IN (
  SELECT id FROM campaign_leads
  WHERE phone = 'YOUR_PHONE'
)
ORDER BY created_at;
```

**Expected:**
- Outbound message (Day 1 SMS you received)
- **Inbound message** (your "Yes, interested!" reply)
- `sentiment='positive'`
- `is_booking_intent=true`

**Check lead status:**
```sql
SELECT
  first_name,
  status,
  has_responded,
  response_sentiment,
  last_response_text
FROM campaign_leads
WHERE phone = 'YOUR_PHONE';
```

**Expected:**
- `status='responded'`
- `has_responded=true`
- `response_sentiment='positive'`
- Future messages should STOP (Hummingbird only contacts non-responders)

### Step 5: Test Opt-Out

**Respond to another test number with: "STOP"**

Check:
```sql
SELECT
  status,
  opted_out_at
FROM campaign_leads
WHERE phone = 'TEST_PHONE_THAT_OPTED_OUT';
```

**Expected:**
- `status='opted_out'`
- `opted_out_at` populated
- No more messages to this number

### ✅ Phase 2 Success Criteria
- [ ] Day 1 SMS received on your phone within 5 min
- [ ] SMS content correct (name, business, service)
- [ ] Positive response captured correctly
- [ ] Lead marked as 'responded'
- [ ] No more messages sent to responded lead
- [ ] STOP response marks lead as 'opted_out'
- [ ] Day 2, 4, 7 messages sent on schedule
- [ ] Campaign completes after Day 7

---

## 📋 Phase 3: Small Production Sprint

**Only proceed after Phase 2 success!**

### Step 1: Export Real Ghost Clients

From your existing system (Amelia, Square, etc.):
```sql
-- Example for exporting from your clients table
SELECT
  first_name as firstname,
  last_name as lastname,
  phone,
  email,
  EXTRACT(DAY FROM NOW() - last_appointment_date) as days_inactive,
  'GRAVEYARD' as segment
FROM clients
WHERE last_appointment_date BETWEEN NOW() - INTERVAL '180 days'
                                AND NOW() - INTERVAL '30 days'
AND phone IS NOT NULL
AND sms_opt_out = FALSE
ORDER BY last_appointment_date ASC
LIMIT 25;
```

Export to `kelatic_graveyard_25.csv`

### Step 2: Review & Clean Data
- [ ] Verify all phone numbers are valid US numbers
- [ ] Remove any test/staff numbers
- [ ] Confirm all opted-in (check opt-out status)
- [ ] Validate days_inactive between 30-180
- [ ] Include estimated booking value if available

### Step 3: Launch Production Sprint
```bash
bun run scripts/launch-graveyard-campaign.ts \
  --file kelatic_graveyard_25.csv \
  --businessId KELATIC_BUSINESS_ID \
  --businessName "KeLatic Hair Lounge" \
  --service "locs retwist" \
  --count 25 \
  --estimatedValue 85 \
  --dryRun false \
  --direct true
```

### Step 4: Monitor Dashboard

Go to: `https://kelatic.com/dashboard/campaigns`

**Watch metrics update:**
- Total leads: 25
- Messages sent: (increments each day)
- Responses: (tracks replies)
- Positive responses: (interested clients)
- Bookings: (if they book via link)
- Revenue: (if bookings tracked)

### Step 5: Handle Hot Leads

Go to: `https://kelatic.com/dashboard/hot-leads`

**Expected flow:**
1. Lead responds positively
2. Appears in Hot Leads dashboard
3. Staff follows up to book
4. Mark as "booked" in system
5. Revenue tracked

### Step 6: Daily Monitoring (7 Days)

**Day 1:**
- [ ] 25 SMS sent (check Twilio console)
- [ ] ~5-10 responses expected
- [ ] Review hot leads dashboard

**Day 2:**
- [ ] Voicemail drops to non-responders
- [ ] Track additional responses

**Day 4:**
- [ ] File closure SMS sent
- [ ] Peak response day (typically)

**Day 7:**
- [ ] Breakup SMS sent
- [ ] Campaign completes
- [ ] Calculate final metrics

### ✅ Phase 3 Success Criteria
- [ ] All 25 SMS sent successfully
- [ ] 2-3 bookings generated (8-12% target)
- [ ] $170-$255 revenue recovered (2-3 × $85)
- [ ] 6-10x ROI ($25 SMS cost vs $200+ revenue)
- [ ] No compliance issues
- [ ] Client feedback positive

---

## 🔍 Monitoring Checklist

### Twilio Console
Check: https://console.twilio.com/us1/monitor/logs/sms

**Look for:**
- ✅ Message status: "delivered"
- ✅ No error codes
- ❌ If errors: Most common are invalid numbers or carrier blocking

### Inngest Dashboard
Check: https://app.inngest.com

**Look for:**
- ✅ "campaign/started" event triggered
- ✅ "hummingbird-cadence" function running
- ✅ Steps completing (load-campaign-data, send-batch-day-1, etc.)
- ❌ If failed: Check error logs

### Supabase Logs
Check query logs for errors:
```sql
-- Check for failed messages
SELECT
  to_phone,
  error_message,
  error_code,
  failed_at
FROM campaign_messages
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
AND status = 'failed';
```

---

## 🚨 Troubleshooting

### Issue: No SMS Sent

**Check:**
1. Inngest function triggered?
2. Twilio credentials correct?
3. Business has `twilio_phone_number` set?
4. Phone numbers in E.164 format (+1...)?

**Debug query:**
```sql
SELECT twilio_phone_number FROM businesses WHERE id = 'KELATIC_ID';
```

### Issue: SMS Delivered but Not Received

**Possible causes:**
- Carrier filtering (AT&T/T-Mobile may block first message)
- A2P 10DLC not registered (requires registration)
- Phone number on DNC list

**Solution:**
Register for A2P 10DLC: https://www.twilio.com/docs/sms/a2p-10dlc

### Issue: Responses Not Tracked

**Check:**
1. Twilio webhook configured?
2. Webhook pointing to: `https://kelatic.com/api/webhooks/twilio/sms`
3. Webhook auth passing?

**Verify webhook:**
```bash
curl -X POST https://kelatic.com/api/webhooks/twilio/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=TEST123" \
  -d "From=+13055551234" \
  -d "To=+YOUR_TWILIO_NUMBER" \
  -d "Body=Test response"
```

### Issue: Campaign Stuck

**Check Inngest status:**
- Function paused?
- Step failed and not retrying?
- Rate limit hit?

**Manual intervention:**
```sql
-- Check current status
SELECT status, current_day FROM campaigns WHERE id = 'CAMPAIGN_ID';

-- Resume if stuck
UPDATE campaigns SET status = 'active' WHERE id = 'CAMPAIGN_ID';
```

---

## 📊 Expected Results (Based on Case Study)

### Metrics to Track
| Metric | Target | Formula |
|--------|--------|---------|
| Delivery rate | >95% | delivered / sent |
| Response rate | 15-25% | responses / sent |
| Positive response rate | 8-12% | positive / responses |
| Conversion rate | 30-50% | booked / positive |
| Overall reactivation | 8-12% | booked / sent |

### Revenue Calculation
```
25 leads × 10% reactivation = 2.5 bookings
2.5 bookings × $85 avg value = $212.50 revenue
Cost: 25 leads × 3 messages × $0.04 = $3.00
ROI: $212.50 / $3.00 = 70x
```

---

## ✅ Go/No-Go Decision Points

### After Dry Run (Phase 1)
**GO if:**
- ✅ Campaign created successfully
- ✅ All leads inserted
- ✅ Database structure correct

**NO-GO if:**
- ❌ Campaign creation errors
- ❌ Lead insertion fails
- ❌ **Fix issues before proceeding**

### After Mini Live Test (Phase 2)
**GO if:**
- ✅ SMS delivered to all test numbers
- ✅ Responses captured correctly
- ✅ Cadence timing accurate
- ✅ Opt-outs respected

**NO-GO if:**
- ❌ Messages not delivering
- ❌ Responses not tracked
- ❌ Compliance issues
- ❌ **Do NOT proceed to Phase 3**

### After Production Sprint (Phase 3)
**SCALE if:**
- ✅ 8-12% reactivation achieved
- ✅ Positive client feedback
- ✅ No compliance complaints
- ✅ ROI > 5x

**ADJUST if:**
- ⚠️ Reactivation < 5%
- ⚠️ Script needs tweaking
- ⚠️ Timing optimization needed

---

## 📞 Support Resources

**Twilio Support:**
- Console: https://console.twilio.com
- Docs: https://www.twilio.com/docs/sms

**Inngest Support:**
- Dashboard: https://app.inngest.com
- Docs: https://www.inngest.com/docs

**Supabase:**
- Dashboard: https://app.supabase.com
- SQL Editor: Direct database access

**Emergency Contact:**
- Me (Claude) - I'm here to help!

---

**Ready to start Phase 1?** Let me know when you're ready and I'll help you through each step!

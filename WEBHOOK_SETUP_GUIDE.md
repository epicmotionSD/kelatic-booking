# Webhook Configuration Guide - Kelatic

## Current Status
Your campaigns ARE working and sending messages, but you're not getting:
- ✅ Delivery confirmations
- ✅ Open/click tracking (email)
- ✅ Inbound response tracking (SMS)

## Required Webhooks

### 1. SendGrid Webhooks (Email Tracking)

**Purpose**: Track email delivery, opens, clicks, bounces, unsubscribes

**Setup Steps**:
1. Go to: https://app.sendgrid.com/settings/mail_settings
2. Click "Event Webhook"
3. Enable webhook with these settings:

```
Webhook URL: https://kelatic.com/api/webhooks/sendgrid
HTTP POST URL: https://kelatic.com/api/webhooks/sendgrid

Events to track:
☑ Delivered
☑ Opened
☑ Clicked
☑ Bounced
☑ Dropped
☑ Spam Report
☑ Unsubscribe
```

4. Click "Test Your Integration" to verify

**What This Fixes**:
- `delivered_at` timestamps will populate
- Email opens/clicks tracked in dashboard
- Bounce handling (invalid emails)
- Unsubscribe compliance

---

### 2. Twilio SMS Webhooks (Message Status + Responses)

**Purpose**: Track SMS delivery status AND capture inbound responses

You need to configure TWO webhooks per Twilio number:

#### A. Status Callback (Delivery Tracking)

**For number**: +18559010579

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click your number: +18559010579
3. Scroll to "Messaging Configuration"
4. Set **Status Callback URL**:

```
Status Callback URL: https://kelatic.com/api/webhooks/twilio/status
HTTP Method: POST
```

**What This Fixes**:
- `delivered_at` timestamps for SMS
- Failed message detection
- Real delivery confirmation

#### B. Incoming Message Webhook (Response Tracking)

**Same number configuration:**

1. In the same phone number settings
2. Set **Webhook for incoming messages**:

```
A MESSAGE COMES IN:
Webhook: https://kelatic.com/api/webhooks/twilio/inbound
HTTP Method: POST
```

**What This Fixes**:
- Captures "Yes, I'm interested" responses
- STOP/opt-out handling
- Sentiment analysis on replies
- Lead status updates (responded, opted_out)

---

## Testing Webhooks

### Test SendGrid Webhook:

Run this from your terminal:

\`\`\`bash
curl -X POST https://kelatic.com/api/webhooks/sendgrid \\
  -H "Content-Type: application/json" \\
  -d '[{
    "email": "test@example.com",
    "event": "delivered",
    "sg_message_id": "test-123",
    "timestamp": 1234567890
  }]'
\`\`\`

**Expected**: Should return 200 OK

### Test Twilio Status Webhook:

\`\`\`bash
curl -X POST https://kelatic.com/api/webhooks/twilio/status \\
  -d "MessageSid=SM123test" \\
  -d "MessageStatus=delivered"
\`\`\`

**Expected**: Should return 200 OK

### Test Twilio SMS Webhook (Inbound):

\`\`\`bash
curl -X POST https://kelatic.com/api/webhooks/twilio/inbound \\
  -d "MessageSid=SM456test" \\
  -d "From=+13055551234" \\
  -d "To=+18559010579" \\
  -d "Body=Yes, I'm interested!"
\`\`\`

**Expected**: Should return 200 OK + TwiML response

---

## Verification After Setup

After configuring webhooks, run a small test campaign:

\`\`\`bash
# Create test CSV with YOUR phone number
cat > test_webhook_verify.csv << 'EOF'
firstname,lastname,phone,email,days_inactive,segment
YourName,Test,YOUR_PHONE,your.email@kelatic.com,45,GRAVEYARD
EOF

# Launch with 1 lead
bun run scripts/launch-graveyard-campaign.ts \\
  --file test_webhook_verify.csv \\
  --businessId f0c07a53-c001-486b-a30d-c1102b4dfadf \\
  --businessName "Kelatic Hair Lounge" \\
  --service "locs retwist" \\
  --count 1 \\
  --dryRun false \\
  --direct true
\`\`\`

**Then check:**

1. You receive the SMS within 2 minutes
2. Reply "Yes" to the SMS
3. Run this query:

\`\`\`sql
-- Should show delivered_at populated
SELECT
  to_phone,
  status,
  sent_at,
  delivered_at,
  direction
FROM campaign_messages
WHERE to_phone = 'YOUR_PHONE'
ORDER BY created_at DESC
LIMIT 5;
\`\`\`

**Expected results after webhook setup:**
- Outbound message with `delivered_at` timestamp ✅
- Inbound message with your "Yes" reply ✅
- Lead status changed to 'responded' ✅

---

## Current Webhook Endpoints (Already Built)

Your codebase already has these webhook handlers:

- ✅ `/api/webhooks/sendgrid` - Email event tracking
- ✅ `/api/webhooks/twilio/inbound` - Inbound SMS responses
- ✅ `/api/webhooks/twilio/status` - SMS delivery status

You just need to configure SendGrid/Twilio to call them!

---

## Summary

**Your campaigns work, but you need webhooks to:**
1. Know if messages were delivered
2. Track email opens/clicks
3. Capture inbound responses ("Yes, I'm interested!")
4. Handle opt-outs (STOP)
5. Update lead status automatically

**Time to set up**: ~10 minutes
**Impact**: Full visibility into campaign performance

Ready to configure webhooks?

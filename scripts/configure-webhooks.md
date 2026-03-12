# Webhook Configuration - Step by Step

## Your Webhook URLs (Production)

All endpoints are ready at: **https://kelatic.com**

```
SendGrid Events:    https://kelatic.com/api/webhooks/sendgrid
Twilio Inbound SMS: https://kelatic.com/api/webhooks/twilio/inbound
Twilio Status:      https://kelatic.com/api/webhooks/twilio/status
```

---

## Step 1: Configure SendGrid Webhook (5 minutes)

### A. Go to SendGrid Settings
1. Open: https://app.sendgrid.com/settings/mail_settings
2. Click: **"Event Webhook"** in the left menu

### B. Add Webhook URL
1. Toggle **"Event Notification"** to **ON**
2. In **"HTTP Post URL"** field, enter:
   ```
   https://kelatic.com/api/webhooks/sendgrid
   ```

### C. Select Events to Track
Check these boxes:
- ☑ **Delivered** - Track successful delivery
- ☑ **Opened** - Track email opens
- ☑ **Clicked** - Track link clicks
- ☑ **Bounced** - Handle invalid emails
- ☑ **Dropped** - Track SendGrid rejections
- ☑ **Spam Report** - Track spam complaints
- ☑ **Unsubscribe** - Handle unsubscribe requests

### D. Security (Optional)
For now, leave **"Signature Verification"** disabled. We'll add it later if needed.

You can enable it by setting these in your `.env`:
```bash
SENDGRID_EVENT_WEBHOOK_ALLOW_UNSIGNED=false
SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY=your_public_key_here
SENDGRID_EVENT_WEBHOOK_SECRET=your_secret_here
```

### E. Test & Save
1. Click **"Test Your Integration"** button
2. SendGrid will send test events to your webhook
3. Click **"Save"** at the bottom

**Expected:** You should see "Test successful" ✅

---

## Step 2: Configure Twilio Webhooks (5 minutes)

### A. Go to Twilio Phone Numbers
1. Open: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your number: **+18559010579**

### B. Configure Inbound Messages (Response Tracking)
1. Scroll to **"Messaging Configuration"** section
2. Find **"A MESSAGE COMES IN"** dropdown
3. Select: **Webhook**
4. Enter URL:
   ```
   https://kelatic.com/api/webhooks/twilio/inbound
   ```
5. Select HTTP Method: **POST**

### C. Configure Status Callbacks (Delivery Tracking)
1. Still in "Messaging Configuration"
2. Scroll to **"Status Callback URL"**
3. Enter URL:
   ```
   https://kelatic.com/api/webhooks/twilio/status
   ```
4. Select HTTP Method: **POST**

### D. Save Configuration
1. Click **"Save"** at the bottom of the page

**Done!** Twilio will now send all SMS events to your webhooks.

---

## Step 3: Test Webhooks (5 minutes)

### Test Email Tracking

Send a test email campaign to your own email:

```bash
cd /c/Users/shawn/Downloads/kelatic-booking

# Create test CSV with YOUR email
cat > test_webhook_email.csv << 'EOF'
firstname,lastname,phone,email,days_inactive,segment
Shawn,Test,+13055551234,your.email@kelatic.com,45,GRAVEYARD
EOF

# Launch 1-lead email campaign
bun run scripts/launch-graveyard-campaign.ts \
  --file test_webhook_email.csv \
  --businessId f0c07a53-c001-486b-a30d-c1102b4dfadf \
  --businessName "Kelatic Hair Lounge" \
  --service "locs retwist" \
  --count 1 \
  --dryRun false \
  --direct true
```

**Then check:**
1. You receive the email within 2 minutes
2. Open the email
3. Click a link in the email
4. Wait 2 minutes for webhooks to process

**Verify in Supabase:**
```sql
SELECT
  to_email,
  status,
  sent_at,
  delivered_at,
  opened_at,
  clicked_at
FROM campaign_messages
WHERE to_email = 'your.email@kelatic.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- `sent_at` has timestamp ✅
- `delivered_at` has timestamp ✅ (NEW!)
- `opened_at` has timestamp ✅ (NEW!)
- `clicked_at` has timestamp ✅ (NEW!)

---

### Test SMS Tracking

Send a test SMS to YOUR phone:

```bash
# Create test CSV with YOUR phone number
cat > test_webhook_sms.csv << 'EOF'
firstname,lastname,phone,email,days_inactive,segment
Shawn,Test,+1YOUR_PHONE_NUMBER,your.email@kelatic.com,45,GRAVEYARD
EOF

# Launch SMS campaign
bun run scripts/launch-graveyard-campaign.ts \
  --file test_webhook_sms.csv \
  --businessId f0c07a53-c001-486b-a30d-c1102b4dfadf \
  --businessName "Kelatic Hair Lounge" \
  --service "locs retwist" \
  --count 1 \
  --dryRun false \
  --direct true
```

**Then:**
1. Wait 2 minutes - you should receive SMS
2. Reply: **"Yes, I'm interested!"**
3. Wait 1 minute for webhook to process

**Verify in Supabase:**
```sql
-- Check delivery status
SELECT
  direction,
  body,
  status,
  sent_at,
  delivered_at,
  sentiment,
  is_booking_intent
FROM campaign_messages
WHERE to_phone LIKE '%YOUR_LAST_4_DIGITS%'
ORDER BY created_at DESC
LIMIT 3;
```

**Expected Results:**

| direction | body | status | delivered_at | sentiment | is_booking_intent |
|-----------|------|--------|--------------|-----------|-------------------|
| outbound | "Hey Shawn, it's been..." | delivered | ✅ timestamp | null | false |
| inbound | "Yes, I'm interested!" | received | null | positive | true |

**Also check lead status:**
```sql
SELECT
  first_name,
  status,
  has_responded,
  response_sentiment,
  last_response_text
FROM campaign_leads
WHERE phone LIKE '%YOUR_LAST_4_DIGITS%'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `status` = 'responded' ✅
- `has_responded` = true ✅
- `response_sentiment` = 'positive' ✅
- `last_response_text` = 'Yes, I'm interested!' ✅

---

## Troubleshooting

### SendGrid webhook not working?

1. **Check SendGrid logs:**
   - Go to: https://app.sendgrid.com/settings/mail_settings
   - Click "Event Webhook"
   - View "Event Notification History" at bottom

2. **Test manually:**
   ```bash
   curl -X POST https://kelatic.com/api/webhooks/sendgrid \
     -H "Content-Type: application/json" \
     -d '[{
       "email": "test@example.com",
       "event": "delivered",
       "sg_message_id": "test-123",
       "timestamp": 1234567890
     }]'
   ```

   **Expected:** `{"received":1}` or `{"error":"Unauthorized"}` (both are OK - means endpoint is working)

### Twilio webhooks not working?

1. **Check Twilio debugger:**
   - Go to: https://console.twilio.com/us1/monitor/logs/sms
   - Look for your test message
   - Check "Status Callbacks" section

2. **Test status webhook manually:**
   ```bash
   curl -X POST https://kelatic.com/api/webhooks/twilio/status \
     -d "MessageSid=SM123test" \
     -d "MessageStatus=delivered"
   ```

   **Expected:** `{"received":true}`

3. **Test inbound webhook manually:**
   ```bash
   curl -X POST https://kelatic.com/api/webhooks/twilio/inbound \
     -d "MessageSid=SM456test" \
     -d "From=+13055551234" \
     -d "To=+18559010579" \
     -d "Body=Test message"
   ```

   **Expected:** XML response with `<Response></Response>`

---

## Success Criteria

After configuration, you should see:

### In Dashboard (`/dashboard/campaigns`)
- ✅ Real delivery rates (not 0%)
- ✅ Response counts incrementing
- ✅ Email open rates showing

### In Database
- ✅ `delivered_at` timestamps populated
- ✅ `opened_at`, `clicked_at` for emails
- ✅ Inbound messages in `campaign_messages` with `direction='inbound'`
- ✅ Lead `status` changing to 'responded' when they reply

### In Hot Leads (`/dashboard/hot-leads`)
- ✅ Interested customers appearing automatically
- ✅ Their responses visible
- ✅ Sentiment analysis working

---

## Next Steps After Webhooks Work

1. **Re-analyze your Jan 21 campaign** to see actual delivery rates
2. **Check for responses you missed** (they're in the database but you couldn't see them)
3. **Launch new test with 5-10 leads** to verify end-to-end flow
4. **Scale to production** with confidence

Ready to configure? Start with Step 1 (SendGrid) - it's the easiest!

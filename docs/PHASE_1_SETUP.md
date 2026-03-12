# Phase 1 Email-Only Setup

## Quick Setup (5 minutes)

### 1. Add Feature Flags to .env

```bash
# Add these to your .env file:

# Phase 1: Email-only mode (SMS coming soon)
NEXT_PUBLIC_SMS_ENABLED=false
SMS_ENABLED=false
SMS_SEND_DISABLED=true
TWILIO_A2P_APPROVED=false

# Keep your existing SendGrid config for email:
# SENDGRID_API_KEY=SG.xxx
# SENDGRID_FROM_EMAIL=noreply@kelatic.com
```

### 2. Test Email Campaign

```bash
# Create test CSV with YOUR email
cat > test_email_phase1.csv << 'EOF'
firstname,lastname,phone,email,days_inactive,segment
YourName,Test,+13055551234,your.email@example.com,45,GRAVEYARD
EOF

# Launch email-only campaign (defaults to email now!)
bun run scripts/launch-graveyard-campaign.ts \
  --file test_email_phase1.csv \
  --businessId f0c07a53-c001-486b-a30d-c1102b4dfadf \
  --businessName "Kelatic Hair Lounge" \
  --service "locs retwist" \
  --count 1 \
  --dryRun false \
  --direct true

# Note: --channel email is the default, no need to specify!
```

### 3. Verify Email Arrives

Check your inbox for 3 emails over 7 days:
- **Day 1** (immediately): "It's been a while..."
- **Day 3** (+48 hours): "I'm doing some housekeeping..."
- **Day 7** (+144 hours): "This is my last reach out..."

### 4. Check Database

```sql
SELECT
  to_email,
  body,
  channel,
  status,
  cadence_day,
  sent_at,
  delivered_at,
  opened_at
FROM campaign_messages
WHERE to_email = 'your.email@example.com'
ORDER BY created_at DESC;
```

**Expected:**
- All messages should have `channel='email'` ✅
- No SMS messages ✅
- 3 total messages (Days 1, 3, 7) ✅

---

## Enable SMS for Specific Business (Optional)

If you want to enable SMS for Kelatic only:

```typescript
// In lib/features.ts, isFeatureEnabledForBusiness already has:
if (businessId === 'f0c07a53-c001-486b-a30d-c1102b4dfadf') {
  return true  // Enable SMS for Kelatic
}
```

Then launch with:
```bash
bun run scripts/launch-graveyard-campaign.ts \
  --file your_file.csv \
  --businessId f0c07a53-c001-486b-a30d-c1102b4dfadf \
  --channel sms \  # Explicitly request SMS
  --count 10 \
  --dryRun false \
  --direct true
```

---

## Production Deployment

### Vercel Environment Variables

In Vercel dashboard, set:

```
# Phase 1: Email-only
NEXT_PUBLIC_SMS_ENABLED=false
SMS_ENABLED=false
SMS_SEND_DISABLED=true
TWILIO_A2P_APPROVED=false

# Your existing email config
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@kelatic.com
NEXT_PUBLIC_APP_URL=https://kelatic.com
```

### Deploy

```bash
git add .
git commit -m "feat: Launch Phase 1 - Email-only campaigns"
git push origin main
```

Vercel will auto-deploy in ~2 minutes.

---

## Troubleshooting

### "SMS not enabled" error
**Symptom:** Script exits with error message
**Solution:** Make sure you're using `--channel email` (or omit it, email is default)

### No emails arriving
**Symptom:** Campaign creates but no emails received
**Solution:**
1. Check SendGrid webhook is configured
2. Verify SENDGRID_API_KEY is set
3. Check campaign_messages table for error_message

### Want to test SMS
**Symptom:** Need to verify SMS still works
**Solution:**
```bash
# Temporarily enable SMS
export SMS_ENABLED=true
export SMS_SEND_DISABLED=false
export TWILIO_A2P_APPROVED=true

# Launch SMS campaign
bun run scripts/launch-graveyard-campaign.ts \
  --file test.csv \
  --businessId YOUR_ID \
  --channel sms \
  --count 1 \
  --dryRun false \
  --direct true
```

---

## Next Steps

1. ✅ Email campaigns working
2. ⏳ Build "Upgrade to SMS" page (Week 2)
3. ⏳ Add A2P request form (Week 3)
4. ⏳ Automate A2P submission (Week 4)
5. ⏳ Enable SMS for first customers (Month 2)

---

## Success!

You now have:
- ✅ Email campaigns working instantly
- ✅ No A2P friction for new customers
- ✅ SMS preserved for future (Kelatic can still use it)
- ✅ Clean migration path to full SMS support

**Ready to ship!** 🚀

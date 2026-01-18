-- =============================================================================
-- SENDGRID EMAIL TRACKING FIELDS
-- Track SendGrid message IDs, opens, and clicks for email campaigns
-- =============================================================================

ALTER TABLE campaign_messages
  ADD COLUMN IF NOT EXISTS sendgrid_message_id TEXT,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS click_url TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_messages_sendgrid
  ON campaign_messages(sendgrid_message_id);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_opened
  ON campaign_messages(opened_at);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_clicked
  ON campaign_messages(clicked_at);

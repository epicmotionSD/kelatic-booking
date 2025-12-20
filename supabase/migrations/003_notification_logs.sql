-- Notification logs table for tracking sent emails and SMS
-- Add to existing migration or run separately

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'confirmation', 'cancellation', 'reminder_24hr', 'reminder_2hr'
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  recipient_email TEXT,
  recipient_phone TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment 
  ON notification_logs(appointment_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type_created 
  ON notification_logs(notification_type, created_at);

-- Add notification preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN DEFAULT TRUE;

-- Comment
COMMENT ON TABLE notification_logs IS 'Tracks all notifications sent to clients';

-- Full Notification System Schema
-- Migration: Enhanced notification system with in-app, push, templates, preferences, and queue

-- ============================================
-- NOTIFICATION TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- NotificationType
  channel TEXT NOT NULL, -- NotificationChannel: email, sms, push, in_app
  subject_template TEXT NOT NULL,
  content_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}', -- Array of template variables like {client_name}, {appointment_date}
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- System templates cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- IN-APP NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- NotificationType
  priority TEXT DEFAULT 'medium', -- NotificationPriority: low, medium, high, urgent
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT, -- URL to navigate to when clicked
  action_label TEXT, -- Button text like "View Appointment"
  metadata JSONB DEFAULT '{}', -- Additional data
  expires_at TIMESTAMPTZ, -- Auto-delete after this date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENHANCED NOTIFICATION LOGS TABLE
-- ============================================
-- Drop existing table and recreate with enhanced schema
DROP TABLE IF EXISTS notification_logs CASCADE;
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- NotificationType
  channel TEXT NOT NULL, -- NotificationChannel: email, sms, push, in_app
  recipient_email TEXT,
  recipient_phone TEXT,
  status TEXT DEFAULT 'pending', -- NotificationStatus: pending, sent, delivered, failed, bounced
  error_message TEXT,
  template_id UUID REFERENCES notification_templates(id),
  metadata JSONB DEFAULT '{}',
  
  -- Tracking timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- NotificationType
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, type)
);

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- NOTIFICATION QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- NotificationType
  channel TEXT NOT NULL, -- NotificationChannel
  priority TEXT DEFAULT 'medium', -- NotificationPriority
  data JSONB NOT NULL, -- All data needed to send the notification
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending', -- NotificationStatus
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD NOTIFICATION PREFERENCES TO PROFILES
-- ============================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_in_app BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_marketing BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL;

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Notification Templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_business_type 
  ON notification_templates(business_id, type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel_active 
  ON notification_templates(channel, is_active);

-- In-App Notifications
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_read 
  ON in_app_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_priority 
  ON in_app_notifications(created_at DESC, priority);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_expires_at 
  ON in_app_notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Enhanced Notification Logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment 
  ON notification_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_type 
  ON notification_logs(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_created 
  ON notification_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel_sent 
  ON notification_logs(channel, sent_at);

-- Notification Preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
  ON notification_preferences(user_id);

-- Push Subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active 
  ON push_subscriptions(user_id, is_active);

-- Notification Queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_status 
  ON notification_queue(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority_created 
  ON notification_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_type 
  ON notification_queue(user_id, type);

-- ============================================
-- SYSTEM NOTIFICATION TEMPLATES
-- ============================================

-- Insert default system templates
INSERT INTO notification_templates (name, type, channel, subject_template, content_template, variables, is_system, is_active) VALUES

-- Email Templates
('Booking Confirmation Email', 'booking_confirmation', 'email', 
  'Appointment Confirmed - {business_name}', 
  'Your appointment for {service_name} with {stylist_name} on {appointment_date} at {appointment_time} has been confirmed.',
  ARRAY['business_name', 'service_name', 'stylist_name', 'appointment_date', 'appointment_time', 'client_name'], 
  TRUE, TRUE),

('Booking Reminder 24hr Email', 'reminder_24hr', 'email',
  'Appointment Reminder - Tomorrow at {appointment_time}',
  'Don''t forget about your appointment tomorrow! {service_name} with {stylist_name} at {appointment_time}.',
  ARRAY['business_name', 'service_name', 'stylist_name', 'appointment_time', 'client_name'],
  TRUE, TRUE),

-- SMS Templates  
('Booking Confirmation SMS', 'booking_confirmation', 'sms',
  'Appointment Confirmed',
  'Hi {client_name}! Your appointment for {service_name} with {stylist_name} on {appointment_date} at {appointment_time} is confirmed. - {business_name}',
  ARRAY['client_name', 'service_name', 'stylist_name', 'appointment_date', 'appointment_time', 'business_name'],
  TRUE, TRUE),

('Booking Reminder 2hr SMS', 'reminder_2hr', 'sms',
  'Appointment in 2 hours',
  'Reminder: You have an appointment in 2 hours at {appointment_time}. {service_name} with {stylist_name}. - {business_name}',
  ARRAY['appointment_time', 'service_name', 'stylist_name', 'business_name'],
  TRUE, TRUE),

-- Push Notification Templates
('Booking Confirmation Push', 'booking_confirmation', 'push',
  'Appointment Confirmed!',
  'Your {service_name} appointment with {stylist_name} is confirmed for {appointment_date} at {appointment_time}.',
  ARRAY['service_name', 'stylist_name', 'appointment_date', 'appointment_time'],
  TRUE, TRUE),

-- In-App Templates
('Booking Confirmation In-App', 'booking_confirmation', 'in_app',
  'Appointment Confirmed',
  'Your appointment for {service_name} with {stylist_name} has been confirmed.',
  ARRAY['service_name', 'stylist_name', 'appointment_date', 'appointment_time'],
  TRUE, TRUE),

('Payment Received In-App', 'payment_received', 'in_app',
  'Payment Confirmed',
  'We''ve received your payment of ${total_amount} for your upcoming appointment.',
  ARRAY['total_amount', 'service_name'],
  TRUE, TRUE);

-- ============================================
-- CLEANUP FUNCTIONS
-- ============================================

-- Function to clean up expired in-app notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications() RETURNS void AS $$
BEGIN
  DELETE FROM in_app_notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notification logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs() RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at 
  BEFORE UPDATE ON notification_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_in_app_notifications_updated_at ON in_app_notifications;
CREATE TRIGGER update_in_app_notifications_updated_at 
  BEFORE UPDATE ON in_app_notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_queue_updated_at ON notification_queue;
CREATE TRIGGER update_notification_queue_updated_at 
  BEFORE UPDATE ON notification_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Notification Templates Policies
CREATE POLICY "Users can view active templates" ON notification_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- In-App Notifications Policies  
CREATE POLICY "Users can view their notifications" ON in_app_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON in_app_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Notification Logs Policies
CREATE POLICY "Admins can view notification logs" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can view their notification logs" ON notification_logs
  FOR SELECT USING (user_id = auth.uid());

-- Notification Preferences Policies
CREATE POLICY "Users can manage their preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Push Subscriptions Policies
CREATE POLICY "Users can manage their subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Notification Queue Policies (System/Admin only)
CREATE POLICY "System can manage notification queue" ON notification_queue
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE notification_templates IS 'Configurable notification templates for different types and channels';
COMMENT ON TABLE in_app_notifications IS 'In-app notifications displayed to users in the UI';
COMMENT ON TABLE notification_logs IS 'Audit log of all notifications sent with delivery tracking';
COMMENT ON TABLE notification_preferences IS 'Per-user, per-type notification channel preferences';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions for users';
COMMENT ON TABLE notification_queue IS 'Queue for scheduled and retry notifications';
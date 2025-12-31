-- Enable Row Level Security on all public tables
-- Migration: 007_enable_rls

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebooking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SERVICES - Public read, admin write
-- ============================================

CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- STYLIST_SERVICES - Public read, admin write
-- ============================================

CREATE POLICY "Anyone can view stylist services" ON stylist_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage stylist services" ON stylist_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- STYLIST_SCHEDULES - Public read, admin/stylist write
-- ============================================

CREATE POLICY "Anyone can view stylist schedules" ON stylist_schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Stylists can manage own schedule" ON stylist_schedules
  FOR ALL USING (stylist_id = auth.uid());

CREATE POLICY "Admins can manage all schedules" ON stylist_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- STYLIST_TIME_OFF - Stylists own, admin all
-- ============================================

CREATE POLICY "Stylists can view own time off" ON stylist_time_off
  FOR SELECT USING (stylist_id = auth.uid());

CREATE POLICY "Stylists can manage own time off" ON stylist_time_off
  FOR ALL USING (stylist_id = auth.uid());

CREATE POLICY "Admins can manage all time off" ON stylist_time_off
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- APPOINTMENT_ADDONS - Linked to appointments
-- ============================================

CREATE POLICY "Users can view addons for their appointments" ON appointment_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_addons.appointment_id
      AND (appointments.client_id = auth.uid() OR appointments.stylist_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all addons" ON appointment_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner', 'stylist')
    )
  );

-- ============================================
-- REBOOKING_REMINDERS - Client own, admin all
-- ============================================

CREATE POLICY "Clients can view own reminders" ON rebooking_reminders
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all reminders" ON rebooking_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- CHAT_CONVERSATIONS - Client own or by session
-- ============================================

CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (client_id = auth.uid() OR client_id IS NULL);

CREATE POLICY "Admins can view all conversations" ON chat_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- CHAT_MESSAGES - Linked to conversations
-- ============================================

CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.client_id = auth.uid() OR chat_conversations.client_id IS NULL)
    )
  );

CREATE POLICY "Users can add messages to own conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.client_id = auth.uid() OR chat_conversations.client_id IS NULL)
    )
  );

CREATE POLICY "Admins can view all messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- ACADEMY TABLES - Public read, admin write
-- ============================================

CREATE POLICY "Anyone can view active courses" ON academy_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON academy_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Anyone can view class sessions" ON academy_class_sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage class sessions" ON academy_class_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Students can view own enrollments" ON academy_enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments" ON academy_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- NOTIFICATION_LOGS - Admin only
-- ============================================

CREATE POLICY "Admins can view notification logs" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- BUSINESS TABLES - Admin only
-- ============================================

CREATE POLICY "Admins can manage businesses" ON businesses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can manage integrations" ON business_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can manage onboarding" ON onboarding_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

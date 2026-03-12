-- =====================================================
-- Migration: Functional AI Agents for x3o.ai Platform
-- Creates tables for: Marketing, Scheduling, Retention, Support agents
-- =====================================================

-- =====================================================
-- AGENT 1: MARKETING CAMPAIGN AUTOMATION
-- =====================================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'social', 'multi_channel', 'newsletter')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),

    -- Content
    content_calendar JSONB DEFAULT '[]',
    generated_content JSONB DEFAULT '{}',

    -- Targeting
    target_audience JSONB,
    segment_rules JSONB,

    -- Schedule
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    recurrence_rule TEXT,

    -- Performance
    metrics JSONB DEFAULT '{}',

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Posts (Social Media)
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,

    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter', 'linkedin')),
    content TEXT NOT NULL,
    media_urls TEXT[],
    hashtags TEXT[],

    scheduled_for TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),

    -- Trinity generation reference
    trinity_generation_id UUID REFERENCES trinity_generations(id),

    -- Performance tracking
    engagement_metrics JSONB DEFAULT '{}',
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Calendar Items
CREATE TABLE IF NOT EXISTS content_calendar_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    content_type TEXT NOT NULL CHECK (content_type IN ('social', 'email', 'blog', 'newsletter', 'video')),
    title TEXT NOT NULL,
    content_preview TEXT,

    scheduled_date DATE NOT NULL,
    scheduled_time TIME,

    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'created', 'approved', 'published', 'skipped')),
    assigned_to UUID,

    -- Links to actual content
    scheduled_post_id UUID REFERENCES scheduled_posts(id),
    campaign_id UUID REFERENCES marketing_campaigns(id),
    trinity_generation_id UUID REFERENCES trinity_generations(id),

    ai_suggestions JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,

    metric_date DATE NOT NULL,

    -- Email metrics
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    unsubscribes INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,

    -- Social metrics
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,

    -- Conversion
    bookings_attributed INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, metric_date)
);

-- =====================================================
-- AGENT 2: SCHEDULING INTELLIGENCE
-- =====================================================

-- Cancellation Predictions
CREATE TABLE IF NOT EXISTS cancellation_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,

    risk_score DECIMAL(3,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    risk_level TEXT GENERATED ALWAYS AS (
        CASE
            WHEN risk_score >= 0.7 THEN 'high'
            WHEN risk_score >= 0.4 THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    risk_factors JSONB DEFAULT '[]',

    -- Actions taken
    reminder_escalated BOOLEAN DEFAULT false,
    deposit_requested BOOLEAN DEFAULT false,
    confirmation_requested BOOLEAN DEFAULT false,

    -- Outcome tracking
    actual_outcome TEXT CHECK (actual_outcome IN ('completed', 'cancelled', 'no_show', 'rescheduled')),
    prediction_accurate BOOLEAN,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Gaps
CREATE TABLE IF NOT EXISTS schedule_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    stylist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    gap_date DATE NOT NULL,
    gap_start TIME NOT NULL,
    gap_end TIME NOT NULL,
    gap_duration_minutes INTEGER NOT NULL,

    -- Gap-filling attempts
    offered_to_clients UUID[],
    fill_attempts INTEGER DEFAULT 0,
    filled_by_appointment_id UUID REFERENCES appointments(id),

    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'offered', 'filled', 'expired', 'ignored')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Booking Patterns
CREATE TABLE IF NOT EXISTS client_booking_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Metrics
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancellation_count INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    late_cancellation_count INTEGER DEFAULT 0,
    rescheduled_count INTEGER DEFAULT 0,

    -- Calculated rates
    completion_rate DECIMAL(5,2),
    cancellation_rate DECIMAL(5,2),
    no_show_rate DECIMAL(5,2),

    -- Patterns
    average_booking_lead_days INTEGER,
    preferred_day_of_week INTEGER,
    preferred_time_slot TEXT,
    average_days_between_visits INTEGER,

    -- Reliability score (0-100)
    reliability_score INTEGER DEFAULT 50,

    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, client_id)
);

-- =====================================================
-- AGENT 3: CLIENT RETENTION
-- =====================================================

-- Client Health Scores
CREATE TABLE IF NOT EXISTS client_health_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    churn_risk TEXT NOT NULL CHECK (churn_risk IN ('low', 'medium', 'high', 'critical')),

    -- RFM Score components
    recency_score INTEGER,
    frequency_score INTEGER,
    monetary_score INTEGER,
    engagement_score INTEGER,

    -- Risk factors
    risk_factors JSONB DEFAULT '[]',

    -- Trend
    previous_score INTEGER,
    score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining')),

    -- Key dates
    last_visit_date DATE,
    days_since_last_visit INTEGER,
    predicted_next_visit DATE,

    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, client_id)
);

-- VIP Tiers
CREATE TABLE IF NOT EXISTS vip_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    -- Qualification criteria
    min_spend DECIMAL(10,2),
    min_visits INTEGER,
    min_tenure_months INTEGER,

    -- Benefits
    benefits JSONB DEFAULT '[]',
    discount_percent DECIMAL(5,2),
    priority_booking BOOLEAN DEFAULT false,
    free_addons TEXT[],

    -- Display
    badge_color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client VIP Status
CREATE TABLE IF NOT EXISTS client_vip_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES vip_tiers(id),

    -- Metrics
    lifetime_spend DECIMAL(10,2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    tenure_months INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'at_risk', 'churned', 'reactivated')),
    achieved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, client_id)
);

-- Retention Campaigns
CREATE TABLE IF NOT EXISTS retention_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('win_back', 're_engagement', 'vip_reward', 'birthday', 'anniversary', 'custom')),

    -- Targeting
    target_segment TEXT CHECK (target_segment IN ('at_risk', 'churned', 'vip', 'new', 'all')),
    target_criteria JSONB,

    -- Content
    email_subject TEXT,
    email_content TEXT,
    sms_content TEXT,

    -- Offer
    offer_type TEXT CHECK (offer_type IN ('discount', 'free_addon', 'gift', 'none')),
    offer_value DECIMAL(10,2),
    offer_code TEXT,
    offer_expires_days INTEGER,

    -- Automation
    trigger_condition JSONB,
    is_automated BOOLEAN DEFAULT false,

    -- Performance
    clients_targeted INTEGER DEFAULT 0,
    clients_opened INTEGER DEFAULT 0,
    clients_clicked INTEGER DEFAULT 0,
    clients_converted INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,

    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-engagement Triggers
CREATE TABLE IF NOT EXISTS reengagement_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('inactive_30', 'inactive_60', 'inactive_90', 'birthday', 'anniversary', 'vip_expiring')),
    trigger_date DATE NOT NULL,

    -- Action taken
    campaign_id UUID REFERENCES retention_campaigns(id),
    channel TEXT CHECK (channel IN ('email', 'sms', 'both')),
    sent_at TIMESTAMPTZ,

    -- Response
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    booked_at TIMESTAMPTZ,
    booking_id UUID REFERENCES appointments(id),

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'converted', 'expired', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AGENT 4: SUPPORT ASSISTANT
-- =====================================================

-- Support Knowledge Base
CREATE TABLE IF NOT EXISTS support_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    category TEXT NOT NULL CHECK (category IN ('booking', 'payment', 'account', 'feature', 'troubleshooting', 'general')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[],

    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Conversations
CREATE TABLE IF NOT EXISTS support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- For anonymous users
    session_id TEXT,

    -- Conversation metadata
    channel TEXT DEFAULT 'chat' CHECK (channel IN ('chat', 'email', 'in_app')),
    topic TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated')),

    -- Resolution
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated', 'abandoned')),
    resolved_by TEXT CHECK (resolved_by IN ('ai', 'human', 'self_service')),
    resolution_time_seconds INTEGER,

    -- Escalation
    escalated_at TIMESTAMPTZ,
    escalated_to TEXT,

    -- Rating
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Messages
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES support_conversations(id) ON DELETE CASCADE,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'agent')),
    content TEXT NOT NULL,

    -- AI metadata
    intent_detected TEXT,
    confidence DECIMAL(3,2),
    knowledge_articles_used UUID[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets (for escalation)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES support_conversations(id),
    user_id UUID REFERENCES auth.users(id),

    subject TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
    assigned_to TEXT,

    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Discovery Tracking
CREATE TABLE IF NOT EXISTS feature_discovery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    feature_name TEXT NOT NULL,
    discovered_via TEXT CHECK (discovered_via IN ('ai_suggestion', 'onboarding', 'support', 'organic', 'tour')),

    shown_at TIMESTAMPTZ DEFAULT NOW(),
    clicked_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Marketing indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_business ON marketing_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_business ON scheduled_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_business_date ON content_calendar_items(business_id, scheduled_date);

-- Scheduling indexes
CREATE INDEX IF NOT EXISTS idx_cancellation_predictions_appointment ON cancellation_predictions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_predictions_risk ON cancellation_predictions(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_gaps_business_date ON schedule_gaps(business_id, gap_date);
CREATE INDEX IF NOT EXISTS idx_schedule_gaps_status ON schedule_gaps(status);
CREATE INDEX IF NOT EXISTS idx_client_booking_patterns_client ON client_booking_patterns(client_id);

-- Retention indexes
CREATE INDEX IF NOT EXISTS idx_client_health_scores_business ON client_health_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_client_health_scores_risk ON client_health_scores(churn_risk);
CREATE INDEX IF NOT EXISTS idx_client_vip_status_business ON client_vip_status(business_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaigns_business ON retention_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_triggers_date ON reengagement_triggers(trigger_date);

-- Support indexes
CREATE INDEX IF NOT EXISTS idx_support_knowledge_category ON support_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_support_conversations_business ON support_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_business ON support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_vip_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reengagement_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_discovery ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON marketing_campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON scheduled_posts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON content_calendar_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON campaign_analytics FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON cancellation_predictions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON schedule_gaps FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON client_booking_patterns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON client_health_scores FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON vip_tiers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON client_vip_status FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON retention_campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON reengagement_triggers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON support_knowledge_base FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON support_conversations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON support_messages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON support_tickets FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON feature_discovery FOR ALL TO service_role USING (true);

-- =====================================================
-- SEED DEFAULT VIP TIERS FOR KELATIC
-- =====================================================

INSERT INTO vip_tiers (business_id, name, description, min_spend, min_visits, discount_percent, priority_booking, badge_color, sort_order)
SELECT
    id,
    'Gold',
    'Loyal clients with consistent visits',
    500,
    5,
    5,
    false,
    '#FFD700',
    1
FROM businesses WHERE slug = 'kelatic'
ON CONFLICT DO NOTHING;

INSERT INTO vip_tiers (business_id, name, description, min_spend, min_visits, discount_percent, priority_booking, badge_color, sort_order)
SELECT
    id,
    'Platinum',
    'Premium clients with high lifetime value',
    1500,
    15,
    10,
    true,
    '#E5E4E2',
    2
FROM businesses WHERE slug = 'kelatic'
ON CONFLICT DO NOTHING;

INSERT INTO vip_tiers (business_id, name, description, min_spend, min_visits, discount_percent, priority_booking, badge_color, sort_order)
SELECT
    id,
    'Diamond',
    'Elite clients and brand ambassadors',
    3000,
    30,
    15,
    true,
    '#B9F2FF',
    3
FROM businesses WHERE slug = 'kelatic'
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DEFAULT KNOWLEDGE BASE ARTICLES
-- =====================================================

INSERT INTO support_knowledge_base (business_id, category, question, answer, keywords)
VALUES
    (NULL, 'booking', 'How do I book an appointment?', 'You can book an appointment by clicking the "Book Now" button on our website. Select your service, choose a stylist and available time slot, then complete the booking with your contact information.', ARRAY['book', 'appointment', 'schedule', 'reserve']),
    (NULL, 'booking', 'How do I cancel or reschedule my appointment?', 'You can cancel or reschedule your appointment by clicking the link in your confirmation email, or by contacting us directly. Please note our cancellation policy requires at least 24 hours notice.', ARRAY['cancel', 'reschedule', 'change', 'appointment']),
    (NULL, 'payment', 'What payment methods do you accept?', 'We accept all major credit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay. You can pay online when booking or in-person at checkout.', ARRAY['payment', 'credit card', 'pay', 'cash']),
    (NULL, 'payment', 'Is a deposit required?', 'Some services may require a deposit to secure your booking. The deposit amount will be shown during the booking process and is applied to your final bill.', ARRAY['deposit', 'prepay', 'hold']),
    (NULL, 'account', 'How do I create an account?', 'You can create an account during the booking process, or sign up on our website. Having an account allows you to view your booking history and save your preferences.', ARRAY['account', 'sign up', 'register', 'login']),
    (NULL, 'general', 'What are your hours of operation?', 'Our operating hours vary by location. Please check our website or booking page for current hours, as we may have different hours for holidays or special events.', ARRAY['hours', 'open', 'closed', 'schedule']);

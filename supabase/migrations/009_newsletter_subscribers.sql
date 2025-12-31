-- Newsletter Subscribers Table
-- For email marketing and newsletter campaigns

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================

CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,

    -- Source tracking
    source TEXT DEFAULT 'website',  -- 'website', 'booking', 'admin', etc.

    -- Preferences
    subscribed BOOLEAN DEFAULT true,
    interests TEXT[],  -- e.g., ['loc-care', 'promotions', 'events']

    -- Email tracking
    emails_sent INTEGER DEFAULT 0,
    last_email_at TIMESTAMPTZ,

    -- Unsubscribe tracking
    unsubscribed_at TIMESTAMPTZ,
    unsubscribe_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Optional link to profile
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_subscribed ON newsletter_subscribers(subscribed);
CREATE INDEX idx_newsletter_subscribers_source ON newsletter_subscribers(source);

-- Track newsletter campaigns sent
CREATE TABLE newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,

    -- Targeting
    target_interests TEXT[],  -- null = all subscribers

    -- Stats
    recipients_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
    scheduled_for TIMESTAMPTZ,

    -- Created by
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track individual email sends
CREATE TABLE newsletter_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,

    -- Status
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced BOOLEAN DEFAULT false,

    -- SendGrid tracking
    sendgrid_message_id TEXT,

    UNIQUE(campaign_id, subscriber_id)
);

-- Indexes for campaign tracking
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_sends_campaign ON newsletter_sends(campaign_id);
CREATE INDEX idx_newsletter_sends_subscriber ON newsletter_sends(subscriber_id);

-- Trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_newsletter_campaigns_updated_at
    BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

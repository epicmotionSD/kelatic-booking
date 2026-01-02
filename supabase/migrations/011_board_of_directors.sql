-- Board of Directors: AI Agent Orchestration System
-- Migration: 011_board_of_directors
-- Enables autonomous AI agents to run x3o.ai operations

-- ============================================
-- AGENTS TABLE (Board Members)
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    name TEXT NOT NULL,                         -- Atlas, Nova, Pulse, Apex
    role TEXT NOT NULL,                         -- ceo, cto, cmo, cfo
    description TEXT,
    avatar TEXT,                                -- Emoji or URL

    -- Status
    status TEXT DEFAULT 'idle',                 -- idle, active, paused, error, offline

    -- Capabilities & Permissions
    capabilities TEXT[] DEFAULT '{}',
    permissions JSONB DEFAULT '{
        "canDeploy": false,
        "canModifyBudget": false,
        "canAccessStripe": false,
        "canAccessAnalytics": true,
        "canCreateTasks": true,
        "canApproveDecisions": false,
        "maxBudgetLimit": 100
    }'::jsonb,

    -- Agent manifest (LLM system prompt, tools, etc.)
    manifest JSONB DEFAULT '{}'::jsonb,

    -- Metrics
    tasks_completed INTEGER DEFAULT 0,
    tasks_in_progress INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,

    -- Activity tracking
    last_active_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(role)
);

-- ============================================
-- AGENT SESSIONS (Active work periods)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    -- Session metrics
    tasks_processed INTEGER DEFAULT 0,
    decisions_made INTEGER DEFAULT 0,

    -- Session logs (summarized)
    summary TEXT
);

-- ============================================
-- AGENT TASKS (Work queue)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Task routing
    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,

    -- Task details
    task_type TEXT NOT NULL,                    -- strategic_plan, analyze_opportunity, etc.
    title TEXT NOT NULL,
    description TEXT,
    payload JSONB DEFAULT '{}'::jsonb,

    -- Priority & Status
    priority TEXT DEFAULT 'medium',             -- low, medium, high, critical
    status TEXT DEFAULT 'pending',              -- pending, in_progress, completed, failed, cancelled

    -- Results
    result JSONB,
    error TEXT,

    -- Timing
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================
-- AGENT DECISIONS (Audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Decision maker
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
    agent_role TEXT NOT NULL,

    -- Decision details
    decision_type TEXT NOT NULL,                -- deploy_template, adjust_budget, create_campaign, etc.
    title TEXT NOT NULL,
    description TEXT,
    reasoning TEXT,                             -- AI explanation of decision

    -- Decision data
    data JSONB DEFAULT '{}'::jsonb,
    confidence DECIMAL(3,2) DEFAULT 0,          -- 0.00 to 1.00
    impact TEXT DEFAULT 'medium',               -- low, medium, high, critical

    -- Approval workflow
    approved BOOLEAN DEFAULT false,
    approved_by UUID,                           -- Can be agent_id or user_id
    rejected_reason TEXT,
    executed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT ALERTS (System notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    -- Alert details
    alert_type TEXT NOT NULL,                   -- revenue_drop, high_churn, competitor_activity, etc.
    severity TEXT DEFAULT 'info',               -- info, warning, error, critical
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,

    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT COMMUNICATIONS (Inter-agent messages)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    message_type TEXT NOT NULL,                 -- request, response, broadcast, escalation
    subject TEXT,
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STRATEGIC INITIATIVES (CEO-driven goals)
-- ============================================

CREATE TABLE IF NOT EXISTS strategic_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Initiative details
    title TEXT NOT NULL,
    description TEXT,
    objective TEXT NOT NULL,                    -- revenue_growth, user_acquisition, churn_reduction

    -- Metrics
    target_metric TEXT,
    target_value DECIMAL(15,2),
    current_value DECIMAL(15,2) DEFAULT 0,

    -- Timeline
    start_date DATE,
    end_date DATE,

    -- Status
    status TEXT DEFAULT 'planning',             -- planning, active, completed, paused
    priority TEXT DEFAULT 'medium',

    -- Assignment
    lead_agent_id UUID REFERENCES agents(id),
    participating_agents UUID[],

    -- Progress tracking
    milestones JSONB DEFAULT '[]'::jsonb,
    progress_percent INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMAND CENTER VIEW (Materialized for performance)
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS command_center_summary AS
SELECT
    (SELECT COUNT(*) FROM agents WHERE status = 'active') as active_agents,
    (SELECT COUNT(*) FROM agent_tasks WHERE status = 'pending') as pending_tasks,
    (SELECT COUNT(*) FROM agent_decisions WHERE approved = false) as pending_decisions,
    (SELECT COUNT(*) FROM agent_alerts WHERE resolved = false) as active_alerts,
    (SELECT COUNT(*) FROM agent_decisions WHERE DATE(created_at) = CURRENT_DATE) as decisions_today,
    (SELECT COUNT(*) FROM businesses WHERE is_active = true) as total_businesses,
    (SELECT COUNT(*) FROM businesses WHERE DATE(created_at) = CURRENT_DATE) as new_businesses_today,
    (SELECT COALESCE(SUM(CASE WHEN plan = 'starter' THEN 97 WHEN plan = 'professional' THEN 297 WHEN plan = 'enterprise' THEN 997 ELSE 0 END), 0) FROM businesses WHERE is_active = true) as monthly_mrr
;

-- ============================================
-- SEED BOARD OF DIRECTORS
-- ============================================

INSERT INTO agents (name, role, description, avatar, capabilities, permissions) VALUES
(
    'Atlas',
    'ceo',
    'Chief Executive Officer - Strategic supervisor and coordinator for x3o.ai platform growth',
    '🎯',
    ARRAY['strategic_planning', 'task_delegation', 'decision_approval', 'escalation', 'agent_coordination'],
    '{
        "canDeploy": true,
        "canModifyBudget": true,
        "canAccessStripe": true,
        "canAccessAnalytics": true,
        "canCreateTasks": true,
        "canApproveDecisions": true,
        "maxBudgetLimit": 10000
    }'::jsonb
),
(
    'Nova',
    'cto',
    'Chief Technology Officer - Platform architecture, template management, and technical operations',
    '🔧',
    ARRAY['deploy_templates', 'technical_analysis', 'api_management', 'performance_monitoring', 'security_audit'],
    '{
        "canDeploy": true,
        "canModifyBudget": false,
        "canAccessStripe": false,
        "canAccessAnalytics": true,
        "canCreateTasks": true,
        "canApproveDecisions": false,
        "maxBudgetLimit": 500
    }'::jsonb
),
(
    'Pulse',
    'cmo',
    'Chief Marketing Officer - Agency acquisition, campaign optimization, and growth marketing',
    '📈',
    ARRAY['campaign_management', 'market_analysis', 'content_strategy', 'lead_generation', 'conversion_optimization'],
    '{
        "canDeploy": false,
        "canModifyBudget": true,
        "canAccessStripe": false,
        "canAccessAnalytics": true,
        "canCreateTasks": true,
        "canApproveDecisions": false,
        "maxBudgetLimit": 2000
    }'::jsonb
),
(
    'Apex',
    'cfo',
    'Chief Financial Officer - Revenue analytics, subscription management, and financial operations',
    '💰',
    ARRAY['revenue_analysis', 'budget_management', 'subscription_analytics', 'financial_forecasting', 'cost_optimization'],
    '{
        "canDeploy": false,
        "canModifyBudget": true,
        "canAccessStripe": true,
        "canAccessAnalytics": true,
        "canCreateTasks": true,
        "canApproveDecisions": true,
        "maxBudgetLimit": 5000
    }'::jsonb
)
ON CONFLICT (role) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    permissions = EXCLUDED.permissions;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_agent_tasks_to_agent ON agent_tasks(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority ON agent_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created ON agent_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_approved ON agent_decisions(approved);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON agent_decisions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_alerts_resolved ON agent_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_severity ON agent_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active ON agent_sessions(agent_id) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_status ON strategic_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_lead ON strategic_initiatives(lead_agent_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update agent last_active_at when task completed
CREATE OR REPLACE FUNCTION update_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed') AND OLD.status != NEW.status THEN
        UPDATE agents
        SET last_active_at = NOW(),
            tasks_completed = tasks_completed + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            tasks_failed = tasks_failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
        WHERE id = NEW.to_agent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_task_completed
    AFTER UPDATE ON agent_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_activity();

-- Refresh command center summary periodically
CREATE OR REPLACE FUNCTION refresh_command_center_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW command_center_summary;
END;
$$ LANGUAGE plpgsql;

-- Update agents.updated_at
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_strategic_initiatives_updated_at
    BEFORE UPDATE ON strategic_initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

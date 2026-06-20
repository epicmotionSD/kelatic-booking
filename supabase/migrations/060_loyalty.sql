-- ============================================================
-- Migration 060: Loyalty & Rewards
-- A flexible loyalty layer that works for both worlds:
--   - Appointments (Kelatic Hair Lounge, Barber Block) -> earn per visit
--   - Commerce / cafe (Kelatic Vitality House)        -> earn per dollar
-- Same owner, different brands, different mechanics. One schema.
--
-- Design choices for flexibility:
--   * earn_rules are JSONB so each tenant configures its own triggers
--     ('appointment.completed', 'order.paid', category bonuses, etc.)
--   * tier_config is JSONB so thresholds + perks differ per tenant
--   * rewards are polymorphic across services or products
--   * program_group_id (nullable) lets the owner share a wallet across
--     brands later without a schema change -- v1 keeps them isolated
--   * loyalty_accounts anchor to clients(id) -- the canonical, tenant-
--     scoped customer record (works for walk-ins, imports, and registered
--     profiles alike). Earning code resolves profiles/orders/appointments
--     to a clients row at write time.
--
-- Purely additive / idempotent.
-- ============================================================

-- ============================================
-- 1. LOYALTY PROGRAMS  (one per business)
-- ============================================
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Optional grouping for cross-brand wallets (same owner).
    -- Same UUID on two programs = candidate for shared balance rollup.
    program_group_id UUID,

    -- Identity / branding
    name             TEXT NOT NULL,                 -- "Kelatic Locs", "Vitality Stars"
    currency_label   TEXT NOT NULL DEFAULT 'Points',-- display only
    description      TEXT,

    -- Flexible earn rules. Example shapes:
    --   { "trigger": "appointment.completed", "points": 10 }
    --   { "trigger": "order.paid", "points": 1, "per": "dollar" }
    --   { "trigger": "order.paid", "category_id": "<uuid>", "multiplier": 2 }
    --   { "trigger": "client.created", "points": 50, "once": true }
    earn_rules       JSONB NOT NULL DEFAULT '{"rules":[]}'::jsonb,

    -- Flexible tier config. Example:
    --   { "tiers": [
    --       { "name": "Member",  "threshold": 0,    "perks": [] },
    --       { "name": "Insider", "threshold": 500,  "perks": ["10% off retail"] }
    --     ] }
    tier_config      JSONB NOT NULL DEFAULT '{"tiers":[]}'::jsonb,

    -- Optional: expire stale points
    points_expire_days INTEGER,

    is_active        BOOLEAN NOT NULL DEFAULT true,

    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (business_id)   -- v1: one active program per tenant
);

-- ============================================
-- 2. LOYALTY ACCOUNTS  (per client, per program)
-- ============================================
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id       UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Denormalized running totals (kept in sync by the earn/redeem path
    -- and reconcilable from loyalty_transactions). See view below.
    balance          INTEGER NOT NULL DEFAULT 0,    -- current redeemable points
    lifetime_points  INTEGER NOT NULL DEFAULT 0,    -- earn-only, used for tiering
    current_tier     TEXT,                          -- snapshotted from tier_config

    enrolled_at      TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ,

    UNIQUE (program_id, client_id)
);

-- ============================================
-- 3. LOYALTY REWARDS  (catalog)
--    Polymorphic target: at most one of (service_id, product_id) set.
-- ============================================
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id       UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,

    name             TEXT NOT NULL,                 -- "Free deep condition", "$5 off"
    description      TEXT,
    cost_points      INTEGER NOT NULL CHECK (cost_points >= 0),

    -- Reward shape
    reward_type      TEXT NOT NULL
                     CHECK (reward_type IN (
                       'percent_off',     -- whole-ticket % off
                       'amount_off',      -- whole-ticket flat $ off (cents)
                       'free_product',    -- free product line item
                       'free_service',    -- free service / appointment
                       'free_addon'       -- free add-on / modifier on existing line
                     )),

    -- Polymorphic target (nullable; depends on reward_type)
    service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
    product_id       UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Type-specific config:
    --   percent_off:  { "percent": 10, "max_discount_cents": 2000 }
    --   amount_off:   { "amount_cents": 500, "min_spend_cents": 2500 }
    --   free_addon:   { "addon_option_id": "<uuid>" }
    config           JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Eligibility / limits
    tier_required    TEXT,                          -- e.g. only Insiders can claim
    is_active        BOOLEAN NOT NULL DEFAULT true,
    sort_order       INTEGER DEFAULT 0,

    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),

    -- Polymorphic exclusivity
    CONSTRAINT loyalty_rewards_one_target
      CHECK (
        (service_id IS NULL) OR (product_id IS NULL)
      )
);

-- ============================================
-- 4. LOYALTY TRANSACTIONS  (immutable ledger)
--    SUM(delta) per account == balance. Universal across both worlds.
-- ============================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id       UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    program_id       UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,

    -- Signed delta: +ve = earn, -ve = redeem / expire / adjust-down
    delta            INTEGER NOT NULL,

    reason           TEXT NOT NULL
                     CHECK (reason IN (
                       'earn',
                       'redeem',
                       'adjust',
                       'expire',
                       'referral',
                       'signup_bonus'
                     )),

    -- Source linkage (any combination may be set)
    appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
    order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
    reward_id        UUID REFERENCES loyalty_rewards(id) ON DELETE SET NULL,

    -- Free-form context (rule that matched, multiplier applied, etc.)
    metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
    note             TEXT,

    created_at       TIMESTAMPTZ DEFAULT NOW(),
    created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- 5. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_business      ON loyalty_programs(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_group         ON loyalty_programs(program_group_id) WHERE program_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_program       ON loyalty_accounts(program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_client        ON loyalty_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_last_activity ON loyalty_accounts(program_id, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_program        ON loyalty_rewards(program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active         ON loyalty_rewards(program_id, is_active);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_account             ON loyalty_transactions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_program             ON loyalty_transactions(program_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_appointment         ON loyalty_transactions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_order               ON loyalty_transactions(order_id)       WHERE order_id IS NOT NULL;

-- ============================================
-- 6. ROW LEVEL SECURITY  (mirrors 050 commerce pattern)
-- ============================================
ALTER TABLE loyalty_programs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Public can read active reward catalog (so storefront can show "spend points for...")
CREATE POLICY "Public can view active rewards" ON loyalty_rewards
    FOR SELECT USING (is_active = true);

-- Business admins manage the program
CREATE POLICY "Business admins manage loyalty program" ON loyalty_programs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = loyalty_programs.business_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

CREATE POLICY "Business admins manage loyalty rewards" ON loyalty_rewards
    FOR ALL USING (
        EXISTS (SELECT 1 FROM loyalty_programs p
                JOIN business_members m ON m.business_id = p.business_id
                WHERE p.id = loyalty_rewards.program_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

-- Business staff can see all accounts + transactions within their tenant
CREATE POLICY "Business staff view loyalty accounts" ON loyalty_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM loyalty_programs p
                JOIN business_members m ON m.business_id = p.business_id
                WHERE p.id = loyalty_accounts.program_id
                  AND m.user_id = auth.uid()));

CREATE POLICY "Business admins manage loyalty accounts" ON loyalty_accounts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM loyalty_programs p
                JOIN business_members m ON m.business_id = p.business_id
                WHERE p.id = loyalty_accounts.program_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

CREATE POLICY "Business staff view loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM loyalty_programs p
                JOIN business_members m ON m.business_id = p.business_id
                WHERE p.id = loyalty_transactions.program_id
                  AND m.user_id = auth.uid()));

-- Writes (earn/redeem) go through service-role API routes, same as the
-- existing payments + orders pipeline, so no public/auth write policies here.

-- ============================================
-- 7. updated_at TRIGGERS
-- ============================================
CREATE TRIGGER update_loyalty_programs_updated_at
    BEFORE UPDATE ON loyalty_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loyalty_rewards_updated_at
    BEFORE UPDATE ON loyalty_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 8. VIEWS
-- ============================================

-- Authoritative balance reconciled from the ledger -- use this to detect
-- drift against loyalty_accounts.balance / lifetime_points.
-- security_invoker = RLS on the underlying tables is enforced for the
-- querying role, not the view creator. (Postgres default is DEFINER, which
-- bypasses RLS -- see Supabase advisor 0010.)
DROP VIEW IF EXISTS loyalty_account_balances_v;
CREATE VIEW loyalty_account_balances_v
WITH (security_invoker = on)
AS
SELECT
    a.id                                       AS account_id,
    a.program_id,
    a.client_id,
    COALESCE(SUM(t.delta), 0)::int             AS balance,
    COALESCE(SUM(CASE WHEN t.delta > 0
                      THEN t.delta ELSE 0 END), 0)::int AS lifetime_points,
    MAX(t.created_at)                          AS last_activity_at
FROM loyalty_accounts a
LEFT JOIN loyalty_transactions t ON t.account_id = a.id
GROUP BY a.id, a.program_id, a.client_id;

-- Cross-brand rollup for shared wallets (when program_group_id is set on
-- multiple programs by the same owner). Useful even before "shared balance"
-- is enabled -- powers Kelatic-wide reporting today.
DROP VIEW IF EXISTS loyalty_group_balances_v;
CREATE VIEW loyalty_group_balances_v
WITH (security_invoker = on)
AS
SELECT
    p.program_group_id,
    a.client_id,
    SUM(a.balance)::int          AS balance,
    SUM(a.lifetime_points)::int  AS lifetime_points
FROM loyalty_accounts a
JOIN loyalty_programs p ON p.id = a.program_id
WHERE p.program_group_id IS NOT NULL
GROUP BY p.program_group_id, a.client_id;

-- ============================================
-- 9. SEED: starter programs for existing tenants
--    Salon earns 10pts per completed appointment.
--    Vitality House earns 1pt per dollar spent.
--    Both grouped under the same program_group_id so the owner can flip
--    on cross-brand wallets later without touching schema.
-- ============================================
DO $$
DECLARE
    kelatic_group UUID := uuid_generate_v4();
BEGIN
    -- Kelatic Hair Lounge (appointment-based earning)
    INSERT INTO loyalty_programs (
        business_id, program_group_id, name, currency_label, description,
        earn_rules, tier_config
    )
    SELECT
        b.id, kelatic_group, 'Kelatic Locs', 'Locs',
        'Earn Locs every time you visit. Redeem for upgrades and free services.',
        '{"rules":[
            {"trigger":"appointment.completed","points":10},
            {"trigger":"client.created","points":50,"once":true}
          ]}'::jsonb,
        '{"tiers":[
            {"name":"Member","threshold":0,"perks":[]},
            {"name":"Insider","threshold":300,"perks":["Priority rebooking","Free deep condition / quarter"]},
            {"name":"VIP","threshold":1000,"perks":["10% off retail","Birthday service upgrade"]}
          ]}'::jsonb
    FROM businesses b WHERE b.slug = 'kelatic'
    ON CONFLICT (business_id) DO NOTHING;

    -- Kelatic Vitality House (spend-based earning, with category bonus)
    INSERT INTO loyalty_programs (
        business_id, program_group_id, name, currency_label, description,
        earn_rules, tier_config
    )
    SELECT
        b.id, kelatic_group, 'Vitality Stars', 'Stars',
        'Earn a Star for every dollar spent. Double Stars on sea moss + supplements.',
        '{"rules":[
            {"trigger":"order.paid","points":1,"per":"dollar"},
            {"trigger":"order.paid","category_slug":"sea-moss-drinks","multiplier":2},
            {"trigger":"client.created","points":25,"once":true}
          ]}'::jsonb,
        '{"tiers":[
            {"name":"Member","threshold":0,"perks":[]},
            {"name":"Regular","threshold":250,"perks":["Free drink on birthday"]},
            {"name":"Insider","threshold":1000,"perks":["10% off retail wellness","Early access to drops"]}
          ]}'::jsonb
    FROM businesses b WHERE b.slug = 'vitality'
    ON CONFLICT (business_id) DO NOTHING;
END $$;

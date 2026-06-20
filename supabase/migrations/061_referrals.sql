-- ============================================================
-- Migration 061: Referrals
-- Two-sided referral program built on the loyalty ledger:
--   * Referrer (existing customer) earns when their referee converts on
--     a real paid event -- not just on code application -- so fake codes
--     can't farm points.
--   * Referee (new customer) earns a signup bonus immediately on code
--     application so they have something to spend on day one.
--
-- Tables:
--   referral_codes  -- one code per (business, client)
--   referrals       -- the event itself; links to ledger rows on both sides
--
-- Program config additions on loyalty_programs:
--   referrer_bonus_points -- referrer's reward at conversion
--   referee_bonus_points  -- referee's signup bonus on code apply
--   referrals_enabled     -- master toggle (off by default)
--
-- Purely additive / idempotent.
-- ============================================================

-- ============================================
-- 1. PROGRAM CONFIG -- referral knobs
-- ============================================
ALTER TABLE loyalty_programs
    ADD COLUMN IF NOT EXISTS referrer_bonus_points INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS referee_bonus_points  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS referrals_enabled     BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 2. REFERRAL CODES -- shareable per-client
-- ============================================
CREATE TABLE IF NOT EXISTS referral_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    code        TEXT NOT NULL,        -- short, uppercase, shareable
    is_active   BOOLEAN NOT NULL DEFAULT true,

    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (business_id, code),
    UNIQUE (business_id, client_id)   -- one code per client per tenant
);

-- ============================================
-- 3. REFERRALS -- the event ledger
--    pending   -> code applied, referee bonus posted
--    converted -> referee paid for the first time; referrer bonus posted
--    expired   -> never converted within the window
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id          UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code_id              UUID REFERENCES referral_codes(id) ON DELETE SET NULL,

    referrer_client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    referee_client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','converted','expired')),

    -- Link both sides to the actual ledger rows so we can audit every
    -- payout end-to-end without joins through metadata.
    referee_bonus_tx_id  UUID REFERENCES loyalty_transactions(id) ON DELETE SET NULL,
    referrer_bonus_tx_id UUID REFERENCES loyalty_transactions(id) ON DELETE SET NULL,

    applied_at           TIMESTAMPTZ DEFAULT NOW(),
    converted_at         TIMESTAMPTZ,

    -- A given referee can only be referred once per business
    UNIQUE (business_id, referee_client_id),
    -- Can't refer yourself
    CHECK (referrer_client_id <> referee_client_id)
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_referral_codes_business ON referral_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active   ON referral_codes(business_id, code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_referrals_business   ON referrals(business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer   ON referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee    ON referrals(referee_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_pending    ON referrals(business_id, referee_client_id) WHERE status = 'pending';

-- ============================================
-- 5. ROW LEVEL SECURITY (mirrors 060 pattern)
-- ============================================
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals      ENABLE ROW LEVEL SECURITY;

-- Business staff can read referral codes + referrals for their tenant
CREATE POLICY "Business staff view referral codes" ON referral_codes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = referral_codes.business_id
                  AND m.user_id = auth.uid()));

CREATE POLICY "Business admins manage referral codes" ON referral_codes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = referral_codes.business_id
                  AND m.user_id = auth.uid()
                  AND m.role IN ('owner','admin')));

CREATE POLICY "Business staff view referrals" ON referrals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM business_members m
                WHERE m.business_id = referrals.business_id
                  AND m.user_id = auth.uid()));

-- Writes go through service-role API routes (apply, conversion hook).

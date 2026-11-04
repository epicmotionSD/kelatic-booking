-- ============================================================
-- 006 · LOTTO DUEL TENANT
-- Runs in the dedicated Lotto Duel Supabase project. Every object is
-- prefixed lotto_ so it never collides with the prototype tables
-- (users/pools/entries/draws) or anything salon-side.
--
-- Game: each player gets a "bingo card" of 5 white-ball numbers.
-- Every real draw for the pool's game marks hits on the card
-- (hits accumulate across draws). First card(s) to reach the
-- pool's win_condition win. Free to play — no money involved.
--
-- Writes happen only through SECURITY DEFINER RPCs (create/join)
-- and the draw trigger, so clients can't pick their own numbers.
-- ============================================================

CREATE TYPE lotto_game AS ENUM ('powerball', 'megamillions');
-- open = accepting players · live = first draw counted, joins locked · won = finished
CREATE TYPE lotto_pool_status AS ENUM ('open', 'live', 'won');
CREATE TYPE lotto_tier AS ENUM ('free', 'pro');

-- Player identity for this tenant (salon `profiles` requires first/last
-- name + role, so Lotto Duel keeps its own lightweight record).
CREATE TABLE lotto_players (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
    -- SMS (opt-in only; STOP replies mark sms_opted_out_at)
    phone_e164 TEXT CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
    sms_opt_in_at TIMESTAMPTZ,
    sms_opted_out_at TIMESTAMPTZ,
    -- Billing (Commissioner pays for tools; players always free)
    tier lotto_tier NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lotto_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commissioner_id UUID NOT NULL REFERENCES lotto_players(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    game lotto_game NOT NULL,
    win_condition SMALLINT NOT NULL CHECK (win_condition BETWEEN 1 AND 5),
    join_code TEXT NOT NULL UNIQUE,
    status lotto_pool_status NOT NULL DEFAULT 'open',
    player_limit INT NOT NULL DEFAULT 10 CHECK (player_limit BETWEEN 1 AND 1000),
    last_capacity_notice_at TIMESTAMPTZ,
    draws_counted INT NOT NULL DEFAULT 0,
    won_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lotto_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES lotto_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES lotto_players(id) ON DELETE CASCADE,
    assigned_numbers INT[] NOT NULL CHECK (cardinality(assigned_numbers) = 5),
    matched_numbers INT[] NOT NULL DEFAULT '{}',
    won_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pool_id, user_id)
);

CREATE TABLE lotto_draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game lotto_game NOT NULL,
    draw_date DATE NOT NULL,
    white_balls INT[] NOT NULL CHECK (cardinality(white_balls) = 5),
    special_ball INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (game, draw_date)
);

CREATE INDEX idx_lotto_pools_game_status ON lotto_pools (game, status);
CREATE INDEX idx_lotto_pools_commissioner ON lotto_pools (commissioner_id);
CREATE INDEX idx_lotto_entries_user ON lotto_entries (user_id);
CREATE INDEX idx_lotto_draws_game_date ON lotto_draws (game, draw_date DESC);

-- ============================================================
-- HELPERS
-- ============================================================

-- Highest white-ball number per game (Powerball 1–69, Mega Millions 1–70)
CREATE OR REPLACE FUNCTION lotto_max_white(p_game lotto_game)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE p_game WHEN 'powerball' THEN 69 WHEN 'megamillions' THEN 70 END;
$$;

-- 5 unique sorted numbers in 1..max
CREATE OR REPLACE FUNCTION lotto_pick_numbers(p_game lotto_game)
RETURNS INT[] LANGUAGE sql VOLATILE AS $$
    SELECT array_agg(n ORDER BY n)
    FROM (SELECT n FROM generate_series(1, lotto_max_white(p_game)) n ORDER BY random() LIMIT 5) s;
$$;

-- 6-char join code without look-alike characters (no 0/O, 1/I/L)
CREATE OR REPLACE FUNCTION lotto_gen_code()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE
    alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    code TEXT;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..6 LOOP
            code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::INT, 1);
        END LOOP;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM lotto_pools WHERE join_code = code);
    END LOOP;
    RETURN code;
END $$;

-- Official draw moment (~10:59pm ET) as a timestamp, so pools/cards
-- created after a draw happened never get credit for it.
CREATE OR REPLACE FUNCTION lotto_draw_ts(p_date DATE)
RETURNS TIMESTAMPTZ LANGUAGE sql STABLE AS $$
    SELECT (p_date + TIME '22:59') AT TIME ZONE 'America/New_York';
$$;

-- Create/refresh the caller's player row
CREATE OR REPLACE FUNCTION lotto_ensure_player(p_display_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    uid UUID := auth.uid();
    fallback TEXT;
    clean TEXT := left(nullif(trim(coalesce(p_display_name, '')), ''), 40);
BEGIN
    IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
    SELECT left(split_part(email, '@', 1), 40) INTO fallback FROM auth.users WHERE id = uid;
    INSERT INTO lotto_players (id, display_name)
    VALUES (uid, coalesce(clean, fallback, 'Player'))
    ON CONFLICT (id) DO UPDATE
        SET display_name = coalesce(clean, lotto_players.display_name);
END $$;

-- Membership check used by RLS (definer avoids recursive policy lookups)
CREATE OR REPLACE FUNCTION lotto_is_member(p_pool UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM lotto_entries WHERE pool_id = p_pool AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM lotto_pools WHERE id = p_pool AND commissioner_id = auth.uid());
$$;

-- ============================================================
-- NOTIFICATION OUTBOX
-- Triggers only INSERT rows here (fast, transactional). Delivery
-- happens out-of-band in the `lotto-alerts` Edge Function, woken
-- by one async pg_net call per statement — no HTTP inside the
-- matching transaction, so Twilio lag can never lock the DB.
-- ============================================================

CREATE TABLE lotto_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES lotto_players(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES lotto_pools(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('hit', 'win', 'capacity')),
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX idx_lotto_notifications_pending ON lotto_notifications (created_at) WHERE status = 'pending';

-- Wake the alerts function (async). No-ops if pg_net / Vault secrets
-- aren't configured yet, so local dev and fresh projects still work.
CREATE OR REPLACE FUNCTION lotto_wake_alerts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    fn_url TEXT;
    secret TEXT;
BEGIN
    IF to_regnamespace('net') IS NULL OR to_regnamespace('vault') IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT decrypted_secret INTO fn_url FROM vault.decrypted_secrets WHERE name = 'lotto_functions_url';
    SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'lotto_internal_secret';
    IF fn_url IS NULL OR secret IS NULL THEN RETURN NULL; END IF;

    PERFORM net.http_post(
        url := fn_url || '/lotto-alerts',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-lotto-secret', secret),
        body := '{}'::jsonb
    );
    RETURN NULL;
END $$;

CREATE TRIGGER trg_lotto_wake_alerts
AFTER INSERT ON lotto_notifications
FOR EACH STATEMENT EXECUTE FUNCTION lotto_wake_alerts();

-- ============================================================
-- RPCs (called from the app)
-- ============================================================

-- Commissioner creates a league; they also get a card.
-- Free: Powerball only, 10 players. Pro: Mega Millions too, 100 players.
CREATE OR REPLACE FUNCTION lotto_create_pool(
    p_name TEXT,
    p_game lotto_game,
    p_win_condition INT,
    p_display_name TEXT DEFAULT NULL
)
RETURNS lotto_pools LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    uid UUID := auth.uid();
    me lotto_players;
    result lotto_pools;
BEGIN
    IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
    PERFORM lotto_ensure_player(p_display_name);
    SELECT * INTO me FROM lotto_players WHERE id = uid;

    IF p_game <> 'powerball' AND me.tier <> 'pro' THEN
        RAISE EXCEPTION 'pro_required' USING HINT = 'Mega Millions leagues are a Pro feature';
    END IF;

    INSERT INTO lotto_pools (commissioner_id, name, game, win_condition, join_code, player_limit)
    VALUES (uid, trim(p_name), p_game, p_win_condition, lotto_gen_code(),
            CASE me.tier WHEN 'pro' THEN 100 ELSE 10 END)
    RETURNING * INTO result;

    INSERT INTO lotto_entries (pool_id, user_id, assigned_numbers)
    VALUES (result.id, uid, lotto_pick_numbers(p_game));

    RETURN result;
END $$;

-- Player joins by code. Returns JSON so a full league can still queue the
-- Commissioner's upgrade notice (a RAISE would roll that insert back).
--   { status: 'joined' | 'existing' | 'full' | 'closed' | 'not_found', entry?, pool_name? }
CREATE OR REPLACE FUNCTION lotto_join_pool(p_code TEXT, p_display_name TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    uid UUID := auth.uid();
    pool lotto_pools;
    entry lotto_entries;
    me_name TEXT;
    roster INT;
BEGIN
    IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

    -- Row lock serializes concurrent joins so the cap can't be overshot
    SELECT * INTO pool FROM lotto_pools WHERE join_code = upper(trim(p_code)) FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;

    SELECT * INTO entry FROM lotto_entries WHERE pool_id = pool.id AND user_id = uid;
    IF FOUND THEN
        RETURN jsonb_build_object('status', 'existing', 'pool_name', pool.name, 'entry', to_jsonb(entry));
    END IF;

    IF pool.status <> 'open' THEN
        RETURN jsonb_build_object('status', 'closed', 'pool_name', pool.name);
    END IF;

    PERFORM lotto_ensure_player(p_display_name);

    SELECT count(*) INTO roster FROM lotto_entries WHERE pool_id = pool.id;
    IF roster >= pool.player_limit THEN
        -- Tell the Commissioner (at most once an hour per league)
        IF pool.last_capacity_notice_at IS NULL OR pool.last_capacity_notice_at < NOW() - INTERVAL '1 hour' THEN
            SELECT display_name INTO me_name FROM lotto_players WHERE id = uid;
            INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
            VALUES (pool.commissioner_id, pool.id, 'capacity',
                    jsonb_build_object('player_name', me_name, 'pool_name', pool.name, 'limit', pool.player_limit));
            UPDATE lotto_pools SET last_capacity_notice_at = NOW() WHERE id = pool.id;
        END IF;
        RETURN jsonb_build_object('status', 'full', 'pool_name', pool.name, 'limit', pool.player_limit);
    END IF;

    INSERT INTO lotto_entries (pool_id, user_id, assigned_numbers)
    VALUES (pool.id, uid, lotto_pick_numbers(pool.game))
    RETURNING * INTO entry;

    RETURN jsonb_build_object('status', 'joined', 'pool_name', pool.name, 'entry', to_jsonb(entry));
END $$;

-- Save phone + explicit SMS consent (pass NULL phone to remove)
CREATE OR REPLACE FUNCTION lotto_set_phone(p_phone TEXT, p_sms_opt_in BOOLEAN)
RETURNS lotto_players LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    uid UUID := auth.uid();
    result lotto_players;
BEGIN
    IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
    PERFORM lotto_ensure_player(NULL);
    UPDATE lotto_players SET
        phone_e164 = nullif(trim(p_phone), ''),
        sms_opt_in_at = CASE WHEN p_sms_opt_in AND nullif(trim(p_phone), '') IS NOT NULL THEN NOW() END,
        sms_opted_out_at = CASE WHEN p_sms_opt_in THEN NULL ELSE NOW() END
    WHERE id = uid
    RETURNING * INTO result;
    RETURN result;
END $$;

-- Called by the Stripe webhook (service role only)
CREATE OR REPLACE FUNCTION lotto_set_tier(p_user UUID, p_tier lotto_tier, p_stripe_customer TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE lotto_players
    SET tier = p_tier, stripe_customer_id = coalesce(p_stripe_customer, stripe_customer_id)
    WHERE id = p_user;

    -- Upgrades lift every unfinished league to 100. Downgrades never shrink
    -- an existing roster; they only stop new leagues from getting Pro limits.
    IF p_tier = 'pro' THEN
        UPDATE lotto_pools SET player_limit = GREATEST(player_limit, 100)
        WHERE commissioner_id = p_user AND status <> 'won';
    END IF;
END $$;

-- ============================================================
-- ROSTER GATE — defense in depth behind the RPC check
-- ============================================================
CREATE OR REPLACE FUNCTION lotto_enforce_roster_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    lim INT;
    roster INT;
BEGIN
    SELECT player_limit INTO lim FROM lotto_pools WHERE id = NEW.pool_id FOR UPDATE;
    SELECT count(*) INTO roster FROM lotto_entries WHERE pool_id = NEW.pool_id;
    IF roster >= lim THEN
        RAISE EXCEPTION 'pool_full' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_lotto_roster_limit
BEFORE INSERT ON lotto_entries
FOR EACH ROW EXECUTE FUNCTION lotto_enforce_roster_limit();

-- ============================================================
-- DRAW TRIGGER — marks hits, locks joins, crowns winners,
-- and queues hit/win notifications (no HTTP here)
-- ============================================================

CREATE OR REPLACE FUNCTION lotto_apply_draw()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    draw_at TIMESTAMPTZ := lotto_draw_ts(NEW.draw_date);
BEGIN
    -- 1. Mark new hits on eligible cards; queue a 'hit' for cards that gained one
    WITH calc AS (
        SELECT e.id,
               ARRAY(
                   SELECT DISTINCT n
                   FROM unnest(e.matched_numbers || NEW.white_balls) AS n
                   WHERE n = ANY (e.assigned_numbers)
                   ORDER BY n
               ) AS new_matched
        FROM lotto_entries e
        JOIN lotto_pools p ON p.id = e.pool_id
        WHERE p.game = NEW.game
          AND p.status IN ('open', 'live')
          AND p.created_at < draw_at
          AND e.created_at < draw_at
          AND e.assigned_numbers && NEW.white_balls
    ), upd AS (
        UPDATE lotto_entries e
        SET matched_numbers = c.new_matched
        FROM calc c
        WHERE e.id = c.id
          AND cardinality(c.new_matched) > cardinality(e.matched_numbers)
        RETURNING e.id, e.user_id, e.pool_id, e.matched_numbers
    )
    INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
    SELECT u.user_id, u.pool_id, 'hit',
           jsonb_build_object('matches', cardinality(u.matched_numbers),
                              'needed', p.win_condition, 'pool_name', p.name,
                              'draw_date', NEW.draw_date)
    FROM upd u JOIN lotto_pools p ON p.id = u.pool_id;

    -- 2. Count the draw on every eligible pool; first draw locks joins
    UPDATE lotto_pools p
    SET draws_counted = draws_counted + 1,
        status = 'live'
    WHERE p.game = NEW.game
      AND p.status IN ('open', 'live')
      AND p.created_at < draw_at;

    -- 3. Crown any card that reached the win condition (ties all win)
    WITH winners AS (
        UPDATE lotto_entries e
        SET won_at = NOW()
        FROM lotto_pools p
        WHERE e.pool_id = p.id
          AND p.game = NEW.game
          AND p.status = 'live'
          AND e.won_at IS NULL
          AND cardinality(e.matched_numbers) >= p.win_condition
        RETURNING e.user_id, e.pool_id, p.name
    )
    INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
    SELECT user_id, pool_id, 'win', jsonb_build_object('pool_name', name) FROM winners;

    -- 4. Close pools that have a winner
    UPDATE lotto_pools p
    SET status = 'won', won_at = NOW()
    WHERE p.game = NEW.game
      AND p.status = 'live'
      AND EXISTS (SELECT 1 FROM lotto_entries e WHERE e.pool_id = p.id AND e.won_at IS NOT NULL);

    RETURN NEW;
END $$;

CREATE TRIGGER trg_lotto_apply_draw
AFTER INSERT ON lotto_draws
FOR EACH ROW EXECUTE FUNCTION lotto_apply_draw();

-- ============================================================
-- ROW LEVEL SECURITY — read-only from clients; writes via RPC
-- ============================================================

ALTER TABLE lotto_players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotto_pools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotto_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotto_draws         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotto_notifications ENABLE ROW LEVEL SECURITY;  -- no policies: service role only

CREATE POLICY lotto_pools_member_read ON lotto_pools
    FOR SELECT TO authenticated USING (lotto_is_member(id));

CREATE POLICY lotto_entries_member_read ON lotto_entries
    FOR SELECT TO authenticated USING (lotto_is_member(pool_id));

CREATE POLICY lotto_draws_public_read ON lotto_draws
    FOR SELECT TO anon, authenticated USING (true);

-- Players: you read your own full row; league-mates see display names only
-- (via the lotto_roster view below), so phone numbers never leak.
CREATE POLICY lotto_players_self_read ON lotto_players
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE OR REPLACE VIEW lotto_roster WITH (security_invoker = false) AS
    SELECT e.id AS entry_id, e.pool_id, e.user_id, p.display_name,
           e.assigned_numbers, e.matched_numbers, e.won_at, e.created_at
    FROM lotto_entries e
    JOIN lotto_players p ON p.id = e.user_id
    WHERE lotto_is_member(e.pool_id);

-- Lock down function execution
DO $$
DECLARE f TEXT;
BEGIN
    FOREACH f IN ARRAY ARRAY[
        'lotto_ensure_player(text)', 'lotto_gen_code()', 'lotto_pick_numbers(lotto_game)',
        'lotto_apply_draw()', 'lotto_wake_alerts()', 'lotto_enforce_roster_limit()',
        'lotto_set_tier(uuid, lotto_tier, text)',
        'lotto_create_pool(text, lotto_game, integer, text)', 'lotto_join_pool(text, text)',
        'lotto_set_phone(text, boolean)'
    ] LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f);
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', f);
        END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION lotto_create_pool(text, lotto_game, integer, text) TO authenticated;
        GRANT EXECUTE ON FUNCTION lotto_join_pool(text, text) TO authenticated;
        GRANT EXECUTE ON FUNCTION lotto_set_phone(text, boolean) TO authenticated;
        REVOKE ALL ON lotto_roster FROM anon;
        GRANT SELECT ON lotto_roster TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION lotto_set_tier(uuid, lotto_tier, text) TO service_role;
    END IF;
END $$;

-- ============================================================
-- REALTIME — live leaderboard updates
-- ============================================================
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE lotto_entries, lotto_pools;
    END IF;
END $$;

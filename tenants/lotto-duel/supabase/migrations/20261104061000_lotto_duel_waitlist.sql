-- ============================================================
-- LottoDuel · WAITLIST FOR THE NEXT SEASON
-- Anyone who arrives after a league has started (or is full) goes on
-- that league's waitlist. When the Commissioner runs it back, the
-- waitlist is invited alongside the old roster. If the next season
-- already exists, the join call hands back its code instead.
-- ============================================================

CREATE TABLE lotto_waitlist (
    pool_id UUID NOT NULL REFERENCES lotto_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES lotto_players(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('started', 'full')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_at TIMESTAMPTZ,
    PRIMARY KEY (pool_id, user_id)
);
CREATE INDEX idx_lotto_waitlist_user ON lotto_waitlist (user_id);

ALTER TABLE lotto_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY lotto_waitlist_self_read ON lotto_waitlist
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- "Leagues I'm waiting on" for the signed-in player (names only, no roster access)
CREATE OR REPLACE VIEW lotto_my_waitlist WITH (security_invoker = false) AS
    SELECT w.pool_id, p.name AS pool_name, p.season, p.status, p.next_pool_code, w.reason, w.created_at
    FROM lotto_waitlist w
    JOIN lotto_pools p ON p.id = w.pool_id
    WHERE w.user_id = auth.uid();
REVOKE ALL ON lotto_my_waitlist FROM anon;
GRANT SELECT ON lotto_my_waitlist TO authenticated;
COMMENT ON VIEW lotto_my_waitlist IS 'Intentionally security definer: caller''s own waitlist rows with pool name only.';

-- Waitlist size for league members (Commissioner sees it as a reason to run it back)
CREATE OR REPLACE FUNCTION lotto_waitlist_count(p_pool UUID)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT CASE WHEN lotto_is_member(p_pool)
        THEN (SELECT count(*)::INT FROM lotto_waitlist WHERE pool_id = p_pool AND invited_at IS NULL)
        ELSE 0 END;
$$;
REVOKE EXECUTE ON FUNCTION lotto_waitlist_count(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION lotto_waitlist_count(UUID) TO authenticated;

-- Join: open → card · started/finished → waitlist (or straight to the next season) · full → waitlist + upgrade nudge
--   { status: 'joined' | 'existing' | 'waitlisted' | 'next_season' | 'full' | 'not_found', ... }
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
        RETURN jsonb_build_object('status', 'existing', 'pool_name', pool.name, 'season', pool.season, 'entry', to_jsonb(entry));
    END IF;

    PERFORM lotto_ensure_player(p_display_name);

    IF pool.status <> 'open' THEN
        -- Next season already open? Send them there.
        IF pool.next_pool_code IS NOT NULL THEN
            RETURN jsonb_build_object('status', 'next_season', 'pool_name', pool.name,
                                      'season', pool.season + 1, 'join_code', pool.next_pool_code);
        END IF;
        INSERT INTO lotto_waitlist (pool_id, user_id, reason) VALUES (pool.id, uid, 'started')
        ON CONFLICT (pool_id, user_id) DO NOTHING;
        RETURN jsonb_build_object('status', 'waitlisted', 'pool_name', pool.name,
                                  'season', pool.season + 1, 'reason', 'started');
    END IF;

    SELECT count(*) INTO roster FROM lotto_entries WHERE pool_id = pool.id;
    IF roster >= pool.player_limit THEN
        INSERT INTO lotto_waitlist (pool_id, user_id, reason) VALUES (pool.id, uid, 'full')
        ON CONFLICT (pool_id, user_id) DO NOTHING;
        -- Tell the Commissioner (at most once an hour per league)
        IF pool.last_capacity_notice_at IS NULL OR pool.last_capacity_notice_at < NOW() - INTERVAL '1 hour' THEN
            SELECT display_name INTO me_name FROM lotto_players WHERE id = uid;
            INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
            VALUES (pool.commissioner_id, pool.id, 'capacity',
                    jsonb_build_object('player_name', me_name, 'pool_name', pool.name, 'limit', pool.player_limit));
            UPDATE lotto_pools SET last_capacity_notice_at = NOW() WHERE id = pool.id;
        END IF;
        RETURN jsonb_build_object('status', 'full', 'pool_name', pool.name, 'limit', pool.player_limit,
                                  'season', pool.season + 1);
    END IF;

    INSERT INTO lotto_entries (pool_id, user_id, assigned_numbers)
    VALUES (pool.id, uid, lotto_pick_numbers(pool.game))
    RETURNING * INTO entry;

    RETURN jsonb_build_object('status', 'joined', 'pool_name', pool.name, 'season', pool.season, 'entry', to_jsonb(entry));
END $$;

-- Run it back now also invites the waitlist
CREATE OR REPLACE FUNCTION lotto_rematch(p_pool UUID)
RETURNS lotto_pools LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    uid UUID := auth.uid();
    old lotto_pools;
    me lotto_players;
    result lotto_pools;
BEGIN
    IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
    SELECT * INTO old FROM lotto_pools WHERE id = p_pool FOR UPDATE;
    IF NOT FOUND OR old.commissioner_id <> uid THEN RAISE EXCEPTION 'not_commissioner'; END IF;
    IF old.status <> 'won' THEN RAISE EXCEPTION 'not_finished'; END IF;

    SELECT * INTO result FROM lotto_pools WHERE rematch_of = old.id;
    IF FOUND THEN RETURN result; END IF;

    SELECT * INTO me FROM lotto_players WHERE id = uid;

    INSERT INTO lotto_pools (commissioner_id, name, game, win_condition, join_code, player_limit, season, rematch_of)
    VALUES (uid, old.name, old.game, 6, lotto_gen_code(),
            CASE me.tier WHEN 'pro' THEN 100 ELSE 10 END, old.season + 1, old.id)
    RETURNING * INTO result;

    INSERT INTO lotto_entries (pool_id, user_id, assigned_numbers)
    VALUES (result.id, uid, lotto_pick_numbers(old.game));

    UPDATE lotto_pools SET next_pool_code = result.join_code WHERE id = old.id;

    -- Invite last season's roster + everyone on the waitlist
    INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
    SELECT invitee, result.id, 'rematch',
           jsonb_build_object('pool_name', result.name, 'season', result.season, 'join_code', result.join_code)
    FROM (
        SELECT e.user_id AS invitee FROM lotto_entries e WHERE e.pool_id = old.id
        UNION
        SELECT w.user_id FROM lotto_waitlist w WHERE w.pool_id = old.id
    ) people
    WHERE invitee <> uid;

    UPDATE lotto_waitlist SET invited_at = NOW() WHERE pool_id = old.id AND invited_at IS NULL;

    RETURN result;
END $$;

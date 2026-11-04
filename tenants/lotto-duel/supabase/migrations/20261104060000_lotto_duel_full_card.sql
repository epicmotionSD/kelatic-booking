-- ============================================================
-- LottoDuel · FULL CARD + NETWORK EFFECTS
-- BINGO = all 5 white numbers AND the special ball (Powerball /
-- Mega Ball), accumulated across official draws. A league can run
-- for months. When someone hits BINGO, every member is told, and
-- the Commissioner can "run it back" into Season 2 with one tap,
-- which invites the whole old roster.
-- ============================================================

-- Cards now carry a special ball
ALTER TABLE lotto_entries
    ADD COLUMN assigned_special INT,
    ADD COLUMN special_matched BOOLEAN NOT NULL DEFAULT false;

-- Full card is the only win rule: 5 whites + special = 6
ALTER TABLE lotto_pools DROP CONSTRAINT IF EXISTS lotto_pools_win_condition_check;
ALTER TABLE lotto_pools ALTER COLUMN win_condition SET DEFAULT 6;
ALTER TABLE lotto_pools ADD CONSTRAINT lotto_pools_win_condition_check CHECK (win_condition = 6);

-- Seasons / rematch chain
ALTER TABLE lotto_pools
    ADD COLUMN season INT NOT NULL DEFAULT 1,
    ADD COLUMN rematch_of UUID UNIQUE REFERENCES lotto_pools(id) ON DELETE SET NULL,
    ADD COLUMN next_pool_code TEXT;   -- visible to old members so they can hop into the next season

-- New notification kinds
ALTER TABLE lotto_notifications DROP CONSTRAINT IF EXISTS lotto_notifications_kind_check;
ALTER TABLE lotto_notifications ADD CONSTRAINT lotto_notifications_kind_check
    CHECK (kind IN ('hit', 'win', 'bingo', 'rematch', 'capacity'));

-- Special-ball range per game (Powerball 1–26, Mega Ball 1–24)
CREATE OR REPLACE FUNCTION lotto_max_special(p_game lotto_game)
RETURNS INT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
    SELECT CASE p_game WHEN 'powerball' THEN 26 WHEN 'megamillions' THEN 24 END;
$$;

CREATE OR REPLACE FUNCTION lotto_pick_special(p_game lotto_game)
RETURNS INT LANGUAGE sql VOLATILE SET search_path = public AS $$
    SELECT 1 + floor(random() * lotto_max_special(p_game))::INT;
$$;
REVOKE EXECUTE ON FUNCTION lotto_pick_special(lotto_game) FROM PUBLIC, anon, authenticated;

-- Every new card gets its special ball automatically (covers create, join and rematch)
CREATE OR REPLACE FUNCTION lotto_fill_special()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.assigned_special IS NULL THEN
        NEW.assigned_special := lotto_pick_special((SELECT game FROM lotto_pools WHERE id = NEW.pool_id));
    END IF;
    RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION lotto_fill_special() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_lotto_fill_special
BEFORE INSERT ON lotto_entries
FOR EACH ROW EXECUTE FUNCTION lotto_fill_special();

ALTER TABLE lotto_entries ADD CONSTRAINT lotto_entries_special_set CHECK (assigned_special IS NOT NULL);

-- Create: win rule is always full card (p_win_condition kept for API compatibility, ignored)
CREATE OR REPLACE FUNCTION lotto_create_pool(
    p_name TEXT,
    p_game lotto_game,
    p_win_condition INT DEFAULT 6,
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
    VALUES (uid, trim(p_name), p_game, 6, lotto_gen_code(),
            CASE me.tier WHEN 'pro' THEN 100 ELSE 10 END)
    RETURNING * INTO result;

    INSERT INTO lotto_entries (pool_id, user_id, assigned_numbers)
    VALUES (result.id, uid, lotto_pick_numbers(p_game));

    RETURN result;
END $$;

-- Run it back: Commissioner of a finished league opens the next season and
-- every old member gets an invite with the new code. One rematch per league.
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

    -- Idempotent: a second tap returns the season already created
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

    INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
    SELECT e.user_id, result.id, 'rematch',
           jsonb_build_object('pool_name', result.name, 'season', result.season, 'join_code', result.join_code)
    FROM lotto_entries e
    WHERE e.pool_id = old.id AND e.user_id <> uid;

    RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION lotto_rematch(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION lotto_rematch(UUID) TO authenticated;

-- Draw trigger: whites + special ball, full card wins, everyone hears about it
CREATE OR REPLACE FUNCTION lotto_apply_draw()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    draw_at TIMESTAMPTZ := lotto_draw_ts(NEW.draw_date);
BEGIN
    -- 1. Mark new hits (white numbers and/or special ball); queue a 'hit' per card that gained one
    WITH calc AS (
        SELECT e.id,
               ARRAY(
                   SELECT DISTINCT n
                   FROM unnest(e.matched_numbers || NEW.white_balls) AS n
                   WHERE n = ANY (e.assigned_numbers)
                   ORDER BY n
               ) AS new_matched,
               e.special_matched OR (NEW.special_ball IS NOT NULL AND e.assigned_special = NEW.special_ball) AS new_special
        FROM lotto_entries e
        JOIN lotto_pools p ON p.id = e.pool_id
        WHERE p.game = NEW.game
          AND p.status IN ('open', 'live')
          AND p.created_at < draw_at
          AND e.created_at < draw_at
          AND (e.assigned_numbers && NEW.white_balls OR e.assigned_special = NEW.special_ball)
    ), upd AS (
        UPDATE lotto_entries e
        SET matched_numbers = c.new_matched,
            special_matched = c.new_special
        FROM calc c
        WHERE e.id = c.id
          AND (cardinality(c.new_matched) > cardinality(e.matched_numbers) OR (c.new_special AND NOT e.special_matched))
        RETURNING e.id, e.user_id, e.pool_id, e.matched_numbers, e.special_matched
    )
    INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
    SELECT u.user_id, u.pool_id, 'hit',
           jsonb_build_object('matches', cardinality(u.matched_numbers) + (u.special_matched)::INT,
                              'needed', 6, 'pool_name', p.name, 'draw_date', NEW.draw_date)
    FROM upd u JOIN lotto_pools p ON p.id = u.pool_id;

    -- 2. Count the draw on every eligible pool; first draw locks joins
    UPDATE lotto_pools p
    SET draws_counted = draws_counted + 1,
        status = 'live'
    WHERE p.game = NEW.game
      AND p.status IN ('open', 'live')
      AND p.created_at < draw_at;

    -- 3. BINGO: full card (all 5 + special). Ties all win.
    WITH winners AS (
        UPDATE lotto_entries e
        SET won_at = NOW()
        FROM lotto_pools p
        WHERE e.pool_id = p.id
          AND p.game = NEW.game
          AND p.status = 'live'
          AND e.won_at IS NULL
          AND cardinality(e.matched_numbers) = 5
          AND e.special_matched
        RETURNING e.user_id, e.pool_id, p.name
    ), winner_notes AS (
        INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
        SELECT user_id, pool_id, 'win', jsonb_build_object('pool_name', name) FROM winners
        RETURNING pool_id
    )
    -- 4. Everyone else in the league hears who hit BINGO
    INSERT INTO lotto_notifications (user_id, pool_id, kind, payload)
    SELECT e.user_id, e.pool_id, 'bingo',
           jsonb_build_object('pool_name', w.name,
                              'winner_names', (SELECT string_agg(pl.display_name, ' & ')
                                               FROM winners w2 JOIN lotto_players pl ON pl.id = w2.user_id
                                               WHERE w2.pool_id = w.pool_id))
    FROM (SELECT DISTINCT pool_id, name FROM winners) w
    JOIN lotto_entries e ON e.pool_id = w.pool_id
    WHERE e.user_id NOT IN (SELECT user_id FROM winners w3 WHERE w3.pool_id = w.pool_id);

    -- 5. Close pools that have a winner
    UPDATE lotto_pools p
    SET status = 'won', won_at = NOW()
    WHERE p.game = NEW.game
      AND p.status = 'live'
      AND EXISTS (SELECT 1 FROM lotto_entries e WHERE e.pool_id = p.id AND e.won_at IS NOT NULL);

    RETURN NEW;
END $$;

-- Roster view gains the special ball (new columns appended at the end)
CREATE OR REPLACE VIEW lotto_roster WITH (security_invoker = false) AS
    SELECT e.id AS entry_id, e.pool_id, e.user_id, p.display_name,
           e.assigned_numbers, e.matched_numbers, e.won_at, e.created_at,
           e.assigned_special, e.special_matched
    FROM lotto_entries e
    JOIN lotto_players p ON p.id = e.user_id
    WHERE lotto_is_member(e.pool_id);
COMMENT ON VIEW lotto_roster IS 'Intentionally security definer: names-only roster, filtered by caller membership.';

-- Lease up to p_limit pending notifications (SKIP LOCKED = safe under concurrent runs)
CREATE OR REPLACE FUNCTION lotto_claim_notifications(p_limit INT DEFAULT 50)
RETURNS SETOF lotto_notifications LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    UPDATE lotto_notifications n
    SET processed_at = NOW(), attempts = n.attempts + 1
    WHERE n.id IN (
        SELECT id FROM lotto_notifications
        WHERE status = 'pending'
          AND (processed_at IS NULL OR processed_at < NOW() - INTERVAL '5 minutes')
        ORDER BY created_at
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    RETURNING n.*;
$$;
REVOKE EXECUTE ON FUNCTION lotto_claim_notifications(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION lotto_claim_notifications(INT) TO service_role;

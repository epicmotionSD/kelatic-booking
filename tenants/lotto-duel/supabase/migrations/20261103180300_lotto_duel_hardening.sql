-- Advisor fixes
REVOKE EXECUTE ON FUNCTION lotto_is_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION lotto_is_member(UUID) TO authenticated;  -- needed by RLS policies
ALTER FUNCTION lotto_pick_numbers(lotto_game) SET search_path = public;
ALTER FUNCTION lotto_max_white(lotto_game) SET search_path = public;
ALTER FUNCTION lotto_draw_ts(DATE) SET search_path = public;
-- lotto_roster stays SECURITY DEFINER on purpose: it exposes only display names
-- of league-mates (never phone/billing) and filters rows by lotto_is_member(auth.uid()).
COMMENT ON VIEW lotto_roster IS 'Intentionally security definer: names-only roster, filtered by caller membership.';

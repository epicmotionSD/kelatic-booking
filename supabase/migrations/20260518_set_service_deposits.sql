-- Set deposit policy across all active services.
-- Inverse of 20260417_remove_all_deposits.sql, which zeroed everything out
-- while the Stripe account was on hold. Stripe is now active again.
--
-- Policy:
--   Barber category   →  flat $10 deposit (matches the prior implicit rule
--                        that lived in app/api/bookings/route.ts before
--                        commit a69480d).
--   Everything else   →  tiered by base_price:
--                          < $50   → $10
--                          $50–99  → $20
--                          $100–199→ $35
--                          $200–299→ $60
--                          $300+   → $100
--
-- The booking route honors these flags at request time, so deposits go live
-- on the next booking after this migration is applied — no deploy needed.

UPDATE services
SET
  deposit_required = true,
  deposit_amount = CASE
    WHEN base_price <  50 THEN 10
    WHEN base_price < 100 THEN 20
    WHEN base_price < 200 THEN 35
    WHEN base_price < 300 THEN 60
    ELSE 100
  END
WHERE is_active = true
  AND category <> 'barber';

UPDATE services
SET
  deposit_required = true,
  deposit_amount = 10
WHERE is_active = true
  AND category = 'barber';

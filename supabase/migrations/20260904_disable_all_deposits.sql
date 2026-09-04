-- Disable deposits across all services.
-- Mirror of 20260417_remove_all_deposits.sql. Later reversed by
-- 20260518_set_service_deposits.sql when Stripe was reactivated;
-- reverting again now.
--
-- The booking route in app/api/bookings/route.ts gates on
-- deposit_required AND deposit_amount > 0, so once this migration runs
-- no new booking will trigger a payment intent -- no deploy needed.

UPDATE services
SET
  deposit_required = false,
  deposit_amount = null;

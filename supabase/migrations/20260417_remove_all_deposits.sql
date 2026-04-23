-- Remove all deposit requirements from services
-- Deposits are set to $0 (no deposit required) for all bookings

UPDATE services
SET
  deposit_required = false,
  deposit_amount = null;

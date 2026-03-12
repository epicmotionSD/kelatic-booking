DO $$
DECLARE
  destiny_id UUID;
  justice_id UUID;
  target_business_id UUID;
BEGIN
  SELECT id, business_id
  INTO destiny_id, target_business_id
  FROM profiles
  WHERE role = 'stylist'
    AND lower(first_name) = 'destiny'
  ORDER BY created_at DESC
  LIMIT 1;

  IF destiny_id IS NULL THEN
    RAISE NOTICE 'Destiny stylist not found, skipping sync';
    RETURN;
  END IF;

  SELECT id
  INTO justice_id
  FROM profiles
  WHERE role = 'stylist'
    AND lower(first_name) = 'justice'
    AND business_id = target_business_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF justice_id IS NULL THEN
    RAISE NOTICE 'Justice stylist not found in same business, skipping sync';
    RETURN;
  END IF;

  INSERT INTO stylist_services (
    stylist_id,
    service_id,
    custom_price,
    custom_duration,
    is_active
  )
  SELECT
    justice_id,
    ss.service_id,
    ss.custom_price,
    ss.custom_duration,
    ss.is_active
  FROM stylist_services ss
  JOIN services svc ON svc.id = ss.service_id
  WHERE ss.stylist_id = destiny_id
    AND svc.business_id = target_business_id
  ON CONFLICT (stylist_id, service_id)
  DO UPDATE SET
    custom_price = EXCLUDED.custom_price,
    custom_duration = EXCLUDED.custom_duration,
    is_active = EXCLUDED.is_active;
END $$;
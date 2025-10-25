-- Add coordinates for all existing properties
-- This ensures all properties have valid latitude/longitude for map display

DO $$
DECLARE
  prop RECORD;
BEGIN
  -- Add coordinates for existing properties
  FOR prop IN
    SELECT id, neighborhood
    FROM public.properties
    WHERE latitude IS NULL OR longitude IS NULL
  LOOP
    -- Assign coordinates based on neighborhood
    UPDATE public.properties SET
      latitude = CASE
        WHEN prop.neighborhood = 'Cocody' THEN 5.35995 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Plateau' THEN 5.32745 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Marcory' THEN 5.30000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Treichville' THEN 5.28000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Yopougon' THEN 5.35000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Abobo' THEN 5.40000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Adjamé' THEN 5.36000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Koumassi' THEN 5.23000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Attécoubé' THEN 5.32000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Riviera' THEN 5.36900 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Port-Bouët' THEN 5.25000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Bassam' THEN 5.21000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Grand-Bassam' THEN 5.20000 + (random() * 0.02 - 0.01)
        ELSE 5.35000 + (random() * 0.02 - 0.01)
      END,
      longitude = CASE
        WHEN prop.neighborhood = 'Cocody' THEN -4.00830 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Plateau' THEN -4.01300 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Marcory' THEN -3.99000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Treichville' THEN -3.98000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Yopougon' THEN -4.05000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Abobo' THEN -4.07000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Adjamé' THEN -4.02000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Koumassi' THEN -3.93000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Attécoubé' THEN -4.01500 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Riviera' THEN -4.00700 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Port-Bouët' THEN -3.99000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Bassam' THEN -3.77000 + (random() * 0.02 - 0.01)
        WHEN prop.neighborhood = 'Grand-Bassam' THEN -3.75000 + (random() * 0.02 - 0.01)
        ELSE -4.03000 + (random() * 0.02 - 0.01)
      END,
      updated_at = NOW()
    WHERE id = prop.id;
  END LOOP;

  RAISE NOTICE '✅ Coordinates added to all properties';
END $$;

-- Verify the update
DO $$
DECLARE
  total_properties INTEGER;
  properties_with_coords INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_properties FROM public.properties;
  SELECT COUNT(*) INTO properties_with_coords FROM public.properties WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

  RAISE NOTICE '📊 Properties summary:';
  RAISE NOTICE '   Total properties: %', total_properties;
  RAISE NOTICE '   Properties with coordinates: %', properties_with_coords;

  IF total_properties > 0 THEN
    RAISE NOTICE '   Coverage: %', ROUND((properties_with_coords::decimal / total_properties::decimal) * 100, 1) || '%';
  ELSE
    RAISE NOTICE '   Coverage: No properties found';
  END IF;
END $$;
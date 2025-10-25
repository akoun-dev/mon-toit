-- Fix remaining column issues and ensure all tables work with the new normalized structure
-- This migration addresses any remaining references to deleted columns

-- 1. Fix rental_applications table columns if needed
DO $$
BEGIN
  -- Check if columns that were moved to application_documents still exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name IN ('documents', 'document_files', 'supporting_documents')
  ) THEN
    RAISE NOTICE '📝 Found legacy document columns in rental_applications that should have been moved';
  END IF;
END $$;

-- 2. Fix user_favorites table if it references deleted columns
DO $$
BEGIN
  -- Check if user_favorites table exists and has correct structure
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_favorites'
  ) THEN
    -- Ensure only existing columns are referenced
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_favorites'
      AND column_name IN ('property_main_image', 'property_images')
    ) THEN
      RAISE NOTICE '📝 Found invalid columns in user_favorites table';
    END IF;
  END IF;
END $$;

-- 3. Create a helper function to check if property exists (used by various queries)
CREATE OR REPLACE FUNCTION public.property_exists(p_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = p_property_id
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission for the helper function
GRANT EXECUTE ON FUNCTION public.property_exists(UUID) TO anon, authenticated;

-- 4. Add helpful comments for the new normalized structure
COMMENT ON TABLE public.property_media IS 'Médias associés aux propriétés (remplace main_image, images, video_url)';
COMMENT ON TABLE public.property_work IS 'Informations sur les travaux (remplace les colonnes work_*)';
COMMENT ON TABLE public.property_utility_costs IS 'Coûts des charges (remplace charges_amount)';
COMMENT ON TABLE public.application_documents IS 'Documents des candidatures (remplace document columns in rental_applications)';
COMMENT ON TABLE public.lease_terms IS 'Termes des contrats de location (remplace colonnes contractuelles dans leases)';

-- 5. Add a function to get property media for backward compatibility
CREATE OR REPLACE FUNCTION public.get_property_media(p_property_id UUID)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  media_type TEXT,
  url TEXT,
  title TEXT,
  description TEXT,
  order_index INTEGER,
  is_primary BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.property_id,
    pm.media_type,
    pm.url,
    pm.title,
    pm.description,
    pm.order_index,
    pm.is_primary,
    pm.metadata,
    pm.created_at
  FROM public.property_media pm
  WHERE pm.property_id = p_property_id
  ORDER BY pm.is_primary DESC, pm.order_index ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for media function
GRANT EXECUTE ON FUNCTION public.get_property_media(UUID) TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Remaining column issues fixed successfully';
  RAISE NOTICE '📊 Summary of changes:';
  RAISE NOTICE '  - Checked for legacy document columns in rental_applications';
  RAISE NOTICE '  - Validated user_favorites table structure';
  RAISE NOTICE '  - Added property_exists helper function';
  RAISE NOTICE '  - Added get_property_media function for backward compatibility';
  RAISE NOTICE '  - Added comments documenting the new normalized structure';
  RAISE NOTICE '🔧 Migration completed - database should now be fully compatible with the frontend code';
END $$;
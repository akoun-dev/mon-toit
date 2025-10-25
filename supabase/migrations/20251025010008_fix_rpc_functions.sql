-- Fix RPC functions to remove references to deleted columns
-- This migration updates the RPC functions to work with the normalized table structure

-- 1. Fix get_public_properties function
DROP FUNCTION IF EXISTS public.get_public_properties(p_limit INTEGER, p_offset INTEGER, p_city TEXT, p_min_price INTEGER, p_max_price INTEGER, p_property_type TEXT, p_bedrooms INTEGER, p_search TEXT);

CREATE OR REPLACE FUNCTION public.get_public_properties(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_city TEXT DEFAULT NULL,
  p_min_price INTEGER DEFAULT NULL,
  p_max_price INTEGER DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_bedrooms INTEGER DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  property_type TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  monthly_rent INTEGER,
  deposit_amount INTEGER,
  surface_area INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  owner_id UUID,
  status TEXT,
  is_furnished BOOLEAN,
  has_ac BOOLEAN,
  has_parking BOOLEAN,
  has_garden BOOLEAN,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.property_type,
    p.city,
    p.neighborhood,
    p.address,
    p.monthly_rent,
    p.deposit_amount,
    p.surface_area,
    p.bedrooms,
    p.bathrooms,
    p.owner_id,
    p.status,
    p.is_furnished,
    p.has_ac,
    p.has_parking,
    p.has_garden,
    p.latitude,
    p.longitude,
    p.created_at,
    p.updated_at
  FROM public.properties p
  WHERE
    p.status = 'disponible'
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_min_price IS NULL OR p.monthly_rent >= p_min_price)
    AND (p_max_price IS NULL OR p.monthly_rent <= p_max_price)
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_bedrooms IS NULL OR p.bedrooms = p_bedrooms)
    AND (p_search IS NULL OR
      LOWER(p.title) LIKE LOWER('%' || p_search || '%') OR
      LOWER(p.description) LIKE LOWER('%' || p_search || '%') OR
      LOWER(p.neighborhood) LIKE LOWER('%' || p_search || '%') OR
      LOWER(p.city) LIKE LOWER('%' || p_search || '%')
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_properties_with_owner function
DROP FUNCTION IF EXISTS public.get_properties_with_owner();

CREATE OR REPLACE FUNCTION public.get_properties_with_owner()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  property_type TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  monthly_rent INTEGER,
  deposit_amount INTEGER,
  surface_area INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  owner_id UUID,
  owner_name TEXT,
  owner_avatar_url TEXT,
  owner_phone TEXT,
  status TEXT,
  is_furnished BOOLEAN,
  has_ac BOOLEAN,
  has_parking BOOLEAN,
  has_garden BOOLEAN,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.property_type,
    p.city,
    p.neighborhood,
    p.address,
    p.monthly_rent,
    p.deposit_amount,
    p.surface_area,
    p.bedrooms,
    p.bathrooms,
    p.owner_id,
    pr.full_name as owner_name,
    pr.avatar_url as owner_avatar_url,
    pr.phone as owner_phone,
    p.status,
    p.is_furnished,
    p.has_ac,
    p.has_parking,
    p.has_garden,
    p.latitude,
    p.longitude,
    p.created_at,
    p.updated_at
  FROM public.properties p
  LEFT JOIN public.profiles pr ON p.owner_id = pr.id
  WHERE p.status = 'disponible'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix get_property_details function
DROP FUNCTION IF EXISTS public.get_property_details(p_property_id UUID);

CREATE OR REPLACE FUNCTION public.get_property_details(p_property_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  property_type TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  monthly_rent INTEGER,
  deposit_amount INTEGER,
  surface_area INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  owner_id UUID,
  owner_name TEXT,
  owner_avatar_url TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  status TEXT,
  is_furnished BOOLEAN,
  has_ac BOOLEAN,
  has_parking BOOLEAN,
  has_garden BOOLEAN,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.property_type,
    p.city,
    p.neighborhood,
    p.address,
    p.monthly_rent,
    p.deposit_amount,
    p.surface_area,
    p.bedrooms,
    p.bathrooms,
    p.owner_id,
    pr.full_name as owner_name,
    pr.avatar_url as owner_avatar_url,
    pr.phone as owner_phone,
    au.email as owner_email,
    p.status,
    p.is_furnished,
    p.has_ac,
    p.has_parking,
    p.has_garden,
    p.latitude,
    p.longitude,
    p.created_at,
    p.updated_at,
    p.view_count
  FROM public.properties p
  LEFT JOIN public.profiles pr ON p.owner_id = pr.id
  LEFT JOIN auth.users au ON pr.id = au.id
  WHERE p.id = p_property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for updated RPC functions
GRANT EXECUTE ON FUNCTION public.get_public_properties(p_limit INTEGER, p_offset INTEGER, p_city TEXT, p_min_price INTEGER, p_max_price INTEGER, p_property_type TEXT, p_bedrooms INTEGER, p_search TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_properties_with_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_details(p_property_id UUID) TO authenticated;

-- Add comments for updated functions
COMMENT ON FUNCTION public.get_public_properties IS 'Récupérer les biens publics avec filtres (version normalisée)';
COMMENT ON FUNCTION public.get_properties_with_owner IS 'Récupérer les biens avec infos propriétaire (version normalisée)';
COMMENT ON FUNCTION public.get_property_details IS 'Récupérer les détails d''un bien (version normalisée)';

DO $$
BEGIN
  RAISE NOTICE '✅ RPC functions updated to work with normalized table structure';
  RAISE NOTICE '📊 Summary of changes:';
  RAISE NOTICE '  - Removed main_image, images, video_url, virtual_tour_url references';
  RAISE NOTICE '  - Media files are now accessed via property_media table';
  RAISE NOTICE '  - Functions updated to use only existing columns';
END $$;
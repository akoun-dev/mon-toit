-- Migration: Fix properties table and add missing RPC functions
-- Description: Fix UUID syntax errors and create missing RPC functions

-- Drop and recreate properties table with correct UUID handling
DROP TABLE IF EXISTS public.properties CASCADE;

CREATE TABLE public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT NOT NULL,
  monthly_rent INTEGER NOT NULL,
  deposit_amount INTEGER,
  surface_area INTEGER,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  owner_id UUID NOT NULL,
  status TEXT DEFAULT 'disponible',
  main_image TEXT,
  images TEXT[],
  is_furnished BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  floor_number INTEGER,
  floor_plans JSONB,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID,
  moderation_notes TEXT,
  moderation_status TEXT DEFAULT 'pending',
  view_count INTEGER DEFAULT 0,
  panoramic_images JSONB,
  media_metadata JSONB,
  video_url TEXT,
  virtual_tour_url TEXT,
  title_deed_url TEXT,
  work_status TEXT,
  work_description TEXT,
  work_images JSONB,
  work_estimated_cost INTEGER,
  work_estimated_duration TEXT,
  work_start_date DATE,
  charges_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Foreign key constraint will be added after profiles table is ready
  CONSTRAINT properties_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create indexes for properties
CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_monthly_rent_idx ON public.properties(monthly_rent);
CREATE INDEX IF NOT EXISTS properties_bedrooms_idx ON public.properties(bedrooms);
CREATE INDEX IF NOT EXISTS properties_property_type_idx ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS properties_neighborhood_idx ON public.properties(neighborhood);

-- Trigger for updated_at
CREATE TRIGGER handle_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for properties
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT USING (status = 'disponible');

CREATE POLICY "Owners can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- RPC Functions
-- Function to get public properties
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
  main_image TEXT,
  images TEXT[],
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
    p.main_image,
    p.images,
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

-- Function to get properties with owner info
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
  main_image TEXT,
  images TEXT[],
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
    p.main_image,
    p.images,
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

-- Function to get property details
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
  main_image TEXT,
  images TEXT[],
  is_furnished BOOLEAN,
  has_ac BOOLEAN,
  has_parking BOOLEAN,
  has_garden BOOLEAN,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  floor_number INTEGER,
  floor_plans JSONB,
  video_url TEXT,
  virtual_tour_url TEXT,
  title_deed_url TEXT,
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
    p.main_image,
    p.images,
    p.is_furnished,
    p.has_ac,
    p.has_parking,
    p.has_garden,
    p.latitude,
    p.longitude,
    p.floor_number,
    p.floor_plans,
    p.video_url,
    p.virtual_tour_url,
    p.title_deed_url,
    p.created_at,
    p.updated_at,
    p.view_count
  FROM public.properties p
  LEFT JOIN public.profiles pr ON p.owner_id = pr.id
  LEFT JOIN auth.users au ON pr.id = au.id
  WHERE p.id = p_property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_property_view_count(p_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.properties
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = p_property_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.properties IS 'Biens immobiliers disponibles sur la plateforme Mon Toit';
COMMENT ON COLUMN public.properties.monthly_rent IS 'Loyer mensuel en FCFA';
COMMENT ON COLUMN public.properties.deposit_amount IS 'Montant de la caution en FCFA';
COMMENT ON FUNCTION public.get_public_properties IS 'Récupérer les biens publics avec filtres';
COMMENT ON FUNCTION public.get_properties_with_owner IS 'Récupérer les biens avec infos propriétaire';
COMMENT ON FUNCTION public.get_property_details IS 'Récupérer les détails d''un bien';
COMMENT ON FUNCTION public.increment_property_view_count IS 'Incrémenter le compteur de vues d''un bien';

-- Grant permissions for RPC functions
GRANT EXECUTE ON FUNCTION public.get_public_properties TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_properties_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_view_count TO anon, authenticated;
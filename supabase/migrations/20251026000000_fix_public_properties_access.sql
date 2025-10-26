-- Migration: Fix Public Access to Properties
-- Description: Assurer l'accès public complet aux propriétés pour les visiteurs

-- 1. Supprimer toutes les politiques RLS existantes sur properties
DROP POLICY IF EXISTS "Properties are publicly viewable" ON public.properties;
DROP POLICY IF EXISTS "Owners can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Public property access" ON public.properties;

-- 2. Désactiver RLS temporairement sur properties pour accès public
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;

-- 3. Accorder des permissions explicites pour l'accès public
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

-- 4. Créer une fonction RPC sécurisée pour l'accès public optimisé
CREATE OR REPLACE FUNCTION get_public_properties(
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_price bigint DEFAULT NULL,
  p_max_price bigint DEFAULT NULL,
  p_bedrooms smallint DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  property_type text,
  city text,
  neighborhood text,
  address text,
  monthly_rent bigint,
  surface_area numeric,
  bedrooms smallint,
  bathrooms smallint,
  status text,
  is_furnished boolean,
  has_ac boolean,
  has_parking boolean,
  has_garden boolean,
  latitude numeric,
  longitude numeric,
  created_at timestamptz,
  view_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    p.surface_area,
    p.bedrooms,
    p.bathrooms,
    p.status,
    p.is_furnished,
    p.has_ac,
    p.has_parking,
    p.has_garden,
    p.latitude,
    p.longitude,
    p.created_at,
    p.view_count
  FROM public.properties p
  WHERE
    (p.status = 'disponible' OR p.status IS NULL)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_min_price IS NULL OR p.monthly_rent >= p_min_price)
    AND (p_max_price IS NULL OR p.monthly_rent <= p_max_price)
    AND (p_bedrooms IS NULL OR p.bedrooms >= p_bedrooms)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 5. Créer une fonction RPC pour l'accès public à une propriété spécifique
CREATE OR REPLACE FUNCTION get_public_property(p_property_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  property_type text,
  city text,
  neighborhood text,
  address text,
  monthly_rent bigint,
  surface_area numeric,
  bedrooms smallint,
  bathrooms smallint,
  status text,
  is_furnished boolean,
  has_ac boolean,
  has_parking boolean,
  has_garden boolean,
  latitude numeric,
  longitude numeric,
  created_at timestamptz,
  view_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    p.surface_area,
    p.bedrooms,
    p.bathrooms,
    p.status,
    p.is_furnished,
    p.has_ac,
    p.has_parking,
    p.has_garden,
    p.latitude,
    p.longitude,
    p.created_at,
    p.view_count
  FROM public.properties p
  WHERE p.id = p_property_id AND (p.status = 'disponible' OR p.status IS NULL);
END;
$$;

-- 6. Assurer l'accès public aux médias des propriétés
ALTER TABLE public.property_media DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.property_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_media TO authenticated;

-- 7. Donner les permissions d'exécution des fonctions RPC
GRANT EXECUTE ON FUNCTION get_public_properties(
  text, text, bigint, bigint, smallint, integer, integer
) TO anon;
GRANT EXECUTE ON FUNCTION get_public_properties(
  text, text, bigint, bigint, smallint, integer, integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_property(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_public_property(uuid) TO authenticated;

-- 8. Créer un index pour optimiser les recherches publiques
CREATE INDEX IF NOT EXISTS idx_properties_public_search ON public.properties (
  status, city, property_type, monthly_rent, created_at DESC
);

-- 9. Note: Les données de test sont maintenant dans seed.sql
-- Cette migration se concentre uniquement sur la configuration de l'accès public

-- 10. Validation
DO $$
BEGIN
  -- Vérifier que les fonctions RPC sont bien créées
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_public_properties'
  ) THEN
    RAISE EXCEPTION 'La fonction get_public_properties n''a pas été créée';
  END IF;

  -- Vérifier que les permissions sont accordées
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'properties'
    AND grantee = 'anon'
    AND privilege_type = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Les permissions SELECT n''ont pas été accordées à anon';
  END IF;

  RAISE NOTICE 'Migration terminée avec succès: Accès public aux propriétés configuré';
END $$;
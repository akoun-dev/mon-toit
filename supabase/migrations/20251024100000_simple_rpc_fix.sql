-- ============================================================
-- Mon Toit — Migration: Correction simple des fonctions RPC
-- Date: 2025-10-24
-- ============================================================

-- Supprimer toutes les fonctions RPC existantes
DROP FUNCTION IF EXISTS public.get_public_properties() CASCADE;
DROP FUNCTION IF EXISTS public.get_public_properties(integer,integer,text,text,text,numeric,numeric,numeric,numeric,integer,boolean,text,text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_property_view(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.search_properties_nearby(numeric, numeric, numeric, integer) CASCADE;

-- Fonction RPC simple et fonctionnelle
CREATE OR REPLACE FUNCTION public.get_public_properties()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type text,
  category text,
  price numeric,
  price_currency text,
  price_frequency text,
  surface numeric,
  surface_unit text,
  rooms_count integer,
  bedrooms_count integer,
  bathrooms_count integer,
  address_line1 text,
  neighborhood text,
  city text,
  latitude numeric,
  longitude numeric,
  images jsonb,
  furnished boolean,
  parking boolean,
  elevator boolean,
  balcony boolean,
  terrace boolean,
  status text,
  publication_status text,
  available_from date,
  view_count integer,
  favorite_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  owner_id uuid,
  owner_full_name text,
  owner_user_type text,
  reference text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.description,
    p.type,
    p.category,
    p.price,
    p.price_currency,
    p.price_frequency,
    p.surface,
    p.surface_unit,
    p.rooms_count,
    p.bedrooms_count,
    p.bathrooms_count,
    p.address_line1,
    p.neighborhood,
    p.city,
    p.latitude,
    p.longitude,
    p.images,
    p.furnished,
    p.parking,
    p.elevator,
    p.balcony,
    p.terrace,
    p.status,
    p.publication_status,
    p.available_from,
    p.view_count,
    p.favorite_count,
    p.created_at,
    p.updated_at,
    p.owner_id,
    pr.full_name as owner_full_name,
    pr.user_type as owner_user_type,
    p.reference
  FROM public.properties p
  LEFT JOIN public.profiles pr ON p.owner_id = pr.id
  WHERE
    p.publication_status = 'approuvé'
    AND p.status = 'disponible'
    AND p.created_at <= NOW()
  ORDER BY p.created_at DESC
  LIMIT 20;
$$;

-- Fonction pour incrémenter les vues
CREATE OR REPLACE FUNCTION public.increment_property_view(p_property_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = p_property_id;
$$;

-- Fonction de recherche géolocalisée simple
CREATE OR REPLACE FUNCTION public.search_properties_nearby(
  p_lat numeric,
  p_lng numeric,
  p_radius_km numeric DEFAULT 5,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  category text,
  price numeric,
  surface numeric,
  neighborhood text,
  distance_km numeric,
  images jsonb,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.type,
    p.category,
    p.price,
    p.surface,
    p.neighborhood,
    ROUND(
      CAST(6371.0 * ACOS(
        LEAST(1.0,
          GREATEST(-1.0,
            COS(RADIANS(p_lat)) * COS(RADIANS(p.latitude)) *
            COS(RADIANS(p_lng) - RADIANS(p.longitude)) +
            SIN(RADIANS(p_lat)) * SIN(RADIANS(p.latitude))
          )
        )
      ) AS NUMERIC), 2
    ) AS distance_km,
    p.images,
    p.status
  FROM public.properties p
  WHERE
    p.publication_status = 'approuvé'
    AND p.status = 'disponible'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.latitude BETWEEN (p_lat - p_radius_km/111) AND (p_lat + p_radius_km/111)
    AND p.longitude BETWEEN (p_lng - p_radius_km/111) AND (p_lng + p_radius_km/111)
  ORDER BY distance_km
  LIMIT p_limit;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.get_public_properties() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_properties_nearby(numeric, numeric, numeric, integer) TO anon, authenticated;

-- Forcer le rafraîchissement du cache de schéma
NOTIFY pgrst, 'reload schema';

-- Fin de migration
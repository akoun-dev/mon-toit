-- ============================================================
-- Mon Toit — Migration Simple: Corrections essentielles
-- Date: 2025-10-24
-- Corrige uniquement les problèmes bloquants
-- ============================================================

-- 1) Créer le type user_type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE public.user_type AS ENUM ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance');
  END IF;
END $$;

-- 2) Ajouter colonne face_verified si manquante
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='profiles'
        AND column_name='face_verified'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN face_verified boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- 3) Créer les fonctions RPC essentielles

-- Fonction RPC pour obtenir les propriétés publiques
CREATE OR REPLACE FUNCTION get_public_properties()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric(12,2),
  monthly_rent numeric(12,2),
  surface_area numeric(8,2),
  rooms_count integer,
  bathrooms_count integer,
  address text,
  city text,
  postal_code text,
  country text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  images text[],
  type text,
  furnished boolean,
  status text,
  is_verified boolean,
  owner_name text,
  created_at timestamptz,
  updated_at timestamptz
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
    p.price,
    p.monthly_rent,
    p.surface_area,
    p.rooms_count,
    p.bathrooms_count,
    p.address,
    p.city,
    p.postal_code,
    p.country,
    p.latitude,
    p.longitude,
    p.images,
    p.type,
    p.furnished,
    p.status,
    p.is_verified,
    pr.full_name as owner_name,
    p.created_at,
    p.updated_at
  FROM public.properties p
  LEFT JOIN public.profiles pr ON p.owner_id = pr.id
  WHERE p.status = 'available'
  ORDER BY p.created_at DESC;
END;
$$;

-- Fonction RPC pour créer une propriété de démo
CREATE OR REPLACE FUNCTION create_demo_property()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_property_id uuid;
  demo_owner_id uuid;
BEGIN
  SELECT id INTO demo_owner_id
  FROM public.profiles
  WHERE user_type = 'proprietaire'
  LIMIT 1;

  IF demo_owner_id IS NULL THEN
    demo_owner_id := gen_random_uuid();
    INSERT INTO public.profiles (
      id,
      full_name,
      user_type,
      is_verified,
      created_at,
      updated_at
    ) VALUES (
      demo_owner_id,
      'Propriétaire Démo',
      'proprietaire',
      true,
      now(),
      now()
    );
  END IF;

  demo_property_id := gen_random_uuid();

  INSERT INTO public.properties (
    id,
    title,
    description,
    price,
    monthly_rent,
    surface_area,
    rooms_count,
    bathrooms_count,
    address,
    city,
    postal_code,
    country,
    type,
    furnished,
    status,
    is_verified,
    owner_id,
    created_at,
    updated_at
  ) VALUES (
    demo_property_id,
    'Appartement Démo - Cocody',
    'Bel appartement de démonstration avec 2 chambres.',
    150000000,
    250000,
    85.5,
    2,
    1,
    'Rue des Jardins, Cocody',
    'Abidjan',
    '00225',
    'Côte d''Ivoire',
    'apartment',
    true,
    'available',
    true,
    demo_owner_id,
    now(),
    now()
  );

  RETURN demo_property_id;
END;
$$;

-- 4) Accorder les permissions
REVOKE ALL ON FUNCTION get_public_properties() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_properties() TO anon, authenticated;

REVOKE ALL ON FUNCTION create_demo_property() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_demo_property() TO authenticated;

-- Fin de migration
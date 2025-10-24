-- ============================================================
-- Mon Toit — Migration: Fonctions RPC et politiques RLS
-- Date: 2025-10-24
-- ============================================================

-- 1) Fonctions RPC pour les propriétés

-- Fonction principale pour récupérer les propriétés publiques
CREATE OR REPLACE FUNCTION get_public_properties(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_property_type text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_neighborhood text DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_surface_min numeric DEFAULT NULL,
  p_surface_max numeric DEFAULT NULL,
  p_bedrooms_min integer DEFAULT NULL,
  p_furnished boolean DEFAULT NULL,
  p_order_by text DEFAULT 'created_at.desc',
  p_search_text text DEFAULT NULL
)
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
LANGUAGE plpgsql
SECURITY DEFINER -- Important: permet l'accès sans authentification
AS $$
DECLARE
  v_query text;
BEGIN
  -- Construire la requête dynamique
  v_query := '
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
      p.publication_status = ''approuvé''
      AND p.status = ''disponible''
      AND p.created_at <= NOW()';

  -- Ajouter les filtres si spécifiés
  IF p_property_type IS NOT NULL THEN
    v_query := v_query || ' AND p.type = ' || quote_literal(p_property_type);
  END IF;

  IF p_category IS NOT NULL THEN
    v_query := v_query || ' AND p.category = ' || quote_literal(p_category);
  END IF;

  IF p_neighborhood IS NOT NULL THEN
    v_query := v_query || ' AND p.neighborhood ILIKE ' || quote_literal('%' || p_neighborhood || '%');
  END IF;

  IF p_price_min IS NOT NULL THEN
    v_query := v_query || ' AND p.price >= ' || p_price_min;
  END IF;

  IF p_price_max IS NOT NULL THEN
    v_query := v_query || ' AND p.price <= ' || p_price_max;
  END IF;

  IF p_surface_min IS NOT NULL THEN
    v_query := v_query || ' AND p.surface >= ' || p_surface_min;
  END IF;

  IF p_surface_max IS NOT NULL THEN
    v_query := v_query || ' AND p.surface <= ' || p_surface_max;
  END IF;

  IF p_bedrooms_min IS NOT NULL THEN
    v_query := v_query || ' AND p.bedrooms_count >= ' || p_bedrooms_min;
  END IF;

  IF p_furnished IS NOT NULL THEN
    v_query := v_query || ' AND p.furnished = ' || p_furnished;
  END IF;

  IF p_search_text IS NOT NULL THEN
    v_query := v_query || ' AND (
      p.title ILIKE ' || quote_literal('%' || p_search_text || '%') || ' OR
      p.description ILIKE ' || quote_literal('%' || p_search_text || '%') || ' OR
      p.neighborhood ILIKE ' || quote_literal('%' || p_search_text || '%')
    )';
  END IF;

  -- Ajouter l'ordre
  v_query := v_query || ' ORDER BY ' || p_order_by || ' NULLS LAST';

  -- Ajouter la pagination
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- Exécuter la requête
  RETURN QUERY EXECUTE v_query;

  RETURN;
END;
$$;

-- Fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_property_view(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = p_property_id;
END;
$$;

-- Fonction pour rechercher des propriétés avec géolocalisation
CREATE OR REPLACE FUNCTION search_properties_nearby(
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.type,
    p.category,
    p.price,
    p.surface,
    p.neighborhood,
    -- Calcul de distance en km utilisant la formule de Haversine simplifiée
    ROUND(
      6371 * ACOS(
        LEAST(1.0,
          GREATEST(-1.0,
            COS(RADIANS(p_lat)) * COS(RADIANS(p.latitude)) *
            COS(RADIANS(p.lng) - RADIANS(p.longitude)) +
            SIN(RADIANS(p_lat)) * SIN(RADIANS(p.latitude))
          )
        )
      ), 2
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
END;
$$;

-- 2) Politiques RLS pour les tables immobilières

-- RLS pour properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Politique properties_select_public (propriétés publiques)
DROP POLICY IF EXISTS properties_select_public ON public.properties;
CREATE POLICY properties_select_public ON public.properties
  FOR SELECT TO anon, authenticated
  USING (
    publication_status = 'approuvé'
    AND status = 'disponible'
  );

-- Politique properties_select_owner (propriétaires)
DROP POLICY IF EXISTS properties_select_owner ON public.properties;
CREATE POLICY properties_select_owner ON public.properties
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Politique properties_insert_owner (propriétaires)
DROP POLICY IF EXISTS properties_insert_owner ON public.properties;
CREATE POLICY properties_insert_owner ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Politique properties_update_owner (propriétaires)
DROP POLICY IF EXISTS properties_update_owner ON public.properties;
CREATE POLICY properties_update_owner ON public.properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Politique properties_delete_owner (propriétaires)
DROP POLICY IF EXISTS properties_delete_owner ON public.properties;
CREATE POLICY properties_delete_owner ON public.properties
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Politique properties_admin_full_access (admins)
DROP POLICY IF EXISTS properties_admin_full_access ON public.properties;
CREATE POLICY properties_admin_full_access ON public.properties
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- RLS pour rental_applications
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Politique rental_applications_select_tenant (locataires)
DROP POLICY IF EXISTS rental_applications_select_tenant ON public.rental_applications;
CREATE POLICY rental_applications_select_tenant ON public.rental_applications
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

-- Politique rental_applications_select_owner (propriétaires)
DROP POLICY IF EXISTS rental_applications_select_owner ON public.rental_applications;
CREATE POLICY rental_applications_select_owner ON public.rental_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id AND p.owner_id = auth.uid()
    )
  );

-- Politique rental_applications_insert_tenant (locataires)
DROP POLICY IF EXISTS rental_applications_insert_tenant ON public.rental_applications;
CREATE POLICY rental_applications_insert_tenant ON public.rental_applications
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());

-- Politique rental_applications_update_tenant (locataires)
DROP POLICY IF EXISTS rental_applications_update_tenant ON public.rental_applications;
CREATE POLICY rental_applications_update_tenant ON public.rental_applications
  FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Politique rental_applications_admin_full_access (admins)
DROP POLICY IF EXISTS rental_applications_admin_full_access ON public.rental_applications;
CREATE POLICY rental_applications_admin_full_access ON public.rental_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- RLS pour user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Politique user_verifications_select_own (utilisateurs)
DROP POLICY IF EXISTS user_verifications_select_own ON public.user_verifications;
CREATE POLICY user_verifications_select_own ON public.user_verifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Politique user_verifications_insert_own (utilisateurs)
DROP POLICY IF EXISTS user_verifications_insert_own ON public.user_verifications;
CREATE POLICY user_verifications_insert_own ON public.user_verifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politique user_verifications_admin_full_access (admins)
DROP POLICY IF EXISTS user_verifications_admin_full_access ON public.user_verifications;
CREATE POLICY user_verifications_admin_full_access ON public.user_verifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- RLS pour search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Politique search_history_select_own (utilisateurs)
DROP POLICY IF EXISTS search_history_select_own ON public.search_history;
CREATE POLICY search_history_select_own ON public.search_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Politique search_history_insert_own (utilisateurs)
DROP POLICY IF EXISTS search_history_insert_own ON public.search_history;
CREATE POLICY search_history_insert_own ON public.search_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politique search_history_anonymous (visiteurs anonymes)
DROP POLICY IF EXISTS search_history_anonymous ON public.search_history;
CREATE POLICY search_history_anonymous ON public.search_history
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- RLS pour user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Politique user_preferences_select_own (utilisateurs)
DROP POLICY IF EXISTS user_preferences_select_own ON public.user_preferences;
CREATE POLICY user_preferences_select_own ON public.user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Politique user_preferences_upsert_own (utilisateurs)
DROP POLICY IF EXISTS user_preferences_upsert_own ON public.user_preferences;
CREATE POLICY user_preferences_upsert_own ON public.user_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) Index de performance pour les tables immobilières
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_publication_status ON public.properties(publication_status);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON public.properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_surface ON public.properties(surface);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms_count ON public.properties(bedrooms_count);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_view_count ON public.properties(view_count);

CREATE INDEX IF NOT EXISTS idx_rental_applications_property_id ON public.rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_tenant_id ON public.rental_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status ON public.rental_applications(status);
CREATE INDEX IF NOT EXISTS idx_rental_applications_created_at ON public.rental_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON public.user_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_session_id ON public.search_history(session_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- 4) Permissions pour les fonctions RPC
GRANT EXECUTE ON FUNCTION get_public_properties TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_property_view TO authenticated;
GRANT EXECUTE ON FUNCTION search_properties_nearby TO anon, authenticated;

-- Fin de migration
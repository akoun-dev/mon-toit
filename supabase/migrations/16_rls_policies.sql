-- Politiques Row Level Security (RLS) pour l'accès public et sécurisé
-- Ce fichier configure les permissions pour permettre l'accès public aux propriétés
-- tout en maintenant la sécurité des données sensibles

-- Activer RLS sur toutes les tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_utility_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_signature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES PUBLIQUES (ACCÈS SANS AUTHENTIFICATION)
-- =====================================================

-- Propriétés : Lecture publique pour tout le monde
CREATE POLICY "properties_public_select" ON public.properties
  FOR SELECT USING (true);

-- Propriétés : Insertion uniquement pour les propriétaires authentifiés
CREATE POLICY "properties_insert_owners" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

-- Propriétés : Mise à jour par le propriétaire ou admin
CREATE POLICY "properties_update_owners" ON public.properties
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Propriétés : Suppression par le propriétaire ou admin
CREATE POLICY "properties_delete_owners" ON public.properties
  FOR DELETE USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Médias des propriétés : Lecture publique
CREATE POLICY "property_media_public_select" ON public.property_media
  FOR SELECT USING (true);

-- Médias des propriétés : Insertion par propriétaire du bien
CREATE POLICY "property_media_insert_owners" ON public.property_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_media.property_id
      AND p.owner_id = auth.uid()
    )
  );

-- Médias des propriétés : Mise à jour par propriétaire du bien
CREATE POLICY "property_media_update_owners" ON public.property_media
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_media.property_id
      AND p.owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR UTILISATEURS AUTHENTIFIÉS
-- =====================================================

-- Profils : Lecture publique (nom complet, ville, etc.)
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (
    -- Champs publics accessibles à tout le monde
    true -- Pour l'instant, accès complet aux profils publics
  );

-- Profils : Mise à jour par l'utilisateur lui-même
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profils : Insertion contrôlée (via inscription)
CREATE POLICY "profiles_insert_controlled" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Roles utilisateurs : Lecture par utilisateur concerné ou admin
CREATE POLICY "user_roles_read_user_or_admin" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Roles actifs : Lecture par utilisateur concerné ou admin
CREATE POLICY "user_active_roles_read_user_or_admin" ON public.user_active_roles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- =====================================================
-- POLITIQUES POUR LES FONCTIONNALITÉS UTILISATEURS
-- =====================================================

-- Vues des propriétés : Insertion publique (tracking analytics)
CREATE POLICY "property_views_public_insert" ON public.property_views
  FOR INSERT WITH CHECK (true);

-- Vues des propriétés : Lecture par propriétaire du bien ou admin
CREATE POLICY "property_views_read_owners_admin" ON public.property_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_views.property_id
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Favoris : Lecture par utilisateur propriétaire
CREATE POLICY "user_favorites_read_owner" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Favoris : Insertion par utilisateur authentifié
CREATE POLICY "user_favorites_insert_user" ON public.user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favoris : Suppression par utilisateur propriétaire
CREATE POLICY "user_favorites_delete_owner" ON public.user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics des propriétés : Insertion publique (système)
CREATE POLICY "property_analytics_public_insert" ON public.property_analytics
  FOR INSERT WITH CHECK (true);

-- Analytics des propriétés : Lecture par propriétaire du bien ou admin
CREATE POLICY "property_analytics_read_owners_admin" ON public.property_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_analytics.property_id
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Historique de recherche : Lecture par utilisateur propriétaire
CREATE POLICY "search_history_read_owner" ON public.search_history
  FOR SELECT USING (auth.uid() = user_id);

-- Historique de recherche : Insertion par utilisateur authentifié
CREATE POLICY "search_history_insert_user" ON public.search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LES CANDIDATURES ET LOCATION
-- =====================================================

-- Candidatures : Lecture par candidat, propriétaire du bien ou admin
CREATE POLICY "rental_applications_read_stakeholders" ON public.rental_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Candidatures : Insertion par utilisateurs authentifiés
CREATE POLICY "rental_applications_insert_applicants" ON public.rental_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Documents des candidatures : Lecture par candidat, propriétaire du bien ou admin
CREATE POLICY "application_documents_read_stakeholders" ON public.application_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rental_applications ra
      WHERE ra.id = application_documents.application_id
      AND ra.applicant_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.rental_applications ra
      JOIN public.properties p ON p.id = ra.property_id
      WHERE ra.id = application_documents.application_id
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- =====================================================
-- POLITIQUES POUR LES COMMUNICATIONS
-- =====================================================

-- Conversations : Lecture par participants
CREATE POLICY "conversations_read_participants" ON public.conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Messages : Lecture par expéditeur ou destinataire
CREATE POLICY "messages_read_participants" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

-- Messages : Insertion par utilisateurs authentifiés
CREATE POLICY "messages_insert_authenticated" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications : Lecture par utilisateur destinataire
CREATE POLICY "notifications_read_owner" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications : Insertion par système ou admin
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- =====================================================
-- POLITIQUES POUR LA SÉCURITÉ ET ADMINISTRATION
-- =====================================================

-- Logs de sécurité : Lecture par admin uniquement
CREATE POLICY "security_audit_logs_admin_only" ON public.security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Événements de sécurité : Lecture par admin
CREATE POLICY "security_events_admin_only" ON public.security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Tentatives de connexion : Insertion publique (tracking sécurité)
CREATE POLICY "login_attempts_public_insert" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Tentatives de connexion : Lecture par admin
CREATE POLICY "login_attempts_admin_only" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- =====================================================
-- POLITIQUES POUR L'OTP ET VÉRIFICATIONS
-- =====================================================

-- Codes OTP : Insertion publique
CREATE POLICY "otp_codes_public_insert" ON public.otp_codes
  FOR INSERT WITH CHECK (true);

-- Codes OTP : Lecture par admin
CREATE POLICY "otp_codes_admin_only" ON public.otp_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_active_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.active_role = 'admin_ansut'
    )
  );

-- Vérifications OTP : Insertion publique
CREATE POLICY "otp_verifications_public_insert" ON public.otp_verifications
  FOR INSERT WITH CHECK (true);

-- Vérifications téléphone : Lecture par utilisateur concerné
CREATE POLICY "phone_verifications_read_user" ON public.phone_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Vérifications téléphone : Insertion par système
CREATE POLICY "phone_verifications_system_insert" ON public.phone_verifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLITIQUES POUR LES PRÉFÉRENCES UTILISATEURS
-- =====================================================

-- Préférences utilisateurs : Lecture par utilisateur propriétaire
CREATE POLICY "user_preferences_read_owner" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Préférences utilisateurs : Insertion par utilisateur authentifié
CREATE POLICY "user_preferences_insert_user" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Préférences utilisateurs : Mise à jour par utilisateur propriétaire
CREATE POLICY "user_preferences_update_owner" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Alertes propriétés : Lecture par utilisateur propriétaire
CREATE POLICY "property_alerts_read_owner" ON public.property_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Alertes propriétés : Insertion par utilisateur authentifié
CREATE POLICY "property_alerts_insert_user" ON public.property_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FONCTIONS RPC UTILITAIRES
-- =====================================================

-- Fonction pour vérifier les limites de taux de connexion
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(email_param text)
RETURNS TABLE(is_blocked boolean, attempts integer, blocked_until timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(blocked_until > NOW(), false) as is_blocked,
    0 as attempts,
    blocked_until
  FROM public.login_attempts
  WHERE email = email_param
    AND blocked_until > NOW()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions pour la fonction RPC
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO authenticated;

-- Fonction pour incrémenter le compteur de vues d'une propriété
CREATE OR REPLACE FUNCTION public.increment_property_view(property_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Insérer une vue
  INSERT INTO public.property_views (property_id, user_id, view_date)
  VALUES (property_id_param, auth.uid(), NOW())
  ON CONFLICT DO NOTHING;

  -- Mettre à jour le compteur de vues dans la propriété
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = property_id_param;

  -- Mettre à jour les analytics du jour
  INSERT INTO public.property_analytics (property_id, view_date, total_views, unique_views)
  VALUES (property_id_param, CURRENT_DATE, 1, 1)
  ON CONFLICT (property_id, view_date)
  DO UPDATE SET
    total_views = property_analytics.total_views + 1,
    unique_views = property_analytics.unique_views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions pour la fonction
GRANT EXECUTE ON FUNCTION public.increment_property_view TO anon;
GRANT EXECUTE ON FUNCTION public.increment_property_view TO authenticated;

-- Fonction pour obtenir les propriétés publiques avec filtres
CREATE OR REPLACE FUNCTION public.get_public_properties(
  limit_param integer DEFAULT 20,
  offset_param integer DEFAULT 0,
  city_filter text DEFAULT NULL,
  min_price integer DEFAULT NULL,
  max_price integer DEFAULT NULL,
  property_type_filter text DEFAULT NULL,
  status_filter text DEFAULT 'disponible'
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  property_type text,
  city text,
  neighborhood text,
  address text,
  monthly_rent integer,
  deposit_amount integer,
  surface_area integer,
  bedrooms integer,
  bathrooms integer,
  owner_id uuid,
  status text,
  is_furnished boolean,
  has_ac boolean,
  has_parking boolean,
  has_garden boolean,
  latitude numeric,
  longitude numeric,
  main_image text,
  images text[],
  video_url text,
  virtual_tour_url text,
  view_count integer,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.description, p.property_type, p.city, p.neighborhood, p.address,
    p.monthly_rent, p.deposit_amount, p.surface_area, p.bedrooms, p.bathrooms,
    p.owner_id, p.status, p.is_furnished, p.has_ac, p.has_parking, p.has_garden,
    p.latitude, p.longitude, p.main_image, p.images, p.video_url, p.virtual_tour_url,
    p.view_count, p.created_at, p.updated_at
  FROM public.properties p
  WHERE
    (status_filter IS NULL OR p.status = status_filter)
    AND (city_filter IS NULL OR p.city = city_filter)
    AND (min_price IS NULL OR p.monthly_rent >= min_price)
    AND (max_price IS NULL OR p.monthly_rent <= max_price)
    AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions pour la fonction
GRANT EXECUTE ON FUNCTION public.get_public_properties TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_properties TO authenticated;

-- Fonction pour rechercher des propriétés (texte plein)
CREATE OR REPLACE FUNCTION public.search_properties(
  search_query text DEFAULT NULL,
  limit_param integer DEFAULT 20,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  property_type text,
  city text,
  neighborhood text,
  address text,
  monthly_rent integer,
  surface_area integer,
  bedrooms integer,
  bathrooms integer,
  main_image text,
  view_count integer,
  created_at timestamptz,
  search_rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.description, p.property_type, p.city, p.neighborhood, p.address,
    p.monthly_rent, p.surface_area, p.bedrooms, p.bathrooms,
    p.main_image, p.view_count, p.created_at,
    CASE
      WHEN search_query IS NULL THEN 0
      ELSE ts_rank(to_tsvector('french',
        COALESCE(p.title, '') || ' ' ||
        COALESCE(p.description, '') || ' ' ||
        COALESCE(p.city, '') || ' ' ||
        COALESCE(p.neighborhood, '')
      ), plainto_tsquery('french', search_query))
    END as search_rank
  FROM public.properties p
  WHERE
    p.status = 'disponible'
    AND (
      search_query IS NULL OR
      to_tsvector('french',
        COALESCE(p.title, '') || ' ' ||
        COALESCE(p.description, '') || ' ' ||
        COALESCE(p.city, '') || ' ' ||
        COALESCE(p.neighborhood, '')
      ) @@ plainto_tsquery('french', search_query)
    )
  ORDER BY
    CASE
      WHEN search_query IS NULL THEN 0
      ELSE ts_rank(to_tsvector('french',
        COALESCE(p.title, '') || ' ' ||
        COALESCE(p.description, '') || ' ' ||
        COALESCE(p.city, '') || ' ' ||
        COALESCE(p.neighborhood, '')
      ), plainto_tsquery('french', search_query))
    END DESC,
    p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions pour la fonction
GRANT EXECUTE ON FUNCTION public.search_properties TO anon;
GRANT EXECUTE ON FUNCTION public.search_properties TO authenticated;

-- Commentaires explicatifs pour les développeurs
COMMENT ON POLICY "properties_public_select" ON public.properties IS 'Permet la lecture publique des propriétés pour la page daccueil et lexplorateur';
COMMENT ON POLICY "property_views_public_insert" ON public.property_views IS 'Permet le tracking des vues par les visiteurs non authentifiés';
COMMENT ON FUNCTION public.get_public_properties IS 'Fonction principale pour obtenir les propriétés avec filtres - utilisée dans PropertyGrid';
COMMENT ON FUNCTION public.search_properties IS 'Recherche texte plein sur les propriétés - utilisée dans la barre de recherche';
COMMENT ON FUNCTION public.increment_property_view IS 'Incrémente le compteur de vues quand un bien est consulté';
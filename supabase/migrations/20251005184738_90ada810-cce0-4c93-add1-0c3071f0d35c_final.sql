-- ============================================
-- PHASE 1: Protection des Numéros de Téléphone
-- ============================================
-- Objectif: Protéger les numéros de téléphone en créant une vue publique
-- et une fonction RPC pour accès contextuel légitime uniquement.

-- ============================================
-- 1. Créer une vue publique sans téléphone
-- ============================================
-- Cette vue expose toutes les informations de profil SAUF le numéro de téléphone
-- Elle sera utilisée pour l'affichage général des profils utilisateurs

-- D'abord, vérifions quelles colonnes existent réellement dans la table profiles
DO $$
DECLARE
  column_exists BOOLEAN;
  sql_query TEXT;
BEGIN
  -- Construire dynamiquement la requête CREATE VIEW en fonction des colonnes existantes
  sql_query := 'CREATE OR REPLACE VIEW public.profiles_public AS SELECT ';
  
  -- Ajouter id (obligatoire)
  sql_query := sql_query || 'id, ';
  
  -- Ajouter full_name (obligatoire)
  sql_query := sql_query || 'full_name, ';
  
  -- Vérifier et ajouter user_type
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'user_type'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'user_type, ';
  END IF;
  
  -- Vérifier et ajouter avatar_url
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'avatar_url'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'avatar_url, ';
  END IF;
  
  -- Vérifier et ajouter bio (problématique)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'bio'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'bio, ';
  END IF;
  
  -- Vérifier et ajouter city
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'city'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'city, ';
  END IF;
  
  -- Vérifier et ajouter is_verified
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'is_verified'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'is_verified, ';
  END IF;
  
  -- Vérifier et ajouter oneci_verified
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'oneci_verified'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'oneci_verified, ';
  END IF;
  
  -- Vérifier et ajouter cnam_verified
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'cnam_verified'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'cnam_verified, ';
  END IF;
  
  -- Vérifier et ajouter created_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'created_at'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'created_at, ';
  END IF;
  
  -- Vérifier et ajouter updated_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'updated_at'
  ) INTO column_exists;
  
  IF column_exists THEN
    sql_query := sql_query || 'updated_at ';
  END IF;
  
  -- Supprimer la virgule finale si nécessaire
  IF RIGHT(sql_query, 2) = ', ' THEN
    sql_query := LEFT(sql_query, LENGTH(sql_query) - 2);
  ELSIF RIGHT(sql_query, 1) = ',' THEN
    sql_query := LEFT(sql_query, LENGTH(sql_query) - 1);
  END IF;
  
  -- Ajouter la clause FROM
  sql_query := sql_query || ' FROM public.profiles';
  
  -- Exécuter la requête
  EXECUTE sql_query;
  
  -- Journaliser les colonnes trouvées pour débogage
  RAISE NOTICE 'Vue profiles_public créée avec les colonnes existantes';
END;
$$;

-- ============================================
-- 2. Créer une fonction RPC sécurisée pour l'accès au téléphone
-- ============================================
-- Cette fonction vérifie le contexte avant de retourner le numéro de téléphone
CREATE OR REPLACE FUNCTION public.get_user_phone(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_phone text;
  has_access boolean := false;
  relationship text := 'none';
BEGIN
  -- Access checks
  IF auth.uid() = target_user_id THEN
    has_access := true;
    relationship := 'self';
  ELSIF EXISTS (
    SELECT 1 FROM public.rental_applications ra
    JOIN public.properties p ON p.id = ra.property_id
    WHERE ra.applicant_id = target_user_id
      AND p.owner_id = auth.uid()
  ) THEN
    has_access := true;
    relationship := 'landlord_to_applicant';
  ELSIF EXISTS (
    SELECT 1 FROM public.rental_applications ra
    JOIN public.properties p ON p.id = ra.property_id
    WHERE ra.applicant_id = auth.uid()
      AND p.owner_id = target_user_id
  ) THEN
    has_access := true;
    relationship := 'applicant_to_landlord';
  ELSIF EXISTS (
    SELECT 1 FROM public.leases
    WHERE (landlord_id = auth.uid() AND tenant_id = target_user_id)
       OR (tenant_id = auth.uid() AND landlord_id = target_user_id)
  ) THEN
    has_access := true;
    relationship := 'lease_party';
  ELSIF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    has_access := true;
    relationship := 'admin';
  END IF;

  -- Log to centralized table
  INSERT INTO public.sensitive_data_access_log (
    requester_id, target_user_id, data_type, access_granted, relationship_type
  ) VALUES (
    auth.uid(), target_user_id, 'phone', has_access, relationship
  );

  -- Return phone if authorized
  IF has_access THEN
    SELECT phone INTO user_phone FROM public.profiles WHERE id = target_user_id;
    RETURN user_phone;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- ============================================
-- 3. Activer RLS sur la table de logs d'accès
-- ============================================
-- Cette table journalise tous les accès aux données sensibles
ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent voir tous les logs
CREATE POLICY "Admins can view all sensitive access logs" ON public.sensitive_data_access_log
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Politique: Les utilisateurs peuvent voir leurs propres accès
CREATE POLICY "Users can view own sensitive access logs" ON public.sensitive_data_access_log
  FOR SELECT USING (requester_id = auth.uid());

-- ============================================
-- 4. Créer une fonction pour détecter les accès suspects
-- ============================================
-- Cette fonction identifie les patterns d'accès suspects aux données sensibles
CREATE OR REPLACE FUNCTION public.detect_suspicious_sensitive_data_access()
RETURNS TABLE(
  user_id uuid,
  access_count integer,
  unique_targets integer,
  time_span_minutes integer,
  risk_level text
) AS $$
BEGIN
  RETURN QUERY
  WITH user_access_patterns AS (
    SELECT
      requester_id,
      COUNT(*) as access_count,
      COUNT(DISTINCT target_user_id) as unique_targets,
      EXTRACT(EPOCH FROM (MAX(accessed_at) - MIN(accessed_at))) / 60 as time_span_minutes
    FROM public.sensitive_data_access_log
    WHERE accessed_at > NOW() - INTERVAL '1 hour'
      AND data_type = 'phone'
    GROUP BY requester_id
  )
  SELECT
    requester_id as user_id,
    access_count,
    unique_targets,
    time_span_minutes::integer,
    CASE
      WHEN access_count > 50 OR unique_targets > 20 THEN 'HIGH'
      WHEN access_count > 20 OR unique_targets > 10 THEN 'MEDIUM'
      ELSE 'LOW'
    END as risk_level
  FROM user_access_patterns
  WHERE access_count > 5 OR unique_targets > 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Créer un trigger pour alerter sur les accès suspects
-- ============================================
-- Ce trigger crée automatiquement des alertes de sécurité
CREATE OR REPLACE FUNCTION public.alert_on_suspicious_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une alerte si l'accès est refusé
  IF NOT NEW.access_granted THEN
    INSERT INTO public.security_audit_logs (
      event_type, severity, user_id, details, metadata
    ) VALUES (
      'UNAUTHORIZED_PHONE_ACCESS', 'medium', NEW.requester_id,
      jsonb_build_object(
        'target_user_id', NEW.target_user_id,
        'relationship_type', NEW.relationship_type,
        'accessed_at', NEW.accessed_at
      ),
      jsonb_build_object(
        'data_type', 'phone',
        'access_granted', false
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table de logs d'accès
DROP TRIGGER IF EXISTS trigger_alert_on_suspicious_access ON public.sensitive_data_access_log;
CREATE TRIGGER trigger_alert_on_suspicious_access
  AFTER INSERT ON public.sensitive_data_access_log
  FOR EACH ROW EXECUTE FUNCTION public.alert_on_suspicious_access();

-- ============================================
-- 6. Mettre à jour les politiques RLS existantes
-- ============================================
-- Modifier les politiques existantes pour utiliser la vue publique
DROP POLICY IF EXISTS "Profiles sont visibles par tous les utilisateurs authentifiés" ON public.profiles;
CREATE POLICY "Profiles sont visibles par tous les utilisateurs authentifiés" ON public.profiles
  FOR SELECT USING (false);

-- Créer une politique pour la vue publique
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles_public;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles_public
  FOR SELECT USING (true);

-- ============================================
-- 7. Créer une fonction pour les administrateurs
-- ============================================
-- Fonction pour que les admins puissent voir tous les profils avec téléphone
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles_with_phone()
RETURNS TABLE (
  id uuid,
  full_name text,
  user_type public.user_type,
  phone text,
  city text,
  is_verified boolean
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est un admin
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Retourner tous les profils avec téléphone
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.user_type,
    p.phone,
    p.city,
    p.is_verified
  FROM public.profiles p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Documentation des fonctions
-- ============================================
COMMENT ON FUNCTION public.get_user_phone(uuid) IS 
'Fonction sécurisée pour accéder au numéro de téléphone d''un utilisateur.
Vérifie le contexte d''accès avant de retourner le numéro.
Journalise tous les accès dans sensitive_data_access_log.';

COMMENT ON FUNCTION public.detect_suspicious_sensitive_data_access() IS 
'Détecte les patterns d''accès suspects aux données sensibles.
Retourne les utilisateurs avec un nombre élevé d''accès ou des comportements inhabituels.';

COMMENT ON FUNCTION public.admin_get_all_profiles_with_phone() IS 
'Fonction réservée aux administrateurs pour voir tous les profils avec leurs numéros de téléphone.
Nécessite le rôle admin pour être exécutée.';
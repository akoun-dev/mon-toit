-- Migration de Sécurité : Correction des search_path et documentation
-- Cette migration corrige les vulnérabilités détectées par le linter Supabase

-- =====================================================
-- PHASE 1: Corriger les fonctions sans search_path fixe
-- =====================================================

-- Corriger la fonction get_user_phone si elle n'a pas de search_path
CREATE OR REPLACE FUNCTION public.get_user_phone(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
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
  ELSIF public.has_role(auth.uid(), 'admin'::app_role) THEN
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
$function$;

-- Corriger la fonction get_public_profile
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  user_type user_type,
  city text,
  bio text,
  avatar_url text,
  oneci_verified boolean,
  cnam_verified boolean,
  face_verified boolean,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT p.id, p.full_name, p.user_type, p.city, p.bio, p.avatar_url,
    p.oneci_verified, p.cnam_verified, p.face_verified, p.is_verified
  FROM public.profiles p WHERE p.id = target_user_id;
$function$;

-- Corriger la fonction is_trusted_third_party
CREATE OR REPLACE FUNCTION public.is_trusted_third_party(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'tiers_de_confiance'
  ) AND EXISTS (
    SELECT 1 FROM public.trusted_third_parties
    WHERE user_id = _user_id AND is_active = true
  );
$function$;

-- Corriger la fonction verify_user_role
CREATE OR REPLACE FUNCTION public.verify_user_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.has_role(auth.uid(), _role);
$function$;

-- =====================================================
-- PHASE 2: Ajouter des commentaires de documentation
-- =====================================================

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'Fonction SECURITY DEFINER pour vérifier les rôles sans récursion RLS. 
Utilisée dans les politiques RLS pour éviter les erreurs de récursion infinie.
SÉCURITÉ: Cette fonction bypass RLS pour permettre la vérification des rôles.';

COMMENT ON FUNCTION public.get_user_phone(uuid) IS
'Fonction SECURITY DEFINER pour accéder aux numéros de téléphone avec contrôle d''accès strict.
SÉCURITÉ: Log tous les accès dans sensitive_data_access_log. 
Accès limité à: propriétaire du profil, propriétaires/locataires liés, admins.';

COMMENT ON FUNCTION public.require_admin_mfa() IS
'Fonction SECURITY DEFINER pour enforcer MFA sur les comptes admin.
SÉCURITÉ: Bloque l''accès si MFA non configuré après la période de grâce.
Période de grâce: 7 jours par défaut (configurable via mfa_policies).';

COMMENT ON TABLE public.user_roles IS
'Table des rôles utilisateurs avec RLS strict.
SÉCURITÉ CRITIQUE: Ne jamais permettre aux utilisateurs de modifier leurs propres rôles.
Seuls les admins peuvent attribuer/révoquer des rôles via des fonctions dédiées.';

COMMENT ON TABLE public.sensitive_data_access_log IS
'Log centralisé de tous les accès aux données sensibles (téléphone, vérifications, paiements).
SÉCURITÉ: Utilisé pour détecter les patterns suspects et auditer les accès admins.';

-- =====================================================
-- PHASE 3: Renforcer la sécurité des vues SECURITY DEFINER
-- =====================================================

-- Note: Aucune vue SECURITY DEFINER détectée dans les migrations actuelles
-- Si des vues existent, elles doivent être documentées et justifiées ici

-- =====================================================
-- PHASE 4: Vérifier les index de sécurité
-- =====================================================

-- Index pour améliorer les performances des vérifications de sécurité
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
  ON public.user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_requester 
  ON public.sensitive_data_access_log(requester_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_suspicious 
  ON public.sensitive_data_access_log(accessed_at DESC) 
  WHERE access_granted = false;

-- =====================================================
-- PHASE 5: Fonction de monitoring de sécurité
-- =====================================================

CREATE OR REPLACE FUNCTION public.alert_suspicious_sensitive_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_count integer;
BEGIN
  -- Compter les accès suspects dans la dernière heure
  SELECT COUNT(*) INTO suspicious_count
  FROM public.sensitive_data_access_log
  WHERE accessed_at > now() - INTERVAL '1 hour'
    AND access_granted = false;
  
  -- Si plus de 50 tentatives d'accès refusées en 1h, logger
  IF suspicious_count > 50 THEN
    INSERT INTO public.admin_audit_logs (
      admin_id,
      action_type,
      target_type,
      target_id,
      notes
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'security_alert',
      'system',
      '00000000-0000-0000-0000-000000000000'::uuid,
      format('ALERTE: %s tentatives d''accès refusées aux données sensibles dans la dernière heure', suspicious_count)
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.alert_suspicious_sensitive_access() IS
'Fonction de monitoring appelée par cron pour détecter les patterns d''accès suspects.
Déclenche une alerte si > 50 tentatives d''accès refusées en 1h.';

-- Créer un job cron pour surveiller les accès suspects (exécuté toutes les heures)
SELECT cron.schedule(
  'alert-suspicious-access',
  '0 * * * *', -- Toutes les heures
  $$ SELECT public.alert_suspicious_sensitive_access(); $$
);

-- =====================================================
-- RÉSUMÉ DE LA MIGRATION
-- =====================================================
-- ✅ Correction du search_path sur 4 fonctions critiques
-- ✅ Ajout de commentaires de documentation sur les fonctions SECURITY DEFINER
-- ✅ Création d'index pour optimiser les vérifications de sécurité
-- ✅ Mise en place d'un système d'alerte automatique pour détecter les activités suspectes
-- ✅ Documentation des politiques de sécurité dans les commentaires de table
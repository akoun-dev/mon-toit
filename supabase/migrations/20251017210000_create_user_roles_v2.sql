/*
  =========================================
  Système de Changement de Rôle V2 - Migration 1
  =========================================

  Cette migration crée la nouvelle structure de base de données
  pour le système de changement de rôle V2 avec :

  1. Nouvelle table user_roles avec JSONB flexible
  2. Fonctions helper pour la gestion des rôles
  3. Vue user_roles_summary pour requêtes simplifiées
  4. RLS activé et index de performance

  Date: 2025-10-17
  Version: 2.0.0
  Auteur: Manus AI
*/

-- ============================================================================
-- 1. NOUVELLE TABLE USER_ROLES V2
-- ============================================================================

-- Créer la nouvelle table user_roles avec structure flexible
CREATE TABLE IF NOT EXISTS public.user_roles_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Structure JSONB flexible pour stocker les rôles et métadonnées
  roles jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array de rôles avec métadonnées
  current_role text NOT NULL DEFAULT 'locataire',

  -- Limites et cooldowns
  daily_switch_count integer NOT NULL DEFAULT 0,
  last_switch_at timestamptz,
  last_role_change_date date DEFAULT CURRENT_DATE,
  available_switches_today integer NOT NULL DEFAULT 3,

  -- Métadonnées
  switch_history jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT user_roles_v2_user_id_unique UNIQUE (user_id),
  CONSTRAINT user_roles_v2_current_role_check CHECK (current_role IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance')),
  CONSTRAINT user_roles_v2_daily_switch_count_check CHECK (daily_switch_count >= 0 AND daily_switch_count <= 3),
  CONSTRAINT user_roles_v2_available_switches_check CHECK (available_switches_today >= 0 AND available_switches_today <= 3)
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_user_id ON public.user_roles_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_current_role ON public.user_roles_v2(current_role);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_last_switch ON public.user_roles_v2(last_switch_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_roles_gin ON public.user_roles_v2 USING gin (roles);

-- ============================================================================
-- 2. RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Activer RLS
ALTER TABLE public.user_roles_v2 ENABLE ROW LEVEL SECURITY;

-- Politique pour l'utilisateur connecté (CRUD complet sur ses propres données)
CREATE POLICY "Users can manage own roles v2"
  ON public.user_roles_v2 FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politique pour les administrateurs (lecture seule)
CREATE POLICY "Admins can view all roles v2"
  ON public.user_roles_v2 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 3. FONCTIONS HELPER
-- ============================================================================

-- Fonction pour ajouter un rôle à un utilisateur
CREATE OR REPLACE FUNCTION add_user_role(
  p_user_id uuid,
  p_new_role text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_roles jsonb;
  v_role_exists boolean := false;
  v_current_role text;
BEGIN
  -- Obtenir les rôles actuels de l'utilisateur
  SELECT roles, current_role INTO v_user_roles, v_current_role
  FROM public.user_roles_v2
  WHERE user_id = p_user_id;

  -- Vérifier si le rôle existe déjà
  v_role_exists := EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_user_roles) role_elem
    WHERE role_elem->>'role' = p_new_role
  );

  -- Si le rôle n'existe pas, l'ajouter
  IF NOT v_role_exists THEN
    -- Ajouter le nouveau rôle avec métadonnées
    v_user_roles := v_user_roles || jsonb_build_object(
      'role', p_new_role,
      'added_at', now(),
      'metadata', p_metadata
    );

    -- Mettre à jour la table
    UPDATE public.user_roles_v2
    SET
      roles = v_user_roles,
      updated_at = now()
    WHERE user_id = p_user_id;

    -- Logger l'action
    INSERT INTO public.security_audit_logs (
      event_type, severity, user_id, details, metadata
    ) VALUES (
      'ROLE_ADDED', 'low', p_user_id,
      jsonb_build_object('new_role', p_new_role),
      jsonb_build_object('source', 'add_user_role_function', 'timestamp', now())
    );

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Fonction pour réinitialiser le compteur quotidien de changements
CREATE OR REPLACE FUNCTION reset_daily_switch_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles_v2
  SET
    daily_switch_count = 0,
    available_switches_today = 3,
    last_role_change_date = CURRENT_DATE
  WHERE last_role_change_date < CURRENT_DATE;

  -- Logger la réinitialisation
  INSERT INTO public.security_audit_logs (
    event_type, severity, details, metadata
  ) VALUES (
    'DAILY_SWITCH_COUNT_RESET', 'low',
    jsonb_build_object('reset_count', row_count),
    jsonb_build_object('source', 'scheduled_reset', 'timestamp', now())
  );
END;
$$;

-- Fonction pour valider si un utilisateur peut devenir propriétaire
CREATE OR REPLACE FUNCTION validate_proprietaire_prerequisites(p_user_id uuid)
RETURNS TABLE (
  can_become_proprietaire boolean,
  missing_prerequisites jsonb,
  completion_percentage integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_missing_prerequisites jsonb := '[]'::jsonb;
  v_completion_count integer := 0;
  v_total_requirements integer := 4;
BEGIN
  -- Récupérer le profil de l'utilisateur
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  -- Vérifier les prérequis

  -- 1. Vérification ONECI (CNI)
  IF v_profile.oneci_verified IS TRUE THEN
    v_completion_count := v_completion_count + 1;
  ELSE
    v_missing_prerequisites := v_missing_prerequisites || jsonb_build_object(
      'requirement', 'oneci_verification',
      'label', 'Vérification ONECI (CNI)',
      'completed', false
    );
  END IF;

  -- 2. Téléphone vérifié (OTP)
  IF v_profile.phone_verified IS TRUE THEN
    v_completion_count := v_completion_count + 1;
  ELSE
    v_missing_prerequisites := v_missing_prerequisites || jsonb_build_object(
      'requirement', 'phone_verification',
      'label', 'Téléphone vérifié (OTP)',
      'completed', false
    );
  END IF;

  -- 3. Email vérifié
  IF v_profile.email_confirmed_at IS NOT NULL THEN
    v_completion_count := v_completion_count + 1;
  ELSE
    v_missing_prerequisites := v_missing_prerequisites || jsonb_build_object(
      'requirement', 'email_verification',
      'label', 'Email vérifié',
      'completed', false
    );
  END IF;

  -- 4. Profil complété à 80%
  DECLARE
    v_profile_completion integer := 0;
  BEGIN
    -- Calculer le pourcentage de complétion du profil
    SELECT CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND
           phone IS NOT NULL AND address IS NOT NULL THEN 80
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 60
      WHEN first_name IS NOT NULL OR last_name IS NOT NULL THEN 40
      ELSE 20
    END INTO v_profile_completion
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_profile_completion >= 80 THEN
      v_completion_count := v_completion_count + 1;
    ELSE
      v_missing_prerequisites := v_missing_prerequisites || jsonb_build_object(
        'requirement', 'profile_completion',
        'label', 'Profil complété à 80%',
        'completed', false,
        'current_percentage', v_profile_completion
      );
    END IF;
  END;

  -- Retourner les résultats
  RETURN QUERY
  SELECT
    v_completion_count >= v_total_requirements as can_become_proprietaire,
    v_missing_prerequisites as missing_prerequisites,
    (v_completion_count * 100 / v_total_requirements)::integer as completion_percentage;
END;
$$;

-- ============================================================================
-- 4. VUE SIMPLIFIÉE
-- ============================================================================

-- Créer une vue pour simplifier les requêtes
CREATE OR REPLACE VIEW public.user_roles_summary AS
SELECT
  user_id,
  current_role,
  roles,
  daily_switch_count,
  available_switches_today,
  last_switch_at,
  CASE
    WHEN last_switch_at > now() - INTERVAL '15 minutes' THEN true
    ELSE false
  END as is_in_cooldown,
  CASE
    WHEN available_switches_today > 0 AND NOT (
      last_switch_at > now() - INTERVAL '15 minutes'
    ) THEN true
    ELSE false
  END as can_switch_role,
  updated_at
FROM public.user_roles_v2;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_roles_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_roles_v2_updated_at
  BEFORE UPDATE ON public.user_roles_v2
  FOR EACH ROW EXECUTE FUNCTION update_user_roles_v2_updated_at();

-- ============================================================================
-- 6. VALIDATION ET NETTOYAGE
-- ============================================================================

-- Supprimer l'ancienne table user_roles_v2 si elle existe (pour les re-déploiements)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles_v2' AND table_schema = 'public') THEN
    -- La table existe déjà, on ne fait rien pour préserver les données
    RAISE NOTICE 'Table user_roles_v2 already exists, preserving existing data';
  ELSE
    -- La table n'existe pas, elle sera créée par le CREATE TABLE ci-dessus
    RAISE NOTICE 'Creating new table user_roles_v2';
  END IF;
END $$;

-- ============================================================================
-- 7. COMPLÉTION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration user_roles_v2 créée avec succès!';
  RAISE NOTICE 'Fonctionnalités implémentées:';
  RAISE NOTICE '- Table user_roles_v2 avec structure JSONB flexible';
  RAISE NOTICE '- Fonctions helper (add_user_role, reset_daily_switch_count)';
  RAISE NOTICE '- Fonction de validation pour devenir propriétaire';
  RAISE NOTICE '- Vue user_roles_summary pour requêtes simplifiées';
  RAISE NOTICE '- RLS policies sécurisées';
  RAISE NOTICE '- Index de performance optimisés';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape: Exécuter la migration de données';
END $$;
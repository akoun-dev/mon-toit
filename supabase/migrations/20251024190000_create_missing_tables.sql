-- ============================================================
-- Mon Toit — Migration: Tables Manquantes Essentielles
-- Date: 2025-10-24
-- Crée les tables manquantes qui causent les erreurs 404
-- ============================================================

-- 1) Table des favoris utilisateurs
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- 2) Table des rôles utilisateurs (système V1)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('locataire', 'proprietaire', 'agence', 'tiers_de_confiance', 'admin_ansut')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, role)
);

-- 3) Table des mandats d'agence
CREATE TABLE IF NOT EXISTS public.agency_mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mandate_type text NOT NULL CHECK (mandate_type IN ('exclusive', 'non_exclusive', 'management_only')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  start_date date NOT NULL,
  end_date date,
  commission_rate numeric(5,2) CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_fixed numeric(12,2) DEFAULT 0 CHECK (commission_fixed >= 0),
  responsibilities jsonb DEFAULT '{}',
  terms text,
  contract_document text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, agency_id, mandate_type)
);

-- 4) Table des tentatives de connexion (pour sécurité)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  attempt_count integer DEFAULT 1,
  blocked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Vue résumée des rôles utilisateurs (user_roles_summary)
CREATE OR REPLACE VIEW public.user_roles_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'role', ur.role,
        'granted_at', ur.granted_at,
        'expires_at', ur.expires_at,
        'is_active', ur.is_active,
        'granted_by', ur.granted_by
      ) ORDER BY ur.granted_at DESC
    ) FILTER (WHERE ur.role IS NOT NULL),
    '[]'::jsonb
  ) as roles,
  COALESCE(
    array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL AND ur.is_active = true AND (ur.expires_at IS NULL OR ur.expires_at > now())),
    ARRAY[]::text[]
  ) as active_roles,
  p.user_type as primary_role,
  p.is_verified,
  p.full_name,
  (SELECT MAX(created_at) FROM public.login_attempts la WHERE la.user_id = u.id AND la.success = true) as last_login,
  (SELECT COUNT(*) FROM public.login_attempts la WHERE la.user_id = u.id AND la.created_at > now() - interval '24 hours') as login_attempts_24h
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at, p.user_type, p.is_verified, p.full_name;

-- 6) Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_property_id ON public.user_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_agency_id ON public.agency_mandates(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_owner_id ON public.agency_mandates(owner_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_property_id ON public.agency_mandates(property_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);

-- 7) Fonctions RPC pour la gestion des rôles

-- Fonction pour attribuer un rôle à un utilisateur
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id uuid,
  new_role text,
  granted_by uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_valid boolean := FALSE;
BEGIN
  -- Vérifier si le rôle est valide
  SELECT new_role IN ('locataire', 'proprietaire', 'agence', 'tiers_de_confiance', 'admin_ansut') INTO role_valid;

  IF NOT role_valid THEN
    RAISE EXCEPTION 'Rôle invalide: %', new_role;
  END IF;

  -- Insérer ou mettre à jour le rôle
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, new_role, granted_by)
  ON CONFLICT (user_id, role)
  DO UPDATE SET
    granted_at = now(),
    is_active = true,
    granted_by = COALESCE(granted_by, user_roles.granted_by);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur dans assign_user_role: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Fonction pour vérifier les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION check_user_roles(target_user_id uuid)
RETURNS TABLE(
  role text,
  is_active boolean,
  granted_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.role,
    ur.is_active,
    ur.granted_at,
    ur.expires_at
  FROM public.user_roles ur
  WHERE ur.user_id = target_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY ur.granted_at DESC;
END;
$$;

-- 8) RLS (Row Level Security) policies

-- Politiques pour user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Politiques pour user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin_ansut'
    )
  );

-- Politiques pour agency_mandates
ALTER TABLE public.agency_mandates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agencies can view their mandates" ON public.agency_mandates
  FOR SELECT USING (auth.uid() = agency_id);
CREATE POLICY "Owners can view their property mandates" ON public.agency_mandates
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Agencies can manage their mandates" ON public.agency_mandates
  FOR ALL USING (auth.uid() = agency_id);

-- 9) Permissions pour les fonctions RPC
REVOKE ALL ON FUNCTION assign_user_role(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_user_role(uuid, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION check_user_roles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_user_roles(uuid) TO authenticated, anon;

-- 10) Trigger pour mettre à jour updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.agency_mandates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fin de migration
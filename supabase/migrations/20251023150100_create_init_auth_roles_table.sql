-- ============================================================
-- Mon Toit — Migration initiale: profils, rôles, RLS, rate-limit login
-- Date: 2025-10-23
-- ============================================================

-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE public.user_type AS ENUM ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance');
  END IF;
END $$;

-- 2) Table profiles (référence auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  user_type public.user_type NOT NULL DEFAULT 'locataire',
  phone text,
  bio text,
  city text,
  is_verified boolean NOT NULL DEFAULT false,
  oneci_verified boolean NOT NULL DEFAULT false,
  cnam_verified boolean NOT NULL DEFAULT false,
  face_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3) Table user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_user_role
  ON public.user_roles(user_id, role);

-- 4) Vue publique (restreinte) des profils
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.city,
  p.is_verified,
  p.oneci_verified,
  p.cnam_verified,
  p.face_verified,
  p.user_type,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Restreindre accès anonyme à la vue (les accès visiteurs se font via RPC dédiée si besoin)
REVOKE ALL ON public.profiles_public FROM anon;

-- 5) Table login_attempts + RLS + fonction de rate-limit
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid NULL,
  ip_address text NULL,
  fingerprint text NULL,
  user_agent text NULL,
  success boolean NOT NULL DEFAULT false,
  blocked_until timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Autoriser l'insertion par tous (permets de logguer avant authentification)
DROP POLICY IF EXISTS login_attempts_insert_any ON public.login_attempts;
CREATE POLICY login_attempts_insert_any ON public.login_attempts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Lecture restreinte à ses propres logs (si user_id présent)
DROP POLICY IF EXISTS login_attempts_select_self ON public.login_attempts;
CREATE POLICY login_attempts_select_self ON public.login_attempts
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- 6) RLS pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture/écriture par le propriétaire
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Lecture/écriture par les admins (éviter la récursion)
DROP POLICY IF EXISTS profiles_admin_full_access ON public.profiles;
CREATE POLICY profiles_admin_full_access ON public.profiles
  FOR ALL TO authenticated
  USING (
    -- Vérifier si l'utilisateur est admin en utilisant user_type directement
    (id = auth.uid() AND user_type = 'admin_ansut') OR
    -- Ou vérifier via profiles pour éviter la récursion
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    -- Pour l'insertion/mise à jour, vérifier le type d'utilisateur
    (id = auth.uid() AND user_type = 'admin_ansut') OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- 7) RLS pour user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Voir ses propres rôles
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Ajouter le rôle "locataire" par défaut pour soi (par défaut)
DROP POLICY IF EXISTS user_roles_insert_user_self ON public.user_roles;
CREATE POLICY user_roles_insert_user_self ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'locataire');

-- Gestion complète par admins (éviter la récursion)
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL TO authenticated
  USING (
    -- Vérifier si l'utilisateur est admin en utilisant une sous-requête sans récursion
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    -- Pour l'insertion, permettre aux admins de créer n'importe quel rôle
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- 8) Fonction de rate-limit pour le login (fenêtre 15 minutes, max 5 échecs)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  _email text,
  _ip_address text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_minutes integer := 15;
  v_max_attempts integer := 5;
  v_failed_count integer;
  v_blocked boolean := false;
  v_retry_after interval := interval '0 minutes';
  v_last_fail timestamptz;
BEGIN
  SELECT COUNT(*), MAX(created_at)
  INTO v_failed_count, v_last_fail
  FROM public.login_attempts
  WHERE success = false
    AND created_at > (now() - make_interval(mins => v_window_minutes))
    AND (_email IS NOT NULL AND email = _email OR _ip_address IS NOT NULL AND ip_address = _ip_address);

  IF v_failed_count IS NULL THEN v_failed_count := 0; END IF;

  IF v_failed_count >= v_max_attempts THEN
    v_blocked := true;
    IF v_last_fail IS NOT NULL THEN
      v_retry_after := make_interval(mins => v_window_minutes) - (now() - v_last_fail);
      IF v_retry_after < interval '0' THEN v_retry_after := interval '0'; END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', NOT v_blocked,
    'reason', CASE WHEN v_blocked THEN 'Too many failed attempts' ELSE NULL END,
    'retry_after', CASE WHEN v_blocked THEN to_char((now() + v_retry_after), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') ELSE NULL END,
    'blocked', v_blocked,
    'show_captcha', v_failed_count >= 3,
    'failed_count', v_failed_count
  );
END;
$$;

-- Sécurité: restreindre execution aux rôles standard auth
REVOKE ALL ON FUNCTION public.check_login_rate_limit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text, text) TO anon, authenticated;

-- 9) Index de performance pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON public.login_attempts(ip_address);

-- Index composite pour les recherches de rate limiting
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON public.login_attempts(email, created_at);

-- 10) Seed minimal optionnel (ne fait rien si déjà présent)
-- Créer un profil automatiquement via trigger côté application, pas ici.

-- Fin de migration


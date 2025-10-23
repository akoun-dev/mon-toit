-- ============================================================
-- Mon Toit — Migration OTP: tables et fonctions pour la vérification par code
-- Date: 2025-10-23
-- ============================================================

-- 1) Table OTP codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('signup', 'reset_password', 'email_change')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text NULL,
  user_agent text NULL
);

-- Trigger updated_at pour otp_codes
DROP TRIGGER IF EXISTS trg_otp_codes_updated_at ON public.otp_codes;
CREATE TRIGGER trg_otp_codes_updated_at
  BEFORE UPDATE ON public.otp_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2) Table OTP notifications
CREATE TABLE IF NOT EXISTS public.otp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  otp_code_id uuid NOT NULL REFERENCES public.otp_codes(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('signup', 'reset_password', 'email_change')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider text NOT NULL DEFAULT 'supabase',
  message_id text NULL,
  error_message text NULL,
  sent_at timestamptz NULL,
  delivered_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text NULL,
  user_agent text NULL,
  device_fingerprint text NULL
);

-- Trigger updated_at pour otp_notifications
DROP TRIGGER IF EXISTS trg_otp_notifications_updated_at ON public.otp_notifications;
CREATE TRIGGER trg_otp_notifications_updated_at
  BEFORE UPDATE ON public.otp_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3) RLS pour otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Politiques pour otp_codes
DROP POLICY IF EXISTS otp_codes_insert_own ON public.otp_codes;
CREATE POLICY otp_codes_insert_own ON public.otp_codes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS otp_codes_select_own ON public.otp_codes;
CREATE POLICY otp_codes_select_own ON public.otp_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS otp_codes_update_own ON public.otp_codes;
CREATE POLICY otp_codes_update_own ON public.otp_codes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Accès complet pour les admins (éviter la récursion)
DROP POLICY IF EXISTS otp_codes_admin_full_access ON public.otp_codes;
CREATE POLICY otp_codes_admin_full_access ON public.otp_codes
  FOR ALL TO authenticated
  USING (
    -- Vérifier si l'utilisateur est admin en utilisant profiles au lieu de user_roles
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

-- 4) RLS pour otp_notifications
ALTER TABLE public.otp_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour otp_notifications
DROP POLICY IF EXISTS otp_notifications_insert_own ON public.otp_notifications;
CREATE POLICY otp_notifications_insert_own ON public.otp_notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS otp_notifications_select_own ON public.otp_notifications;
CREATE POLICY otp_notifications_select_own ON public.otp_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS otp_notifications_update_own ON public.otp_notifications;
CREATE POLICY otp_notifications_update_own ON public.otp_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Accès complet pour les admins (éviter la récursion)
DROP POLICY IF EXISTS otp_notifications_admin_full_access ON public.otp_notifications;
CREATE POLICY otp_notifications_admin_full_access ON public.otp_notifications
  FOR ALL TO authenticated
  USING (
    -- Vérifier si l'utilisateur est admin en utilisant profiles au lieu de user_roles
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

-- 5) Fonction RPC pour créer un code OTP
CREATE OR REPLACE FUNCTION public.create_otp_code(
  p_user_id uuid,
  p_email text,
  p_type text DEFAULT 'signup',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE(success boolean, code text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp_code text;
  v_expires_at timestamptz;
  v_existing_code record;
  v_otp_uuid uuid;
BEGIN
  -- Valider les paramètres
  IF p_user_id IS NULL OR p_email IS NULL OR p_email = '' THEN
    RETURN QUERY SELECT false, NULL::text, 'Paramètres invalides'::text;
    RETURN;
  END IF;

  IF NOT (p_type IN ('signup', 'reset_password', 'email_change')) THEN
    RETURN QUERY SELECT false, NULL::text, 'Type OTP non valide'::text;
    RETURN;
  END IF;

  -- Vérifier s'il existe déjà un code non expiré
  SELECT * INTO v_existing_code
  FROM public.otp_codes
  WHERE user_id = p_user_id
    AND email = p_email
    AND type = p_type
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_code IS NOT NULL THEN
    -- Retourner le code existant s'il n'a pas dépassé les tentatives max
    IF v_existing_code.attempts < v_existing_code.max_attempts THEN
      RETURN QUERY SELECT true, v_existing_code.code, 'Code OTP existant'::text;
      RETURN;
    ELSE
      RETURN QUERY SELECT false, NULL::text, 'Nombre maximum de tentatives atteint'::text;
      RETURN;
    END IF;
  END IF;

  -- Générer un nouveau code OTP à 6 chiffres
  v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  v_expires_at := now() + interval '24 hours';

  -- Insérer le nouveau code et récupérer l'UUID
  INSERT INTO public.otp_codes (
    user_id, email, code, type, expires_at, ip_address, user_agent
  ) VALUES (
    p_user_id, p_email, v_otp_code, p_type, v_expires_at, p_ip_address, p_user_agent
  ) RETURNING id INTO v_otp_uuid;

  -- Créer la notification
  INSERT INTO public.otp_notifications (
    user_id, email, otp_code_id, type, status, ip_address, user_agent
  ) VALUES (
    p_user_id, p_email, v_otp_uuid, p_type, 'pending', p_ip_address, p_user_agent
  );

  RETURN QUERY SELECT true, v_otp_code, 'Code OTP créé avec succès'::text;
END;
$$;

-- 6) Fonction RPC pour vérifier un code OTP
CREATE OR REPLACE FUNCTION public.verify_otp_code(
  p_email text,
  p_code text,
  p_type text DEFAULT 'signup'
)
RETURNS TABLE(success boolean, message text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp_record record;
  v_user_id uuid;
BEGIN
  -- Valider les paramètres
  IF p_email IS NULL OR p_email = '' OR p_code IS NULL OR p_code = '' THEN
    RETURN QUERY SELECT false, 'Paramètres invalides'::text, NULL::uuid;
    RETURN;
  END IF;

  IF NOT (p_type IN ('signup', 'reset_password', 'email_change')) THEN
    RETURN QUERY SELECT false, 'Type OTP non valide'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Rechercher le code OTP
  SELECT * INTO v_otp_record
  FROM public.otp_codes
  WHERE email = p_email
    AND code = p_code
    AND type = p_type
    AND used_at IS NULL
    AND expires_at > now
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_otp_record IS NULL THEN
    RETURN QUERY SELECT false, 'Code invalide ou expiré'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Vérifier le nombre de tentatives
  IF v_otp_record.attempts >= v_otp_record.max_attempts THEN
    RETURN QUERY SELECT false, 'Nombre maximum de tentatives atteint'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Incrémenter le nombre de tentatives
  UPDATE public.otp_codes
  SET attempts = attempts + 1,
      updated_at = now()
  WHERE id = v_otp_record.id;

  -- Marquer le code comme utilisé
  UPDATE public.otp_codes
  SET used_at = now(),
      updated_at = now()
  WHERE id = v_otp_record.id;

  -- Mettre à jour la notification
  UPDATE public.otp_notifications
  SET status = 'delivered',
      delivered_at = now(),
      updated_at = now()
  WHERE otp_code_id = v_otp_record.id;

  v_user_id := v_otp_record.user_id;

  RETURN QUERY SELECT true, 'Code vérifié avec succès'::text, v_user_id;
END;
$$;

-- 7) Fonction RPC pour nettoyer les anciens codes OTP
CREATE OR REPLACE FUNCTION public.cleanup_old_otp_notifications(
  p_days_old integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Supprimer les anciennes notifications
  DELETE FROM public.otp_notifications
  WHERE created_at < now() - make_interval(days => p_days_old);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Supprimer les anciens codes orphelins
  DELETE FROM public.otp_codes
  WHERE created_at < now() - make_interval(days => p_days_old)
    AND id NOT IN (SELECT DISTINCT otp_code_id FROM public.otp_notifications WHERE otp_code_id IS NOT NULL);

  RETURN v_deleted_count;
END;
$$;

-- 8) Index de performance pour les requêtes OTP
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_type ON public.otp_codes(email, type);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_notifications_otp_code_id ON public.otp_notifications(otp_code_id);
CREATE INDEX IF NOT EXISTS idx_otp_notifications_user_id ON public.otp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_notifications_status ON public.otp_notifications(status);

-- 9) Permissions pour les fonctions RPC
REVOKE ALL ON FUNCTION public.create_otp_code(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_otp_code(uuid, text, text, text, text) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.verify_otp_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_otp_code(text, text, text) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.cleanup_old_otp_notifications(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_otp_notifications(integer) TO authenticated;

-- Fin de migration OTP

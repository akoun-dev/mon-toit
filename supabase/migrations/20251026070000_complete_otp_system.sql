-- Migration complète pour finaliser le système OTP
-- Date: 2025-10-26
-- Description: Finalisation du système d'authentification OTP

-- Table otp_codes si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT false
);

-- Activer RLS sur otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Politiques pour otp_codes
DROP POLICY IF EXISTS "Enable read access for admins" ON public.otp_codes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.otp_codes;

CREATE POLICY "Enable read access for admins" ON public.otp_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON public.otp_codes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Permissions
GRANT ALL ON public.otp_codes TO authenticated;
GRANT SELECT ON public.otp_codes TO anon;

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON public.otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Fonction create_otp_code finale
CREATE OR REPLACE FUNCTION public.create_otp_code(
  p_email TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_token TEXT;
  v_result JSON;
BEGIN
  -- Nettoyer les anciens codes expirés pour le même email
  UPDATE public.otp_codes
  SET is_used = true, used_at = now()
  WHERE email = p_email
  AND expires_at < now()
  AND is_used = false;

  -- Générer un token OTP à 6 chiffres
  v_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Insérer le nouveau code OTP
  INSERT INTO public.otp_codes (email, code, user_id, user_agent, expires_at)
  VALUES (p_email, v_token, p_user_id, p_user_agent, now() + interval '15 minutes');

  -- Construire le résultat
  v_result := json_build_object(
    'success', true,
    'token', v_token,
    'email', p_email,
    'user_id', p_user_id,
    'expires_at', (now() + interval '15 minutes')::timestamp,
    'created_at', now()::timestamp,
    'message', 'Code OTP généré avec succès'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction verify_otp_code améliorée
CREATE OR REPLACE FUNCTION public.verify_otp_code(
  p_email TEXT,
  p_code TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_otp_record RECORD;
  v_result JSON;
BEGIN
  -- Chercher le code OTP valide
  SELECT * INTO v_otp_record
  FROM public.otp_codes
  WHERE email = p_email
  AND code = p_code
  AND expires_at > now()
  AND is_used = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_otp_record.id IS NOT NULL THEN
    -- Marquer le code comme utilisé
    UPDATE public.otp_codes
    SET is_used = true, used_at = now()
    WHERE id = v_otp_record.id;

    v_result := json_build_object(
      'success', true,
      'verified', true,
      'user_id', v_otp_record.user_id,
      'email', p_email,
      'code', p_code,
      'verified_at', now()::timestamp,
      'message', 'Code OTP vérifié avec succès'
    );
  ELSE
    v_result := json_build_object(
      'success', false,
      'verified', false,
      'email', p_email,
      'code', p_code,
      'message', 'Code OTP invalide ou expiré'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction check_login_rate_limit améliorée
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempts_count INTEGER;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
  v_can_login BOOLEAN := true;
BEGIN
  -- Compter les tentatives de connexion dans la dernière heure
  SELECT COUNT(*), MAX(created_at)
  INTO v_attempts_count, v_last_attempt
  FROM public.login_attempts
  WHERE email = p_email
  AND created_at > now() - interval '1 hour';

  -- Si plus de 5 tentatives dans la dernière heure, bloquer
  IF v_attempts_count >= 5 THEN
    v_can_login := false;
  END IF;

  -- Si dernière tentative il y a moins de 5 minutes et 3+ tentatives, bloquer
  IF v_last_attempt > now() - interval '5 minutes' AND v_attempts_count >= 3 THEN
    v_can_login := false;
  END IF;

  RETURN v_can_login;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nettoyer les anciens codes OTP périodiquement (fonction de maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer les codes OTP expirés depuis plus de 24h
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - interval '24 hours';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION public.create_otp_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp_code(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otp_codes TO authenticated;

-- Ajouter des commentaires pour la documentation
COMMENT ON TABLE public.otp_codes IS 'Stocke les codes OTP à usage unique pour l''authentification';
COMMENT ON FUNCTION public.create_otp_code IS 'Génère un code OTP à 6 chiffres valide pendant 15 minutes';
COMMENT ON FUNCTION public.verify_otp_code(TEXT, TEXT, TEXT) IS 'Vérifie et consomme un code OTP';
COMMENT ON FUNCTION public.check_login_rate_limit(TEXT) IS 'Vérifie les limites de tentative de connexion pour prévenir les attaques par force brute';
COMMENT ON FUNCTION public.cleanup_expired_otp_codes IS 'Nettoie les anciens codes OTP expirés (maintenance)';
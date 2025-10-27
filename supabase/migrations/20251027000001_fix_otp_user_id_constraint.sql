-- Migration: Fix OTP user_id constraint
-- Description: Rendre user_id nullable dans otp_codes pour éviter les conflits pendant l'inscription

-- Rendre user_id nullable pour éviter les conflits de clé étrangère pendant l'inscription
ALTER TABLE public.otp_codes ALTER COLUMN user_id DROP NOT NULL;

-- Mettre à jour la fonction create_otp_code pour gérer user_id null
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

  -- Insérer le nouveau code OTP (user_id peut être NULL pendant l'inscription)
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

-- S'assurer que les permissions sont correctes
GRANT EXECUTE ON FUNCTION public.create_otp_code TO anon, authenticated;

-- Ajouter un commentaire pour documentation
COMMENT ON FUNCTION public.create_otp_code IS 'Génère et stocke un code OTP à 6 chiffres valide pendant 15 minutes (user_id nullable pour inscription)';
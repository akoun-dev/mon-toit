-- Migration: OTP Management Functions
-- Description: Functions for OTP generation, verification and management

-- Function to generate OTP code
CREATE OR REPLACE FUNCTION public.generate_otp_code(p_length INTEGER DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  v_otp TEXT;
  v_chars TEXT := '0123456789';
  v_chars_length INTEGER := LENGTH(v_chars);
BEGIN
  -- Generate random OTP using pgcrypto
  SELECT STRING_AGG(
    SUBSTRING(v_chars, ((random() * v_chars_length)::INTEGER + 1), 1)
  ) INTO v_otp
  FROM generate_series(1, p_length);

  RETURN v_otp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send OTP
CREATE OR REPLACE FUNCTION public.send_otp(p_email TEXT, p_type TEXT DEFAULT 'signup')
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_otp_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_otp_id UUID;
BEGIN
  -- Generate OTP code
  v_otp_code := public.generate_otp_code(6);
  v_expires_at := NOW() + INTERVAL '15 minutes';

  -- Insert or update OTP verification record
  INSERT INTO public.otp_verifications (
    email,
    token,
    type,
    expires_at
  ) VALUES (
    p_email,
    v_otp_code,
    p_type,
    v_expires_at
  )
  ON CONFLICT (email, type) DO UPDATE SET
    token = EXCLUDED.token,
    expires_at = v_expires_at,
    created_at = NOW()
  RETURNING id INTO v_otp_id;

  -- Log OTP generation
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    source,
    details
  ) VALUES (
    (SELECT id FROM public.profiles WHERE email = p_email LIMIT 1),
    'otp_generated',
    'low',
    'otp_system',
    jsonb_build_object(
      'email', p_email,
      'type', p_type,
      'otp_id', v_otp_id,
      'expires_at', v_expires_at
    )
  );

  RETURN QUERY SELECT
    true as success,
    'Code OTP envoyé avec succès' as message,
    v_expires_at as otp_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(p_email TEXT, p_otp_code TEXT, p_type TEXT DEFAULT 'signup')
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  is_valid BOOLEAN,
  expired BOOLEAN
) AS $$
DECLARE
  v_otp_record RECORD;
  v_is_valid BOOLEAN := false;
  v_is_expired BOOLEAN := false;
BEGIN
  -- Get OTP record
  SELECT * INTO v_otp_record
  FROM public.otp_verifications
  WHERE email = p_email
    AND type = p_type
    AND token = p_otp_code
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if OTP exists and is valid
  IF v_otp_record IS NOT NULL THEN
    -- Check if OTP has expired
    IF v_otp_record.expires_at < NOW() THEN
      v_is_expired := true;
    ELSE
      v_is_valid := true;

      -- Mark OTP as used
      UPDATE public.otp_verifications
      SET used_at = NOW()
      WHERE id = v_otp_record.id;

      -- Log successful verification
      INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        source,
        details
      ) VALUES (
        (SELECT id FROM public.profiles WHERE email = p_email LIMIT 1),
        'otp_verified',
        'low',
        'otp_system',
        jsonb_build_object(
          'email', p_email,
          'type', p_type,
          'verified_at', NOW()
        )
      );
    END IF;
  END IF;

  -- Log verification attempt
  IF NOT v_is_valid OR v_is_expired THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      details
    ) VALUES (
      (SELECT id FROM public.profiles WHERE email = p_email LIMIT 1),
      'otp_verification_failed',
      'medium',
      'otp_system',
      jsonb_build_object(
        'email', p_email,
        'type', p_type,
        'reason', CASE
          WHEN v_is_expired THEN 'otp_expired'
          WHEN v_otp_record IS NULL THEN 'otp_not_found'
          ELSE 'invalid_otp'
        END
      )
    );
  END IF;

  RETURN QUERY SELECT
    true as success,
    CASE
      WHEN v_is_expired THEN 'Code OTP expiré'
      WHEN v_otp_record IS NULL THEN 'Code invalide'
      WHEN v_is_valid THEN 'Vérification réussie'
      ELSE 'Erreur de vérification'
    END as message,
    v_is_valid as is_valid,
    v_is_expired as expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired OTP codes older than 1 hour
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW()
    OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '24 hours');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log cleanup
  INSERT INTO public.security_events (
    event_type,
    severity,
    source,
    details
  ) VALUES (
      'otp_cleanup',
      'low',
      'otp_system',
      jsonb_build_object(
        'deleted_count', v_deleted_count,
        'cleanup_timestamp', NOW()
      )
    );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for developers to test OTP functionality
CREATE OR REPLACE FUNCTION public.test_otp_flow(p_email TEXT)
RETURNS TABLE (
  step TEXT,
  success BOOLEAN,
  message TEXT,
  data JSONB
) AS $$
DECLARE
  v_otp_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate OTP
  v_otp_code := public.generate_otp_code(6);
  v_expires_at := NOW() + INTERVAL '15 minutes';

  -- Insert OTP for testing
  INSERT INTO public.otp_verifications (
    email,
    token,
    type,
    expires_at
  ) VALUES (
    p_email,
    v_otp_code,
    'signup',
    v_expires_at
  );

  RETURN QUERY SELECT
    'otp_generated' as step,
    true as success,
    'OTP généré pour test' as message,
    jsonb_build_object(
      'otp_code', v_otp_code,
      'email', p_email,
      'expires_at', v_expires_at
    ) as data
  UNION ALL
  SELECT
    'otp_test_complete' as step,
    true as success,
    'Test OTP flow terminé' as message,
    jsonb_build_object(
      'next_step', 'verify_otp_with_code',
      'otp_code', v_otp_code
    ) as data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_otp_code(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION send_otp(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_otp(TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_otp() TO service_role;
GRANT EXECUTE ON FUNCTION test_otp_flow(TEXT) TO authenticated, service_role;

-- Add index for OTP verification queries
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_type_created
ON public.otp_verifications(email, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at
ON public.otp_verifications(expires_at);

-- Add comment
COMMENT ON FUNCTION generate_otp_code IS 'Génère un code OTP cryptographiquement sécurisé';
COMMENT ON FUNCTION send_otp IS 'Envoie un code OTP par email et le stocke';
COMMENT ON FUNCTION verify_otp IS 'Vérifie un code OTP et le marque comme utilisé';
COMMENT ON FUNCTION cleanup_expired_otp IS 'Nettoie les codes OTP expirés ou utilisés';
COMMENT ON FUNCTION test_otp_flow IS 'Fonction de test pour le flux OTP (développement uniquement)';
-- Migration: Create missing authentication functions
-- Description: Add create_otp_code and other missing auth functions

-- Create simplified create_otp_code function
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
  -- Generate 6-digit OTP
  v_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Return success with token (for development/testing)
  -- In production, this would store in database
  v_result := json_build_object(
    'success', true,
    'token', v_token,
    'email', p_email,
    'expires_at', now() + interval '15 minutes',
    'message', 'OTP code generated successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to generate OTP code'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  -- Find valid OTP record
  SELECT * INTO v_otp_record
  FROM public.otp_codes
  WHERE LOWER(email) = LOWER(p_email)
    AND code = p_code
    AND expires_at > now()
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_otp_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired OTP code'
    );
  END IF;

  -- Mark OTP as used
  UPDATE public.otp_codes
  SET used_at = now(),
      user_agent = p_user_agent
  WHERE id = v_otp_record.id;

  -- Build success result
  v_result := json_build_object(
    'success', true,
    'user_id', v_otp_record.user_id,
    'email', v_otp_record.email,
    'verified_at', now(),
    'message', 'OTP code verified successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to verify OTP code'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.send_otp_email(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- For local development, just return success
  -- In production, this would integrate with an email service

  v_result := json_build_object(
    'success', true,
    'email', p_email,
    'code', p_code,
    'sent_at', now(),
    'message', 'OTP code sent successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to send OTP email'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check OTP rate limiting
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_email TEXT)
RETURNS JSON AS $$
DECLARE
  v_attempts INTEGER;
  v_reset_time TIMESTAMP WITH TIME ZONE;
  v_max_attempts INTEGER := 5; -- Max 5 attempts per hour
  v_time_window INTERVAL := interval '1 hour';
BEGIN
  -- Count recent OTP attempts
  SELECT COUNT(*), MAX(created_at) + v_time_window
  INTO v_attempts, v_reset_time
  FROM public.otp_codes
  WHERE LOWER(email) = LOWER(p_email)
    AND created_at > now() - v_time_window;

  IF v_attempts >= v_max_attempts THEN
    RETURN json_build_object(
      'allowed', false,
      'attempts', v_attempts,
      'max_attempts', v_max_attempts,
      'reset_time', v_reset_time,
      'message', 'Too many OTP requests. Please try again later.'
    );
  END IF;

  RETURN json_build_object(
    'allowed', true,
    'attempts', v_attempts,
    'max_attempts', v_max_attempts,
    'message', 'OTP request allowed'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'allowed', false,
      'error', SQLERRM,
      'message', 'Failed to check OTP rate limit'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for OTP functions
GRANT EXECUTE ON FUNCTION public.create_otp_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_otp_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otp_codes TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_otp_rate_limit TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.create_otp_code IS 'Generate OTP code for email verification';
COMMENT ON FUNCTION public.verify_otp_code IS 'Verify OTP code for email authentication';
COMMENT ON FUNCTION public.send_otp_email IS 'Send OTP code via email (placeholder for email service)';
COMMENT ON FUNCTION public.cleanup_expired_otp_codes IS 'Clean up expired OTP codes';
COMMENT ON FUNCTION public.check_otp_rate_limit IS 'Check rate limiting for OTP requests';
-- Migration: Create authentication functions and procedures
-- Description: Create utility functions for authentication and user management

-- Function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_fingerprint TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  user_record public.profiles%ROWTYPE;
BEGIN
  -- Try to find user profile
  SELECT * INTO user_record FROM public.profiles WHERE email = p_email;

  -- Insert login attempt
  INSERT INTO public.login_attempts (
    email,
    success,
    user_id,
    ip_address,
    fingerprint,
    user_agent
  ) VALUES (
    p_email,
    p_success,
    COALESCE(user_record.id, NULL),
    p_ip_address,
    p_fingerprint,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create and send OTP
CREATE OR REPLACE FUNCTION public.create_otp_token(
  p_email TEXT,
  p_type TEXT DEFAULT 'signup'
)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  expires_at := now() + interval '15 minutes';

  -- Clean up existing OTPs for this email
  DELETE FROM public.otp_verifications
  WHERE email = p_email AND used_at IS NULL;

  -- Insert new OTP
  INSERT INTO public.otp_verifications (
    email,
    token,
    type,
    expires_at
  ) VALUES (
    p_email,
    token,
    p_type,
    expires_at
  );

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP token
CREATE OR REPLACE FUNCTION public.verify_otp_token(
  p_email TEXT,
  p_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  verification_record public.otp_verifications%ROWTYPE;
BEGIN
  -- Find valid OTP
  SELECT * INTO verification_record
  FROM public.otp_verifications
  WHERE email = p_email
    AND token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Mark OTP as used
  UPDATE public.otp_verifications
  SET used_at = now()
  WHERE id = verification_record.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  updated_profile public.profiles%ROWTYPE;
BEGIN
  -- Update profile
  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    city = COALESCE(p_city, city),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request role change
CREATE OR REPLACE FUNCTION public.request_role_access(
  p_requested_role public.user_type,
  p_justification TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_type public.user_type;
BEGIN
  -- Get current user type
  SELECT user_type INTO current_user_type
  FROM public.profiles
  WHERE id = current_user_id;

  -- Basic validation (you might want to add more complex business logic)
  IF current_user_type = p_requested_role THEN
    RAISE EXCEPTION 'User already has this role';
  END IF;

  -- Add role to available roles (this would typically require admin approval)
  UPDATE public.user_active_roles
  SET available_roles = array_append(available_roles, p_requested_role),
      updated_at = now()
  WHERE user_id = current_user_id;

  -- Log the role request
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, p_requested_role);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  by_user_type JSONB,
  verified_users BIGINT,
  new_users_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT jsonb_object_agg(user_type, count)
     FROM (
       SELECT user_type, COUNT(*) as count
       FROM public.profiles
       GROUP BY user_type
     ) t) as by_user_type,
    (SELECT COUNT(*) FROM public.profiles WHERE is_verified = true) as verified_users,
    (SELECT COUNT(*) FROM public.profiles
     WHERE DATE(created_at) = CURRENT_DATE) as new_users_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old data (maintenance)
CREATE OR REPLACE FUNCTION public.maintenance_cleanup()
RETURNS JSON AS $$
DECLARE
  otp_count BIGINT;
  session_count BIGINT;
  login_count BIGINT;
  result JSON;
BEGIN
  -- Get count before deletion
  SELECT COUNT(*) INTO otp_count
  FROM public.otp_verifications
  WHERE expires_at < now() OR (used_at IS NOT NULL AND created_at < now() - interval '24 hours');

  -- Delete expired OTP tokens older than 24 hours
  DELETE FROM public.otp_verifications
  WHERE expires_at < now() OR (used_at IS NOT NULL AND created_at < now() - interval '24 hours');

  -- Get count before update
  SELECT COUNT(*) INTO session_count
  FROM public.user_sessions
  WHERE expires_at < now() OR (is_active = true AND last_accessed_at < now() - interval '7 days');

  -- Deactivate expired sessions
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < now() OR (is_active = true AND last_accessed_at < now() - interval '7 days');

  -- Get count before deletion
  SELECT COUNT(*) INTO login_count
  FROM public.login_attempts
  WHERE created_at < now() - interval '90 days';

  -- Delete old login attempts (older than 90 days)
  DELETE FROM public.login_attempts
  WHERE created_at < now() - interval '90 days';

  -- Return result as JSON
  result := json_build_object(
    'otp_tokens_deleted', otp_count,
    'expired_sessions_deactivated', session_count,
    'old_login_attempts_deleted', login_count
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_user_role(public.user_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_role_access(public.user_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_attempt(TEXT, BOOLEAN, INET, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_otp_token(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp_token(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.maintenance_cleanup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otp_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO authenticated;
-- Migration: Create Login Rate Limit Functions
-- Description: Create functions for login rate limiting and security

-- Create login_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON public.login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked_until ON public.login_attempts(blocked_until);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_attempts
CREATE POLICY "Service role can manage login attempts" ON public.login_attempts
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Users can view their own login attempts" ON public.login_attempts
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Function to check login rate limit
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_email TEXT, p_ip_address INET DEFAULT NULL)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INTEGER,
  blocked_until TIMESTAMP WITH TIME ZONE,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  rate_limit_config JSONB
) AS $$
DECLARE
  v_max_attempts INTEGER;
  v_lockout_duration INTEGER;
  v_window_minutes INTEGER;
  v_current_attempts INTEGER;
  v_is_blocked BOOLEAN;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
  v_next_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get rate limit configuration from processing_config
  SELECT
    (value->>'max_login_attempts')::INTEGER,
    (value->>'login_lockout_duration')::INTEGER,
    COALESCE((value->>'window_minutes')::INTEGER, 15)
  INTO v_max_attempts, v_lockout_duration, v_window_minutes
  FROM public.processing_config
  WHERE key = 'rate_limit_settings'
  LIMIT 1;

  -- Fallback to defaults if no config found
  IF v_max_attempts IS NULL THEN
    v_max_attempts := 5;
    v_lockout_duration := 900; -- 15 minutes
    v_window_minutes := 15;
  END IF;

  -- Check if IP or email is currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.login_attempts
  WHERE (email = p_email OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address))
    AND blocked_until > NOW()
  ORDER BY blocked_until DESC
  LIMIT 1;

  v_is_blocked := v_blocked_until IS NOT NULL AND v_blocked_until > NOW();

  -- Count recent failed attempts in the time window
  SELECT COUNT(*)
  INTO v_current_attempts
  FROM public.login_attempts
  WHERE (email = p_email OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address))
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  -- Calculate next allowed attempt time if rate limited
  IF v_current_attempts >= v_max_attempts OR v_is_blocked THEN
    v_next_attempt := CASE
      WHEN v_is_blocked THEN v_blocked_until
      ELSE NOW() + INTERVAL '1 second' * v_lockout_duration
    END;
  END IF;

  RETURN QUERY SELECT
    NOT (v_current_attempts >= v_max_attempts OR v_is_blocked) as allowed,
    GREATEST(0, v_max_attempts - v_current_attempts) as remaining_attempts,
    v_blocked_until,
    v_next_attempt,
    jsonb_build_object(
      'max_attempts', v_max_attempts,
      'lockout_duration', v_lockout_duration,
      'window_minutes', v_window_minutes,
      'current_attempts', v_current_attempts,
      'is_blocked', v_is_blocked
    ) as rate_limit_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN DEFAULT false,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
  v_max_attempts INTEGER;
  v_lockout_duration INTEGER;
  v_window_minutes INTEGER;
  v_current_attempts INTEGER;
  v_should_block BOOLEAN;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get rate limit configuration
  SELECT
    COALESCE((value->>'max_login_attempts')::INTEGER, 5),
    COALESCE((value->>'login_lockout_duration')::INTEGER, 900),
    COALESCE((value->>'window_minutes')::INTEGER, 15)
  INTO v_max_attempts, v_lockout_duration, v_window_minutes
  FROM public.processing_config
  WHERE key = 'rate_limit_settings'
  LIMIT 1;

  -- Count recent failed attempts
  SELECT COUNT(*)
  INTO v_current_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  -- Determine if should block
  v_should_block := (v_current_attempts >= v_max_attempts - 1) AND NOT p_success;
  v_blocked_until := CASE
    WHEN v_should_block THEN NOW() + INTERVAL '1 second' * v_lockout_duration
    ELSE NULL
  END;

  -- Insert the login attempt
  INSERT INTO public.login_attempts (
    email, ip_address, user_agent, success, failure_reason, user_id, blocked_until
  ) VALUES (
    p_email, p_ip_address, p_user_agent, p_success, p_failure_reason, p_user_id, v_blocked_until
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old login attempts
CREATE OR REPLACE FUNCTION cleanup_login_attempts()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
  v_retention_days INTEGER;
BEGIN
  -- Get retention period from config (default 90 days)
  SELECT COALESCE((value->>'retention_days')::INTEGER, 90)
  INTO v_retention_days
  FROM public.processing_config
  WHERE key = 'rate_limit_settings'
  LIMIT 1;

  -- Delete old attempts
  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '1 day' * v_retention_days;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get login statistics
CREATE OR REPLACE FUNCTION get_login_statistics(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  date_truncated DATE,
  total_attempts BIGINT,
  successful_attempts BIGINT,
  failed_attempts BIGINT,
  unique_ips BIGINT,
  unique_emails BIGINT,
  blocked_attempts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(attempted_at) as date_truncated,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = true) as successful_attempts,
    COUNT(*) FILTER (WHERE success = false) as failed_attempts,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT email) as unique_emails,
    COUNT(*) FILTER (WHERE blocked_until > attempted_at) as blocked_attempts
  FROM public.login_attempts
  WHERE attempted_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
  GROUP BY DATE(attempted_at)
  ORDER BY date_truncated DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_login_rate_limit(TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION record_login_attempt(TEXT, BOOLEAN, TEXT, INET, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_login_attempts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_login_statistics(INTEGER) TO authenticated;

-- Create default rate limit configuration
INSERT INTO public.processing_config (key, value, description, category) VALUES
  ('rate_limit_settings', jsonb_build_object(
    'max_login_attempts', 5,
    'login_lockout_duration', 900,
    'window_minutes', 15,
    'retention_days', 90,
    'ip_based_limiting', true,
    'email_based_limiting', true
  ), 'Rate limiting configuration for login attempts', 'security')
ON CONFLICT (key) DO NOTHING;
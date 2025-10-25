-- Migration: Enhanced Rate Limiting with Combined Email+IP Tracking
-- Description: Fix rate limiting vulnerability by combining email and IP checks

-- Enhanced rate limiting function that combines email and IP tracking
CREATE OR REPLACE FUNCTION public.check_combined_rate_limit(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_max_attempts INTEGER := 5;
  v_window_minutes INTEGER := 15;
  v_combined_attempts INTEGER;
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
BEGIN
  -- Get rate limit configuration
  SELECT
    COALESCE((value->>'max_login_attempts')::INTEGER, 5),
    COALESCE((value->>'window_minutes')::INTEGER, 15)
  INTO v_max_attempts, v_window_minutes
  FROM public.processing_config
  WHERE key = 'rate_limit_settings'
  LIMIT 1;

  -- Count attempts by email (across all IPs) - prevents IP switching
  SELECT COUNT(*) INTO v_email_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  -- Count attempts by IP (across all emails) - prevents distributed attacks
  SELECT COUNT(*) INTO v_ip_attempts
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  -- Count combined unique email+IP pairs (most restrictive)
  SELECT COUNT(DISTINCT email || '|' || COALESCE(ip_address::TEXT, 'NULL')) INTO v_combined_attempts
  FROM public.login_attempts
  WHERE (email = p_email OR ip_address = p_ip_address)
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  -- Return false if ANY threshold is exceeded
  RETURN NOT (
    v_email_attempts >= v_max_attempts OR
    v_ip_attempts >= v_max_attempts * 2 OR  -- Allow more attempts per IP (for shared networks)
    v_combined_attempts >= v_max_attempts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive rate limiting function with detailed response
CREATE OR REPLACE FUNCTION public.check_login_rate_limit_enhanced(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
) RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INTEGER,
  block_reason TEXT,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  detailed_counts JSONB
) AS $$
DECLARE
  v_max_attempts INTEGER := 5;
  v_window_minutes INTEGER := 15;
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_combined_attempts INTEGER;
  v_block_reason TEXT;
  v_next_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get rate limit configuration
  SELECT
    COALESCE((value->>'max_login_attempts')::INTEGER, 5),
    COALESCE((value->>'window_minutes')::INTEGER, 15)
  INTO v_max_attempts, v_window_minutes
  FROM public.processing_config
  WHERE key = 'rate_limit_settings'
  LIMIT 1;

  -- Count attempts by different dimensions
  SELECT COUNT(*) INTO v_email_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  SELECT COUNT(*) INTO v_ip_attempts
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes;

  -- Find the oldest failed attempt within window to calculate next attempt time
  SELECT attempted_at + INTERVAL '1 minute' * v_window_minutes INTO v_next_attempt
  FROM public.login_attempts
  WHERE (email = p_email OR ip_address = p_ip_address)
    AND success = false
    AND attempted_at > NOW() - INTERVAL '1 minute' * v_window_minutes
  ORDER BY attempted_at DESC
  OFFSET (v_max_attempts - 1)
  LIMIT 1;

  -- Determine block reason
  IF v_email_attempts >= v_max_attempts THEN
    v_block_reason := 'email_rate_limit_exceeded';
  ELSIF v_ip_attempts >= v_max_attempts * 2 THEN
    v_block_reason := 'ip_rate_limit_exceeded';
  ELSIF v_email_attempts + v_ip_attempts >= v_max_attempts * 1.5 THEN
    v_block_reason := 'combined_rate_limit_exceeded';
  END IF;

  RETURN QUERY SELECT
    v_email_attempts < v_max_attempts AND v_ip_attempts < v_max_attempts * 2 as allowed,
    GREATEST(0, v_max_attempts - v_email_attempts) as remaining_attempts,
    v_block_reason,
    v_next_attempt,
    jsonb_build_object(
      'email_attempts', v_email_attempts,
      'ip_attempts', v_ip_attempts,
      'max_attempts', v_max_attempts,
      'window_minutes', v_window_minutes,
      'ip_limit_multiplier', 2
    ) as detailed_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced login attempt recording with better tracking
CREATE OR REPLACE FUNCTION public.record_login_attempt_enhanced(
  p_email TEXT,
  p_success BOOLEAN DEFAULT false,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_fingerprint TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
  v_is_blocked BOOLEAN;
  v_block_reason TEXT;
  v_threat_score INTEGER := 0;
BEGIN
  -- Check if this attempt should be blocked
  SELECT allowed, block_reason INTO v_is_blocked, v_block_reason
  FROM public.check_login_rate_limit_enhanced(p_email, p_ip_address);

  -- Calculate threat score based on various factors
  IF NOT v_is_blocked THEN
    v_threat_score := v_threat_score + 10;  -- Base score for any login attempt

    -- Additional scoring factors
    IF p_failure_reason IN ('invalid_password', 'account_not_found') THEN
      v_threat_score := v_threat_score + 5;
    END IF;

    -- Check for suspicious patterns (multiple emails from same IP in short time)
    PERFORM 1 FROM (
      SELECT COUNT(DISTINCT email) as email_count
      FROM public.login_attempts
      WHERE ip_address = p_ip_address
        AND attempted_at > NOW() - INTERVAL '5 minutes'
        AND success = false
    ) sub
    WHERE sub.email_count > 3;

    IF FOUND THEN
      v_threat_score := v_threat_score + 15;
    END IF;
  END IF;

  -- Insert the enhanced login attempt record
  INSERT INTO public.login_attempts (
    email,
    ip_address,
    user_agent,
    success,
    failure_reason,
    user_id,
    fingerprint,
    attempted_at
  ) VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    CASE
      WHEN v_is_blocked THEN 'rate_limit_blocked: ' || COALESCE(v_block_reason, 'unknown')
      ELSE p_failure_reason
    END,
    p_user_id,
    p_fingerprint,
    NOW()
  )
  RETURNING id INTO v_attempt_id;

  -- Log high threat score attempts to security events
  IF v_threat_score >= 20 THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      ip_address,
      details
    ) VALUES (
      p_user_id,
      'suspicious_login_attempt',
      CASE
        WHEN v_threat_score >= 30 THEN 'high'
        WHEN v_threat_score >= 25 THEN 'medium'
        ELSE 'low'
      END,
      'login_system',
      p_ip_address,
      jsonb_build_object(
        'email', p_email,
        'threat_score', v_threat_score,
        'failure_reason', p_failure_reason,
        'blocked', v_is_blocked,
        'block_reason', v_block_reason,
        'user_agent', p_user_agent,
        'fingerprint', p_fingerprint
      )
    );
  END IF;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get IP reputation and risk scoring
CREATE OR REPLACE FUNCTION public.analyze_ip_reputation(p_ip_address INET)
RETURNS TABLE (
  risk_score INTEGER,
  risk_factors JSONB,
  recommendation TEXT
) AS $$
DECLARE
  v_total_attempts BIGINT;
  v_failed_attempts BIGINT;
  v_unique_emails BIGINT;
  v_recent_blocked BIGINT;
  v_risk_score INTEGER := 0;
  v_risk_factors JSONB := '[]'::jsonb;
BEGIN
  -- Analyze IP history
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE success = false),
    COUNT(DISTINCT email),
    COUNT(*) FILTER (WHERE blocked_until > attempted_at)
  INTO v_total_attempts, v_failed_attempts, v_unique_emails, v_recent_blocked
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND attempted_at > NOW() - INTERVAL '7 days';

  -- Calculate risk factors
  v_risk_factors := v_risk_factors || jsonb_build_object(
    'factor', 'failure_rate',
    'value', CASE WHEN v_total_attempts > 0 THEN (v_failed_attempts::FLOAT / v_total_attempts::FLOAT) * 100 ELSE 0 END,
    'threshold', 50
  );

  IF v_total_attempts > 0 AND (v_failed_attempts::FLOAT / v_total_attempts::FLOAT) > 0.5 THEN
    v_risk_score := v_risk_score + 20;
  END IF;

  v_risk_factors := v_risk_factors || jsonb_build_object(
    'factor', 'unique_email_count',
    'value', v_unique_emails,
    'threshold', 10
  );

  IF v_unique_emails > 10 THEN
    v_risk_score := v_risk_score + 15;
  END IF;

  v_risk_factors := v_risk_factors || jsonb_build_object(
    'factor', 'recent_blocks',
    'value', v_recent_blocked,
    'threshold', 0
  );

  IF v_recent_blocked > 0 THEN
    v_risk_score := v_risk_score + 25;
  END IF;

  v_risk_factors := v_risk_factors || jsonb_build_object(
    'factor', 'total_attempts_7d',
    'value', v_total_attempts,
    'threshold', 100
  );

  IF v_total_attempts > 100 THEN
    v_risk_score := v_risk_score + 10;
  END IF;

  -- Generate recommendation
  RETURN QUERY SELECT
    LEAST(v_risk_score, 100) as risk_score,
    v_risk_factors as risk_factors,
    CASE
      WHEN v_risk_score >= 50 THEN 'block_or_strict_rate_limit'
      WHEN v_risk_score >= 30 THEN 'enhanced_monitoring'
      WHEN v_risk_score >= 15 THEN 'standard_monitoring'
      ELSE 'no_action'
    END as recommendation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for enhanced functions
GRANT EXECUTE ON FUNCTION check_combined_rate_limit(TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION check_login_rate_limit_enhanced(TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION record_login_attempt_enhanced(TEXT, BOOLEAN, TEXT, INET, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_ip_reputation(INET) TO authenticated;

-- Update existing configuration to use enhanced rate limiting
UPDATE public.processing_config
SET value = value || jsonb_build_object(
  'enhanced_rate_limiting', true,
  'ip_limit_multiplier', 2,
  'threat_scoring', true,
  'auto_block_high_risk_ips', true,
  'risk_threshold_block', 50
)
WHERE key = 'rate_limit_settings';
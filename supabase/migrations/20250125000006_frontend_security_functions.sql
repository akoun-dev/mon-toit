-- Migration: Add Frontend Security Validation Functions
-- Description: Server-side validation functions for frontend security

-- Function to verify user access with server-side validation
CREATE OR REPLACE FUNCTION public.verify_user_access(
  p_user_id UUID DEFAULT NULL,
  p_required_roles TEXT[] DEFAULT NULL,
  p_allowed_user_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  has_access BOOLEAN,
  user_role TEXT,
  user_type TEXT,
  access_reason TEXT
) AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_user_type TEXT;
  v_active_role TEXT;
  v_has_access BOOLEAN := false;
  v_access_reason TEXT := 'Access denied';
BEGIN
  -- Get user profile and role
  SELECT p.user_type, uar.active_role
  INTO v_user_type, v_active_role
  FROM public.profiles p
  LEFT JOIN public.user_active_roles uar ON p.id = uar.user_id
  WHERE p.id = v_user_id;

  -- Check if user exists
  IF v_user_id IS NULL OR v_user_type IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, 'User not found'::text;
    RETURN;
  END IF;

  -- Check if MFA is required and valid for admin users
  IF v_user_type = 'admin_ansut' THEN
    -- Verify MFA compliance
    PERFORM public.require_mfa_for_admin();
  END IF;

  -- Check allowed user types
  IF p_allowed_user_types IS NOT NULL THEN
    v_has_access := v_user_type = ANY(p_allowed_user_types);
    IF NOT v_has_access THEN
      v_access_reason := 'User type not allowed: ' || v_user_type;
    END IF;
  END IF;

  -- Check required roles
  IF p_required_roles IS NOT NULL AND (v_has_access OR p_allowed_user_types IS NULL) THEN
    v_has_access := v_active_role = ANY(p_required_roles);
    IF NOT v_has_access THEN
      v_access_reason := 'Role not allowed: ' || COALESCE(v_active_role, 'no_role');
    END IF;
  END IF;

  -- Default access if no specific restrictions
  IF p_allowed_user_types IS NULL AND p_required_roles IS NULL THEN
    v_has_access := true;
    v_access_reason := 'Access granted';
  END IF;

  RETURN QUERY SELECT
    v_has_access,
    v_active_role,
    v_user_type,
    v_access_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify admin access with enhanced security
CREATE OR REPLACE FUNCTION public.verify_admin_access(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  is_admin BOOLEAN,
  mfa_valid BOOLEAN,
  access_reason TEXT
) AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_user_type TEXT;
  v_mfa_valid BOOLEAN := false;
  v_is_admin BOOLEAN := false;
  v_access_reason TEXT := 'Access denied';
BEGIN
  -- Get user type
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = v_user_id;

  -- Check if user exists and is admin
  v_is_admin := (v_user_type = 'admin_ansut');

  IF NOT v_is_admin THEN
    v_access_reason := 'User is not an admin: ' || COALESCE(v_user_type, 'unknown');
    RETURN QUERY SELECT false, false, v_access_reason;
    RETURN;
  END IF;

  -- Verify MFA compliance
  BEGIN
    PERFORM public.require_mfa_for_admin();
    v_mfa_valid := true;
    v_access_reason := 'Admin access granted with valid MFA';
  EXCEPTION WHEN OTHERS THEN
    v_mfa_valid := false;
    v_is_admin := false; -- Deny access if MFA fails
    v_access_reason := 'Admin access denied: MFA required or invalid';
  END;

  RETURN QUERY SELECT v_is_admin, v_mfa_valid, v_access_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role with server verification
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  user_type TEXT,
  is_verified BOOLEAN,
  permissions JSONB
) AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_user_type TEXT;
  v_active_role TEXT;
  v_is_verified BOOLEAN;
  v_permissions JSONB := '[]'::jsonb;
BEGIN
  -- Get user profile
  SELECT p.user_type, p.is_verified, uar.active_role
  INTO v_user_type, v_is_verified, v_active_role
  FROM public.profiles p
  LEFT JOIN public.user_active_roles uar ON p.id = uar.user_id
  WHERE p.id = v_user_id;

  -- Build permissions based on role
  CASE v_active_role
    WHEN 'admin_ansut' THEN
      v_permissions := jsonb_build_array(
        'user_management', 'property_management', 'system_config',
        'analytics', 'security_admin', 'all_access'
      );
    WHEN 'proprietaire' THEN
      v_permissions := jsonb_build_array(
        'property_management', 'tenant_management', 'analytics_view'
      );
    WHEN 'agence' THEN
      v_permissions := jsonb_build_array(
        'property_management', 'client_management', 'analytics_view'
      );
    WHEN 'locataire' THEN
      v_permissions := jsonb_build_array(
        'search_properties', 'save_favorites', 'contact_owners'
      );
    WHEN 'tiers_de_confiance' THEN
      v_permissions := jsonb_build_array(
        'verification_services', 'dispute_resolution', 'document_signing'
      );
    ELSE
      v_permissions := jsonb_build_array('basic_access');
  END CASE;

  RETURN QUERY SELECT
    v_user_id,
    COALESCE(v_active_role, 'locataire'),
    COALESCE(v_user_type, 'locataire'),
    COALESCE(v_is_verified, false),
    v_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get MFA policy with server validation
CREATE OR REPLACE FUNCTION public.get_user_mfa_policy(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  mfa_required BOOLEAN,
  grace_period_hours INTEGER,
  last_mfa_verification TIMESTAMP WITH TIME ZONE,
  policy_type TEXT
) AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_user_type TEXT;
  v_mfa_required BOOLEAN := false;
  v_grace_period INTEGER := 24; -- 24 hours default
  v_last_mfa TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user type
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = v_user_id;

  -- Determine MFA requirements based on user type
  CASE v_user_type
    WHEN 'admin_ansut' THEN
      v_mfa_required := true;
      v_grace_period := 1; -- 1 hour for admins
    WHEN 'proprietaire' THEN
      v_mfa_required := false; -- Optional for owners
      v_grace_period := 168; -- 1 week
    WHEN 'agence' THEN
      v_mfa_required := false; -- Optional for agencies
      v_grace_period := 168; -- 1 week
    ELSE
      v_mfa_required := false;
      v_grace_period := 720; -- 30 days for others
  END CASE;

  -- Get last MFA verification
  SELECT (raw_user_meta_data->>'last_mfa_verification')::timestamp with time zone
  INTO v_last_mfa
  FROM auth.users
  WHERE id = v_user_id;

  RETURN QUERY SELECT
    v_mfa_required,
    v_grace_period,
    v_last_mfa,
    CASE
      WHEN v_user_type = 'admin_ansut' THEN 'mandatory'
      WHEN v_user_type IN ('proprietaire', 'agence') THEN 'recommended'
      ELSE 'optional'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events from frontend
CREATE OR REPLACE FUNCTION public.log_frontend_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    source,
    ip_address,
    user_agent,
    details
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_severity,
    'frontend',
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_details
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate redirect URLs
CREATE OR REPLACE FUNCTION public.validate_redirect_url(p_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_parsed_url TEXT;
  v_domain TEXT;
BEGIN
  -- Basic validation
  IF p_url IS NULL OR p_url = '' THEN
    RETURN false;
  END IF;

  -- Parse the URL
  BEGIN
    v_parsed_url := p_url;

    -- Check for dangerous protocols
    IF v_parsed_url ~* '^(javascript:|data:|vbscript:|file:)' THEN
      RETURN false;
    END IF;

    -- Extract domain if full URL
    IF v_parsed_url ~* '^https?://([^/]+)' THEN
      v_domain := regexp_replace(v_parsed_url, '^https?://([^/]+).*', '\1');

      -- Allow only specific domains
      IF v_domain ~* '\.(mon-toit\.ci|localhost|127\.0\.0\.1)$' THEN
        RETURN true;
      END IF;

      RETURN false;
    END IF;

    -- Allow relative URLs
    IF v_parsed_url ~* '^/[a-zA-Z0-9/_-]*$' THEN
      RETURN true;
    END IF;

    -- Allow safe relative paths
    IF v_parsed_url ~* '^/(dashboard|admin|profile|settings|explorer|auth)' THEN
      RETURN true;
    END IF;

    RETURN false;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for security functions
GRANT EXECUTE ON FUNCTION verify_user_access(UUID, TEXT[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_mfa_policy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_frontend_security_event(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_redirect_url(TEXT) TO authenticated;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_type ON public.security_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_profiles_type_verified ON public.profiles(user_type, is_verified);

-- Add comments
COMMENT ON FUNCTION verify_user_access IS 'Validates user access with server-side security checks';
COMMENT ON FUNCTION verify_admin_access IS 'Enhanced admin verification with MFA validation';
COMMENT ON FUNCTION get_user_role IS 'Returns user role and permissions with server verification';
COMMENT ON FUNCTION get_user_mfa_policy IS 'Returns MFA policy with server validation';
COMMENT ON FUNCTION log_frontend_security_event IS 'Logs security events from frontend with proper validation';
COMMENT ON FUNCTION validate_redirect_url IS 'Validates redirect URLs against open redirect attacks';
-- Migration: Create Admin MFA Functions
-- Description: Create functions for admin MFA compliance checking

-- Function to check admin MFA compliance
CREATE OR REPLACE FUNCTION check_admin_mfa_compliance(p_admin_id UUID)
RETURNS TABLE (
  admin_id UUID,
  is_compliant BOOLEAN,
  has_mfa_enabled BOOLEAN,
  last_mfa_verification TIMESTAMP WITH TIME ZONE,
  requirements_met JSONB,
  compliance_score NUMERIC
) AS $$
DECLARE
  v_admin_profile RECORD;
  v_mfa_enabled BOOLEAN := false;
  v_last_mfa_verification TIMESTAMP WITH TIME ZONE := NULL;
  v_requirements_met JSONB := '[]'::jsonb;
  v_compliance_score NUMERIC := 0.0;
BEGIN
  -- Get admin profile
  SELECT * INTO v_admin_profile
  FROM public.profiles
  WHERE id = p_admin_id AND user_type = 'admin_ansut';

  IF v_admin_profile IS NULL THEN
    RETURN QUERY SELECT
      p_admin_id,
      false as is_compliant,
      false as has_mfa_enabled,
      NULL as last_mfa_verification,
      '[]'::jsonb as requirements_met,
      0.0 as compliance_score;
    RETURN;
  END IF;

  -- Check if MFA is enabled (this would typically check auth.users.mfa_factors)
  -- For now, we'll simulate MFA checking based on user metadata
  SELECT
    (user_metadata->>'mfa_enabled')::BOOLEAN IS NOT NULL
    AND (user_metadata->>'mfa_enabled')::BOOLEAN = true
  INTO v_mfa_enabled
  FROM auth.users
  WHERE id = p_admin_id;

  -- Get last MFA verification (this would typically come from auth.mfa_challenges)
  SELECT
    CASE
      WHEN user_metadata->>'last_mfa_verification' IS NOT NULL
      THEN (user_metadata->>'last_mfa_verification')::TIMESTAMP WITH TIME ZONE
      ELSE NULL
    END
  INTO v_last_mfa_verification
  FROM auth.users
  WHERE id = p_admin_id;

  -- Build requirements array
  v_requirements_met := jsonb_build_array(
    jsonb_build_object(
      'requirement', 'verified_admin',
      'met', v_admin_profile.is_verified,
      'description', 'Admin account must be verified'
    ),
    jsonb_build_object(
      'requirement', 'oneci_verified',
      'met', v_admin_profile.oneci_verified,
      'description', 'ONECI verification required for admins'
    ),
    jsonb_build_object(
      'requirement', 'cnam_verified',
      'met', v_admin_profile.cnam_verified,
      'description', 'CNAM verification required for admins'
    ),
    jsonb_build_object(
      'requirement', 'face_verified',
      'met', v_admin_profile.face_verified,
      'description', 'Face verification required for admins'
    ),
    jsonb_build_object(
      'requirement', 'mfa_enabled',
      'met', COALESCE(v_mfa_enabled, false),
      'description', 'Multi-factor authentication must be enabled'
    ),
    jsonb_build_object(
      'requirement', 'recent_mfa',
      'met', v_last_mfa_verification > (CURRENT_TIMESTAMP - INTERVAL '24 hours'),
      'description', 'MFA verification within last 24 hours'
    )
  );

  -- Calculate compliance score
  SELECT
    (COUNT(*) FILTER (WHERE met = true)::NUMERIC / COUNT(*)::NUMERIC) * 100
  INTO v_compliance_score
  FROM jsonb_array_elements(v_requirements_met) req;

  -- Determine overall compliance
  RETURN QUERY SELECT
    p_admin_id as admin_id,
    (
      v_admin_profile.is_verified
      AND v_admin_profile.oneci_verified
      AND v_admin_profile.cnam_verified
      AND v_admin_profile.face_verified
      AND COALESCE(v_mfa_enabled, false)
      AND (v_last_mfa_verification > (CURRENT_TIMESTAMP - INTERVAL '24 hours'))
    ) as is_compliant,
    COALESCE(v_mfa_enabled, false) as has_mfa_enabled,
    v_last_mfa_verification as last_mfa_verification,
    v_requirements_met as requirements_met,
    v_compliance_score as compliance_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all admins MFA compliance status
CREATE OR REPLACE FUNCTION get_admins_mfa_compliance()
RETURNS TABLE (
  admin_id UUID,
  email TEXT,
  full_name TEXT,
  is_compliant BOOLEAN,
  has_mfa_enabled BOOLEAN,
  last_mfa_verification TIMESTAMP WITH TIME ZONE,
  compliance_score NUMERIC,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as admin_id,
    u.email,
    p.full_name,
    comp.is_compliant,
    comp.has_mfa_enabled,
    comp.last_mfa_verification,
    comp.compliance_score,
    u.last_sign_in_at as last_login
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  CROSS JOIN LATERAL check_admin_mfa_compliance(p.id) comp
  WHERE p.user_type = 'admin_ansut'
  ORDER BY comp.compliance_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to require MFA for admin operations
CREATE OR REPLACE FUNCTION require_admin_mfa(p_admin_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID := COALESCE(p_admin_id, auth.uid());
  v_compliance RECORD;
BEGIN
  -- Get compliance status
  SELECT * INTO v_compliance
  FROM check_admin_mfa_compliance(v_admin_id)
  LIMIT 1;

  -- Raise exception if not compliant
  IF NOT v_compliance.is_compliant THEN
    RAISE EXCEPTION 'Admin MFA compliance required. Current compliance score: %', v_compliance.compliance_score;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_admin_mfa_compliance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admins_mfa_compliance() TO authenticated;
GRANT EXECUTE ON FUNCTION require_admin_mfa(UUID) TO authenticated;

-- Create RLS policy for admin MFA functions
-- Note: Functions use SECURITY DEFINER, so they run with elevated privileges
-- But we still need to ensure only admins can access other admins' data
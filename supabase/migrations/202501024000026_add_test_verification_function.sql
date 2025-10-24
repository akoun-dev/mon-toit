-- Migration: Add test version of verification status function
-- Description: Create function for testing without authentication

CREATE OR REPLACE FUNCTION public.get_verification_status_test(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, '0ecda2a5-0479-483c-98af-c502607f459f');
  v_profile RECORD;
  v_properties_count INTEGER;
  v_verification_result JSON;
BEGIN
  -- Get user profile information
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'verified', false,
      'verification_level', 'none',
      'message', 'Profile not found',
      'data', json_build_object()
    );
  END IF;

  -- Count user's properties
  SELECT COUNT(*) INTO v_properties_count
  FROM public.properties
  WHERE owner_id = v_user_id;

  -- Build verification status
  v_verification_result := json_build_object(
    'user_id', v_user_id,
    'verified', COALESCE(v_profile.is_verified, false),
    'verification_level',
      CASE
        WHEN COALESCE(v_profile.is_verified, false) THEN 'verified'
        WHEN v_profile.oneci_verified THEN 'oneci_verified'
        WHEN v_profile.cnam_verified THEN 'cnam_verified'
        WHEN v_profile.face_verified THEN 'face_verified'
        WHEN v_profile.user_type = 'admin_ansut' THEN 'admin'
        WHEN v_profile.user_type = 'tiers_de_confiance' THEN 'trusted_third_party'
        WHEN v_properties_count > 0 THEN 'property_owner'
        WHEN v_profile.full_name IS NOT NULL AND v_profile.phone IS NOT NULL THEN 'basic'
        ELSE 'none'
      END,
    'user_type', v_profile.user_type,
    'profile_completeness',
      CASE
        WHEN v_profile.full_name IS NOT NULL AND
             v_profile.phone IS NOT NULL AND
             v_profile.bio IS NOT NULL THEN 'complete'
        WHEN v_profile.full_name IS NOT NULL AND
             v_profile.phone IS NOT NULL THEN 'partial'
        ELSE 'incomplete'
      END,
    'verification_data', json_build_object(
      'full_name', v_profile.full_name,
      'phone', v_profile.phone,
      'avatar_url', v_profile.avatar_url,
      'bio', v_profile.bio,
      'city', v_profile.city,
      'user_type', v_profile.user_type,
      'is_verified', v_profile.is_verified,
      'oneci_verified', v_profile.oneci_verified,
      'cnam_verified', v_profile.cnam_verified,
      'face_verified', v_profile.face_verified,
      'properties_count', v_properties_count,
      'ui_density', v_profile.ui_density,
      'created_at', v_profile.created_at,
      'updated_at', v_profile.updated_at
    ),
    'message',
      CASE
        WHEN COALESCE(v_profile.is_verified, false) THEN 'Account fully verified'
        WHEN v_profile.oneci_verified THEN 'ONECI verified'
        WHEN v_profile.cnam_verified THEN 'CNAM verified'
        WHEN v_profile.face_verified THEN 'Face verified'
        WHEN v_profile.user_type = 'admin_ansut' THEN 'Administrator account'
        WHEN v_profile.user_type = 'tiers_de_confiance' THEN 'Third-party trust account'
        WHEN v_properties_count > 0 THEN 'Property owner - verification available'
        WHEN v_profile.full_name IS NOT NULL AND v_profile.phone IS NOT NULL THEN 'Basic profile complete'
        ELSE 'Please complete your profile'
      END,
    'created_at', now()
  );

  RETURN v_verification_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'verified', false,
      'verification_level', 'error',
      'message', 'Error fetching verification status: ' || SQLERRM,
      'error_code', SQLSTATE,
      'created_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for testing
GRANT EXECUTE ON FUNCTION public.get_verification_status_test TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verification_status_test TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_verification_status_test IS 'Test version of verification status function';
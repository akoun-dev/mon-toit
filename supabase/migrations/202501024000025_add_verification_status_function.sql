-- Migration: Add get_my_verification_status RPC function
-- Description: Create function to get user verification status

CREATE OR REPLACE FUNCTION public.get_my_verification_status()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
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

  -- Build verification status based on user type and data completeness
  v_verification_result := json_build_object(
    'user_id', v_user_id,
    'verified', v_profile.is_verified or false,
    'verification_level',
      CASE
        WHEN v_profile.is_verified THEN 'verified'
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
    'requirements', json_build_object(
      'has_full_name', v_profile.full_name IS NOT NULL,
      'has_phone', v_profile.phone IS NOT NULL,
      'has_bio', v_profile.bio IS NOT NULL,
      'has_avatar', v_profile.avatar_url IS NOT NULL,
      'is_verified', v_profile.is_verified,
      'oneci_verified', v_profile.oneci_verified,
      'cnam_verified', v_profile.cnam_verified,
      'face_verified', v_profile.face_verified,
      'has_properties', v_properties_count > 0
    ),
    'next_steps',
      CASE
        WHEN v_profile.is_verified THEN json_build_array()
        WHEN v_properties_count > 0 THEN json_build_array('Request professional verification')
        WHEN v_profile.full_name IS NULL OR v_profile.phone IS NULL THEN
          json_build_array('Complete profile information')
        ELSE json_build_array('Add properties to your account')
      END,
    'message',
      CASE
        WHEN v_profile.is_verified THEN 'Account fully verified'
        WHEN v_profile.oneci_verified THEN 'ONECI verified'
        WHEN v_profile.cnam_verified THEN 'CNAM verified'
        WHEN v_profile.face_verified THEN 'Face verified'
        WHEN v_profile.user_type = 'admin_ansut' THEN 'Administrator account'
        WHEN v_profile.user_type = 'tiers_de_confiance' THEN 'Third-party trust account'
        WHEN v_properties_count > 0 THEN 'Property owner - verification available'
        WHEN v_profile.full_name IS NOT NULL AND v_profile.phone IS NOT NULL THEN 'Basic profile complete'
        ELSE 'Please complete your profile'
      END,
    'created_at', now(),
    'cache_expires', now() + interval '5 minutes'
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_my_verification_status TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_my_verification_status IS 'Get comprehensive verification status for the current user';
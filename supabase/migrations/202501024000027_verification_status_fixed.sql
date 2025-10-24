-- Migration: Fixed verification status function
-- Description: Create corrected version without field name conflicts

CREATE OR REPLACE FUNCTION public.get_user_verification_status(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, '0ecda2a5-0479-483c-98af-c502607f459f');
  v_user_record RECORD;
  v_properties_count INTEGER;
  v_result JSON;
BEGIN
  -- Get user profile information with correct field names
  SELECT
    id, full_name, phone, avatar_url, bio, city, user_type,
    is_verified, oneci_verified, cnam_verified, face_verified,
    ui_density, created_at, updated_at
  INTO v_user_record
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'verified', false,
      'verification_level', 'none',
      'message', 'User profile not found',
      'user_id', v_user_id
    );
  END IF;

  -- Count user's properties
  SELECT COUNT(*) INTO v_properties_count
  FROM public.properties
  WHERE owner_id = v_user_id;

  -- Build verification result
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'verified', COALESCE(v_user_record.is_verified, false),
    'verification_level',
      CASE
        WHEN COALESCE(v_user_record.is_verified, false) THEN 'verified'
        WHEN COALESCE(v_user_record.oneci_verified, false) THEN 'oneci_verified'
        WHEN COALESCE(v_user_record.cnam_verified, false) THEN 'cnam_verified'
        WHEN COALESCE(v_user_record.face_verified, false) THEN 'face_verified'
        WHEN v_user_record.user_type = 'admin_ansut' THEN 'admin'
        WHEN v_user_record.user_type = 'tiers_de_confiance' THEN 'trusted_third_party'
        WHEN v_properties_count > 0 THEN 'property_owner'
        WHEN v_user_record.full_name IS NOT NULL AND v_user_record.phone IS NOT NULL THEN 'basic'
        ELSE 'none'
      END,
    'user_type', v_user_record.user_type,
    'profile_completeness',
      CASE
        WHEN v_user_record.full_name IS NOT NULL AND
             v_user_record.phone IS NOT NULL AND
             v_user_record.bio IS NOT NULL THEN 'complete'
        WHEN v_user_record.full_name IS NOT NULL AND
             v_user_record.phone IS NOT NULL THEN 'partial'
        ELSE 'incomplete'
      END,
    'verification_data', json_build_object(
      'full_name', v_user_record.full_name,
      'phone', v_user_record.phone,
      'avatar_url', v_user_record.avatar_url,
      'bio', v_user_record.bio,
      'city', v_user_record.city,
      'user_type', v_user_record.user_type,
      'is_verified', v_user_record.is_verified,
      'oneci_verified', v_user_record.oneci_verified,
      'cnam_verified', v_user_record.cnam_verified,
      'face_verified', v_user_record.face_verified,
      'properties_count', v_properties_count,
      'ui_density', v_user_record.ui_density,
      'created_at', v_user_record.created_at,
      'updated_at', v_user_record.updated_at
    ),
    'message',
      CASE
        WHEN COALESCE(v_user_record.is_verified, false) THEN 'Account fully verified'
        WHEN COALESCE(v_user_record.oneci_verified, false) THEN 'ONECI verified'
        WHEN COALESCE(v_user_record.cnam_verified, false) THEN 'CNAM verified'
        WHEN COALESCE(v_user_record.face_verified, false) THEN 'Face verified'
        WHEN v_user_record.user_type = 'admin_ansut' THEN 'Administrator account'
        WHEN v_user_record.user_type = 'tiers_de_confiance' THEN 'Third-party trust account'
        WHEN v_properties_count > 0 THEN 'Property owner - verification available'
        WHEN v_user_record.full_name IS NOT NULL AND v_user_record.phone IS NOT NULL THEN 'Basic profile complete'
        ELSE 'Please complete your profile'
      END,
    'created_at', now()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'verified', false,
      'verification_level', 'error',
      'message', 'Error: ' || SQLERRM,
      'error_code', SQLSTATE,
      'user_id', v_user_id,
      'created_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_verification_status TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_user_verification_status IS 'Get user verification status with correct field mapping';
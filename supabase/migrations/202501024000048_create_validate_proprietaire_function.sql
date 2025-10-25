-- Create validate_proprietaire_prerequisites function
-- This function validates if a user can upgrade to proprietaire role

CREATE OR REPLACE FUNCTION validate_proprietaire_prerequisites(p_user_id UUID)
RETURNS TABLE (
  can_upgrade BOOLEAN,
  missing_requirements TEXT[],
  completion_percentage INTEGER,
  current_step INTEGER,
  total_steps INTEGER,
  verification_status JSONB,
  recommendations TEXT[]
) AS $$
DECLARE
  v_profile RECORD;
  v_user_verification RECORD;
  v_missing_requirements TEXT[] := '{}';
  v_completion_percentage INTEGER := 0;
  v_current_step INTEGER := 0;
  v_total_steps INTEGER := 5;
  v_verification_status JSONB := '{}';
  v_recommendations TEXT[] := '{}';
  v_can_upgrade BOOLEAN;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['User not found']::TEXT[], 0, 0, 5, '{}'::JSONB, ARRAY['Please complete your profile first']::TEXT[];
  END IF;

  -- Step 1: Check basic profile completion (20%)
  v_total_steps := 5;
  IF v_profile.full_name IS NOT NULL AND v_profile.phone IS NOT NULL AND v_profile.city IS NOT NULL THEN
    v_current_step := 1;
    v_completion_percentage := 20;
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Complete profile information (name, phone, city)']::TEXT[]);
  END IF;

  -- Step 2: Check email verification (20%)
  IF v_profile.is_verified = true THEN
    v_current_step := GREATEST(v_current_step, 2);
    v_completion_percentage := GREATEST(v_completion_percentage, 40);
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Verify your email address']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Check your email and click the verification link']::TEXT[]);
  END IF;

  -- Step 3: Check ONECI verification (20%)
  SELECT * INTO v_user_verification
  FROM public.user_verifications
  WHERE user_id = p_user_id;

  IF v_user_verification IS NOT NULL AND v_user_verification.oneci_status = 'verified' THEN
    v_current_step := GREATEST(v_current_step, 3);
    v_completion_percentage := GREATEST(v_completion_percentage, 60);
    v_verification_status := jsonb_build_object('oneci', 'verified');
  ELSIF v_user_verification IS NOT NULL AND v_user_verification.oneci_status = 'pending' THEN
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Complete ONECI verification']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Submit your ONECI documents for verification']::TEXT[]);
    v_verification_status := jsonb_build_object('oneci', 'pending');
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Start ONECI verification process']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Begin ONECI identity verification to enhance your profile trust level']::TEXT[]);
    v_verification_status := jsonb_build_object('oneci', 'not_started');
  END IF;

  -- Step 4: Check CNAM verification (20%)
  IF v_user_verification IS NOT NULL AND v_user_verification.cnam_status = 'verified' THEN
    v_current_step := GREATEST(v_current_step, 4);
    v_completion_percentage := GREATEST(v_completion_percentage, 80);
    v_verification_status := jsonb_set(v_verification_status, '{cnam}', 'verified');
  ELSIF v_user_verification IS NOT NULL AND v_user_verification.cnam_status = 'pending' THEN
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Complete CNAM verification']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Submit your CNAM documents for professional verification']::TEXT[]);
    v_verification_status := jsonb_set(v_verification_status, '{cnam}', 'pending');
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Consider CNAM verification for higher trust level']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Optional: Complete CNAM professional verification for increased credibility']::TEXT[]);
    v_verification_status := jsonb_set(v_verification_status, '{cnam}', 'not_started');
  END IF;

  -- Step 5: Check face verification (20%)
  IF v_user_verification IS NOT NULL AND v_user_verification.face_status = 'verified' THEN
    v_current_step := GREATEST(v_current_step, 5);
    v_completion_percentage := GREATEST(v_completion_percentage, 100);
    v_verification_status := jsonb_set(v_verification_status, '{face}', 'verified');
  ELSIF v_user_verification IS NOT NULL AND v_user_verification.face_status = 'pending' THEN
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Complete face verification']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Complete biometric face verification for maximum security']::TEXT[]);
    v_verification_status := jsonb_set(v_verification_status, '{face}', 'pending');
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, ARRAY['Consider face verification for enhanced security']::TEXT[]);
    v_recommendations := array_append(v_recommendations, ARRAY['Optional: Complete face verification for maximum account security']::TEXT[]);
    v_verification_status := jsonb_set(v_verification_status, '{face}', 'not_started');
  END IF;

  -- Determine if user can upgrade
  v_can_upgrade := (v_completion_percentage >= 60); -- Minimum 60% to allow upgrade

  RETURN QUERY
  SELECT
    v_can_upgrade as can_upgrade,
    v_missing_requirements as missing_requirements,
    v_completion_percentage as completion_percentage,
    v_current_step as current_step,
    v_total_steps as total_steps,
    v_verification_status as verification_status,
    v_recommendations as recommendations;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, ARRAY['Error validating prerequisites']::TEXT[], 0, 0, 5, '{}'::JSONB, ARRAY['Please try again later']::TEXT[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_proprietaire_prerequisites(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION validate_proprietaire_prerequisites IS 'Validates if a user meets requirements to become a proprietaire (property owner)';
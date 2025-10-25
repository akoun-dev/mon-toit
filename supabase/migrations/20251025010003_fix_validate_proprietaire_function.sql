-- Fix validate_proprietaire_prerequisites function
-- This migration fixes the issues in the validation function

-- Drop the existing function
DROP FUNCTION IF EXISTS public.validate_proprietaire_prerequisites(UUID);

-- Recreate the function with all fixes applied
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
  v_verification_status JSONB := '{}'::jsonb;
  v_recommendations TEXT[] := '{}';
  v_can_upgrade BOOLEAN;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['User not found']::TEXT[], 0, 0, 5, '{}'::JSONB, ARRAY['Please complete your profile first']::TEXT[];
    RETURN;
  END IF;

  -- Step 1: Check basic profile completion (20%)
  IF v_profile.full_name IS NOT NULL AND v_profile.phone IS NOT NULL AND v_profile.city IS NOT NULL THEN
    v_current_step := 1;
    v_completion_percentage := 20;
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, 'Complete profile information (name, phone, city)');
  END IF;

  -- Step 2: Check email verification (20%)
  IF v_profile.is_verified = true THEN
    v_current_step := GREATEST(v_current_step, 2);
    v_completion_percentage := GREATEST(v_completion_percentage, 40);
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, 'Verify your email address');
    v_recommendations := array_append(v_recommendations, 'Check your email and click the verification link');
  END IF;

  -- Step 3: Check ONECI verification (20%)
  SELECT * INTO v_user_verification
  FROM public.user_verifications
  WHERE user_id = p_user_id;

  IF v_user_verification IS NOT NULL AND v_user_verification.oneci_status = 'verified'::public.verification_status THEN
    v_current_step := GREATEST(v_current_step, 3);
    v_completion_percentage := GREATEST(v_completion_percentage, 60);
    v_verification_status := v_verification_status || '{"oneci": "verified"}'::jsonb;
  ELSIF v_user_verification IS NOT NULL AND v_user_verification.oneci_status = 'pending'::public.verification_status THEN
    v_missing_requirements := array_append(v_missing_requirements, 'Complete ONECI verification');
    v_recommendations := array_append(v_recommendations, 'Submit your ONECI documents for verification');
    v_verification_status := v_verification_status || '{"oneci": "pending"}'::jsonb;
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, 'Start ONECI verification process');
    v_recommendations := array_append(v_recommendations, 'Begin ONECI identity verification to enhance your profile trust level');
    v_verification_status := v_verification_status || '{"oneci": "not_started"}'::jsonb;
  END IF;

  -- Step 4: Check CNAM verification (20%)
  IF v_user_verification IS NOT NULL AND v_user_verification.cnam_status = 'verified'::public.verification_status THEN
    v_current_step := GREATEST(v_current_step, 4);
    v_completion_percentage := GREATEST(v_completion_percentage, 80);
    v_verification_status := v_verification_status || '{"cnam": "verified"}'::jsonb;
  ELSIF v_user_verification IS NOT NULL AND v_user_verification.cnam_status = 'pending'::public.verification_status THEN
    v_missing_requirements := array_append(v_missing_requirements, 'Complete CNAM verification');
    v_recommendations := array_append(v_recommendations, 'Submit your CNAM documents for professional verification');
    v_verification_status := v_verification_status || '{"cnam": "pending"}'::jsonb;
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, 'Consider CNAM verification for higher trust level');
    v_recommendations := array_append(v_recommendations, 'Optional: Complete CNAM professional verification for increased credibility');
    v_verification_status := v_verification_status || '{"cnam": "not_started"}'::jsonb;
  END IF;

  -- Step 5: Check face verification (20%)
  IF v_user_verification IS NOT NULL AND v_user_verification.face_status = 'verified'::public.verification_status THEN
    v_current_step := GREATEST(v_current_step, 5);
    v_completion_percentage := GREATEST(v_completion_percentage, 100);
    v_verification_status := v_verification_status || '{"face": "verified"}'::jsonb;
  ELSIF v_user_verification IS NOT NULL AND v_user_verification.face_status = 'pending'::public.verification_status THEN
    v_missing_requirements := array_append(v_missing_requirements, 'Complete face verification');
    v_recommendations := array_append(v_recommendations, 'Complete biometric face verification for maximum security');
    v_verification_status := v_verification_status || '{"face": "pending"}'::jsonb;
  ELSE
    v_missing_requirements := array_append(v_missing_requirements, 'Consider face verification for enhanced security');
    v_recommendations := array_append(v_recommendations, 'Optional: Complete face verification for maximum account security');
    v_verification_status := v_verification_status || '{"face": "not_started"}'::jsonb;
  END IF;

  -- Determine if user can upgrade (minimum 60% for basic upgrade, 80% for premium)
  v_can_upgrade := (v_completion_percentage >= 60);

  -- Log the validation attempt for security monitoring
  PERFORM public.log_security_access(
    'user_verifications',
    'validate_proprietaire_prerequisites',
    p_user_id,
    jsonb_build_object(
      'completion_percentage', v_completion_percentage,
      'can_upgrade', v_can_upgrade,
      'missing_count', array_length(v_missing_requirements, 1)
    )
  );

  RETURN QUERY
  SELECT
    v_can_upgrade as can_upgrade,
    v_missing_requirements as missing_requirements,
    v_completion_percentage as completion_percentage,
    v_current_step as current_step,
    5 as total_steps,
    v_verification_status as verification_status,
    v_recommendations as recommendations;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    PERFORM public.log_security_access(
      'user_verifications',
      'validate_proprietaire_error',
      p_user_id,
      jsonb_build_object(
        'error_message', SQLERRM,
        'error_code', SQLSTATE
      )
    );

    -- Return a safe error response
    RETURN QUERY
    SELECT false, ARRAY['Error validating prerequisites']::TEXT[], 0, 0, 5,
           '{"error": "validation_failed"}'::JSONB,
           ARRAY['Please try again later or contact support']::TEXT[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_proprietaire_prerequisites(UUID) TO authenticated;

-- Add comprehensive comment
COMMENT ON FUNCTION validate_proprietaire_prerequisites IS 'Validates if a user meets requirements to become a proprietaire (property owner). Returns detailed progress information and recommendations.';

DO $$
BEGIN
  RAISE NOTICE '✓ validate_proprietaire_prerequisites function fixed successfully';
END $$;
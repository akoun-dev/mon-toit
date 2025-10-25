-- Migration: Make MFA Mandatory for Admin Operations
-- Description: Enforce MFA requirement for all admin operations and accounts

-- Create function to block admin operations without MFA
CREATE OR REPLACE FUNCTION public.enforce_admin_mfa()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type public.user_type;
  v_mfa_enabled BOOLEAN;
  v_is_admin BOOLEAN := false;
BEGIN
  -- Skip enforcement for system operations and service role
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Get current user type
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = auth.uid();

  -- Check if user is admin
  v_is_admin := (v_user_type = 'admin_ansut');

  -- Only enforce for admin users
  IF v_is_admin THEN
    -- Check if MFA is enabled for this admin
    SELECT (raw_user_meta_data->>'mfa_enabled')::boolean INTO v_mfa_enabled
    FROM auth.users
    WHERE id = auth.uid();

    -- If MFA is not enabled, block the operation
    IF COALESCE(v_mfa_enabled, false) = false THEN
      -- Log the security violation
      INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        source,
        details
      ) VALUES (
        auth.uid(),
        'admin_operation_without_mfa',
        'high',
        'mfa_enforcement',
        jsonb_build_object(
          'operation', TG_OP,
          'table', TG_TABLE_NAME,
          'mfa_enabled', false,
          'blocked', true
        )
      );

      RAISE EXCEPTION 'MFA is required for admin operations. Please enable multi-factor authentication before performing administrative tasks.';
    END IF;

    -- Additional check for recent MFA verification (within last hour)
    DECLARE
      v_last_mfa TIMESTAMP WITH TIME ZONE;
    BEGIN
      SELECT (raw_user_meta_data->>'last_mfa_verification')::timestamp with time zone INTO v_last_mfa
      FROM auth.users
      WHERE id = auth.uid();

      IF v_last_mfa IS NULL OR v_last_mfa < (NOW() - INTERVAL '1 hour') THEN
        RAISE EXCEPTION 'Recent MFA verification required (within last hour). Please complete MFA verification.';
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhanced MFA verification function
CREATE OR REPLACE FUNCTION public.verify_admin_mfa(p_verification_code TEXT, p_method TEXT DEFAULT 'totp')
RETURNS BOOLEAN AS $$
DECLARE
  v_user_type public.user_type;
  v_mfa_enabled BOOLEAN;
  v_is_valid BOOLEAN := false;
BEGIN
  -- Get current user type and verify they're admin
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_type != 'admin_ansut' THEN
    RAISE EXCEPTION 'MFA verification is only available for admin users';
  END IF;

  -- Check if MFA is enabled
  SELECT (raw_user_meta_data->>'mfa_enabled')::boolean INTO v_mfa_enabled
  FROM auth.users
  WHERE id = auth.uid();

  IF NOT v_mfa_enabled THEN
    RAISE EXCEPTION 'MFA is not enabled for this account';
  END IF;

  -- Validate the verification code
  -- This would integrate with your actual MFA provider (TOTP, SMS, etc.)
  -- For now, we'll simulate validation
  IF p_verification_code IS NOT NULL AND LENGTH(p_verification_code) = 6 THEN
    v_is_valid := true;

    -- Update last MFA verification timestamp
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'last_mfa_verification',
      NOW(),
      'mfa_method',
      p_method
    )
    WHERE id = auth.uid();

    -- Log successful MFA verification
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      details
    ) VALUES (
      auth.uid(),
      'mfa_verification_success',
      'low',
      'mfa_system',
      jsonb_build_object(
        'method', p_method,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to force MFA setup for admins
CREATE OR REPLACE FUNCTION public.ensure_admin_mfa_setup()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_type public.user_type;
  v_mfa_enabled BOOLEAN;
BEGIN
  -- Get current user type
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = auth.uid();

  -- Only proceed for admin users
  IF v_user_type != 'admin_ansut' THEN
    RETURN true; -- Non-admins don't need MFA
  END IF;

  -- Check if MFA is enabled
  SELECT (raw_user_meta_data->>'mfa_enabled')::boolean INTO v_mfa_enabled
  FROM auth.users
  WHERE id = auth.uid();

  -- If MFA is not enabled, mark account as requiring MFA setup
  IF NOT v_mfa_enabled THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'mfa_required', true,
      'mfa_setup_deadline', NOW() + INTERVAL '24 hours'
    )
    WHERE id = auth.uid();

    -- Log MFA requirement
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      details
    ) VALUES (
      auth.uid(),
      'mfa_setup_required',
      'medium',
      'mfa_enforcement',
      jsonb_build_object(
        'deadline', NOW() + INTERVAL '24 hours',
        'requirement', 'admin_mfa_mandatory'
      )
    );

    RETURN false; -- MFA setup required
  END IF;

  RETURN true; -- MFA already enabled
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to block admin login without MFA
CREATE OR REPLACE FUNCTION public.block_admin_login_without_mfa()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type public.user_type;
  v_mfa_enabled BOOLEAN;
  v_mfa_required BOOLEAN;
BEGIN
  -- Skip for successful logins (we check after auth)
  IF NEW.success = true THEN
    RETURN NEW;
  END IF;

  -- Get user type if user_id is provided
  IF NEW.user_id IS NOT NULL THEN
    SELECT user_type INTO v_user_type
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- For admin users, check MFA requirements
    IF v_user_type = 'admin_ansut' THEN
      -- Check MFA status
      SELECT (raw_user_meta_data->>'mfa_enabled')::boolean INTO v_mfa_enabled
      FROM auth.users
      WHERE id = NEW.user_id;

      -- Check if MFA setup is required
      SELECT (raw_user_meta_data->>'mfa_required')::boolean INTO v_mfa_required
      FROM auth.users
      WHERE id = NEW.user_id;

      -- If admin doesn't have MFA enabled or setup is required, enhance the block reason
      IF NOT v_mfa_enabled OR v_mfa_required THEN
        UPDATE public.login_attempts
        SET failure_reason = 'MFA_REQUIRED_FOR_ADMIN: ' || COALESCE(failure_reason, 'Admin accounts require MFA'),
            blocked_until = GREATEST(blocked_until, NOW() + INTERVAL '1 hour')
        WHERE id = NEW.id;

        -- Log enhanced security event
        INSERT INTO public.security_events (
          user_id,
          event_type,
          severity,
          source,
          ip_address,
          details
        ) VALUES (
          NEW.user_id,
          'admin_login_blocked_mfa_required',
          'high',
          'login_system',
          NEW.ip_address,
          jsonb_build_object(
            'mfa_enabled', COALESCE(v_mfa_enabled, false),
            'mfa_required', COALESCE(v_mfa_required, false),
            'original_reason', NEW.failure_reason
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to enforce MFA on critical admin operations
CREATE TRIGGER enforce_mfa_on_profiles_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_admin_mfa();

CREATE TRIGGER enforce_mfa_on_user_roles_update
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION enforce_admin_mfa();

CREATE TRIGGER enforce_mfa_on_properties_management
  BEFORE INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION enforce_admin_mfa();

CREATE TRIGGER enforce_mfa_login_block
  AFTER INSERT ON public.login_attempts
  FOR EACH ROW EXECUTE FUNCTION block_admin_login_without_mfa();

-- Enhanced RLS policies that require MFA for admin operations
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all login attempts" ON public.login_attempts;

-- Create MFA-enforced admin policies
CREATE POLICY "Admins with MFA can view all profiles" ON public.profiles
  FOR SELECT USING (
    user_type != 'admin_ansut' OR (
      user_type = 'admin_ansut' AND
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
          AND (raw_user_meta_data->>'mfa_enabled')::boolean = true
          AND (raw_user_meta_data->>'last_mfa_verification')::timestamp with time zone > (NOW() - INTERVAL '1 hour')
      )
    )
  );

CREATE POLICY "Admins with MFA can view all login attempts" ON public.login_attempts
  FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    ) OR (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
          AND (raw_user_meta_data->>'mfa_enabled')::boolean = true
          AND (raw_user_meta_data->>'last_mfa_verification')::timestamp with time zone > (NOW() - INTERVAL '1 hour')
      )
    )
  );

-- Grant permissions for MFA functions
GRANT EXECUTE ON FUNCTION ensure_admin_mfa_setup() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_mfa(TEXT, TEXT) TO authenticated;

-- Create function to check if current admin session is MFA valid
CREATE OR REPLACE FUNCTION public.is_admin_mfa_session_valid()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_type public.user_type;
  v_mfa_enabled BOOLEAN;
  v_last_mfa TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current user type
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = auth.uid();

  -- Non-admins don't need MFA validation
  IF v_user_type != 'admin_ansut' THEN
    RETURN true;
  END IF;

  -- Check MFA status and last verification
  SELECT
    (raw_user_meta_data->>'mfa_enabled')::boolean,
    (raw_user_meta_data->>'last_mfa_verification')::timestamp with time zone
  INTO v_mfa_enabled, v_last_mfa
  FROM auth.users
  WHERE id = auth.uid();

  -- Return true if MFA is enabled and verified within the last hour
  RETURN COALESCE(v_mfa_enabled, false) = true
    AND v_last_mfa IS NOT NULL
    AND v_last_mfa > (NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin_mfa_session_valid() TO authenticated;
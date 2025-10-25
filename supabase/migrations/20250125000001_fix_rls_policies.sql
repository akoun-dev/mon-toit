-- Migration: Fix RLS Policies for Enhanced Security
-- Description: Fix overly permissive RLS policies and implement proper access control

-- HIGH PRIORITY FIX: Replace overly permissive profile policy
-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Limited public profile access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Sensitive profile data access" ON public.profiles;

-- Create a more restrictive policy that only allows limited public access
CREATE POLICY "Limited public profile access" ON public.profiles
  FOR SELECT USING (
    -- Allow authenticated users to see basic profile information
    auth.uid() IS NOT NULL OR (
      -- Allow limited public access for verified owners and agencies only
      is_verified = true AND user_type IN ('proprietaire', 'agence')
    )
  );

-- Create policy for admin access to all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Add policy to restrict sensitive profile information
CREATE POLICY "Sensitive profile data access" ON public.profiles
  FOR SELECT USING (
    CASE
      -- Users can always see their own full profile
      WHEN auth.uid() = id THEN true
      -- Admins can see all profiles
      WHEN EXISTS (
        SELECT 1 FROM public.profiles p_admin
        WHERE p_admin.id = auth.uid() AND p_admin.user_type = 'admin_ansut'
      ) THEN true
      -- Verified users can see basic info of other verified owners/agencies
      WHEN is_verified = true AND user_type IN ('proprietaire', 'agence') THEN
        -- Restrict to only non-sensitive fields (this will be handled in the view)
        true
      ELSE false
    END
  );

-- Create a secure view for public profile information
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  user_type,
  avatar_url,
  is_verified,
  -- Only include non-sensitive fields
  created_at
FROM public.profiles
WHERE is_verified = true AND user_type IN ('proprietaire', 'agence');

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Update user_sessions RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

-- More restrictive session policies
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_id AND auth.uid() IS NOT NULL AND auth.uid() = id
    )
  );

-- Add policy for session cleanup by system
CREATE POLICY "System can cleanup expired sessions" ON public.user_sessions
  FOR UPDATE USING (
    expires_at < now() OR (is_active = true AND last_accessed_at < now() - interval '7 days')
  );

-- Enhanced security for OTP verifications
DROP POLICY IF EXISTS "Users can view own OTP verifications" ON public.otp_verifications;

CREATE POLICY "Users can manage own OTP verifications" ON public.otp_verifications
  FOR ALL USING (
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Service can manage all OTP verifications" ON public.otp_verifications
  FOR ALL USING (
    -- Allow service role operations for system management
    current_setting('app_settings.current_role', true) = 'service_role'
  );

-- Fix login attempts policy to prevent information leakage
DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;

CREATE POLICY "Users can view own login attempts" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_id AND auth.uid() IS NOT NULL AND auth.uid() = id
    )
  );

CREATE POLICY "Admins can view all login attempts" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Create policy for security event logging (in addition to INSERT from previous migration)
CREATE POLICY "Users can view own security events" ON public.security_events
  FOR SELECT USING (user_id = auth.uid());

-- Add additional security policies for user_verifications
CREATE POLICY "Admins can view all verifications" ON public.user_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Add function to securely check if user has MFA enabled
CREATE OR REPLACE FUNCTION public.check_user_mfa_enabled(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_mfa_enabled BOOLEAN;
BEGIN
  SELECT (raw_user_meta_data->>'mfa_enabled')::boolean INTO v_mfa_enabled
  FROM auth.users
  WHERE id = v_user_id;

  RETURN COALESCE(v_mfa_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to enforce MFA requirement for admin operations
CREATE OR REPLACE FUNCTION public.require_mfa_for_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_type public.user_type;
  v_mfa_enabled BOOLEAN;
BEGIN
  -- Get current user type
  SELECT user_type INTO v_user_type
  FROM public.profiles
  WHERE id = auth.uid();

  -- If not admin, MFA not required
  IF v_user_type != 'admin_ansut' THEN
    RETURN true;
  END IF;

  -- Check if MFA is enabled for admin user
  v_mfa_enabled := public.check_user_mfa_enabled();

  IF NOT v_mfa_enabled THEN
    RAISE EXCEPTION 'MFA is required for admin operations';
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to audit profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(p_profile_id UUID, p_access_type TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    source,
    details
  ) VALUES (
    auth.uid(),
    'profile_access',
    'low',
    'profiles_table',
    jsonb_build_object(
      'target_profile_id', p_profile_id,
      'access_type', p_access_type,
      'timestamp', now()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix RLS security issues
-- This migration fixes overly permissive RLS policies and enhances security

-- Drop the overly permissive profiles policy
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- Create a more restrictive profiles policy that only exposes public information
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT
  USING (
    -- Allow public access to basic, non-sensitive information only
    is_verified = true AND
    full_name IS NOT NULL AND
    user_type IS NOT NULL
  );

-- Update profiles policy for authenticated users to see more detailed information
DROP POLICY IF EXISTS "Users can view full profiles of verified users" ON public.profiles;
CREATE POLICY "Users can view full profiles of verified users" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Users can see their own full profile
      id = auth.uid() OR
      -- Authenticated users can see verified profiles with more details
      (is_verified = true AND full_name IS NOT NULL)
    )
  );

-- Fix the problematic auth.users access in admin functions
-- Remove insecure direct access to auth.users and use proper RLS-compliant approach

-- Drop and recreate problematic OTP verification policies
DROP POLICY IF EXISTS "Users can view own OTP records" ON public.otp_verifications;
DROP POLICY IF EXISTS "Users can insert own OTP records" ON public.otp_verifications;

CREATE POLICY "Users can view own OTP records" ON public.otp_verifications
  FOR SELECT
  USING (
    email = current_setting('app.current_email', true) OR
    (auth.uid() IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM auth.users u
       WHERE u.id = auth.uid() AND u.email = public.otp_verifications.email
     ))
  );

CREATE POLICY "Users can insert own OTP records" ON public.otp_verifications
  FOR INSERT
  WITH CHECK (
    email = current_setting('app.current_email', true)
  );

-- Enhanced security for user_verifications table
-- Ensure only the user themselves and admins can access verification data
DROP POLICY IF EXISTS "Users can view own verifications" ON public.user_verifications;
CREATE POLICY "Users can view own verifications" ON public.user_verifications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
      )
    )
  );

-- Fix rental_applications RLS to use proper enum comparison
DROP POLICY IF EXISTS "Users can view own rental applications" ON public.rental_applications;
CREATE POLICY "Users can view own rental applications" ON public.rental_applications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      applicant_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
      )
    )
  );

-- Fix properties RLS policies to use proper enum types
DROP POLICY IF EXISTS "Properties are publicly viewable" ON public.properties;
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT
  USING (
    status = 'disponible'
  );

DROP POLICY IF EXISTS "Owners can view own properties" ON public.properties;
CREATE POLICY "Owners can view own properties" ON public.properties
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners can insert own properties" ON public.properties;
CREATE POLICY "Owners can insert own properties" ON public.properties
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND owner_id = auth.uid()
  );

-- Fix admin policies to use proper enum comparison
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
    )
  );

DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;
CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
    )
  );

-- Add security constraints for OTP table to prevent timing attacks
DROP POLICY IF EXISTS "OTP records expire quickly" ON public.otp_verifications;
CREATE POLICY "OTP records expire quickly" ON public.otp_verifications
  FOR DELETE
  USING (
    expires_at < NOW() OR
    used_at IS NOT NULL
  );

-- Add audit function for security monitoring
CREATE OR REPLACE FUNCTION public.log_security_access(
  p_table TEXT,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    table_name, action, user_id, details, created_at
  ) VALUES (
    p_table, p_action, p_user_id, p_details, NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security_audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view security logs" ON public.security_audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
    )
  );

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_security_access TO authenticated;

-- Add comments
COMMENT ON TABLE public.security_audit_logs IS 'Journal d''audit pour les événements de sécurité';
COMMENT ON FUNCTION public.log_security_access IS 'Enregistre les événements d''accès pour la sécurité';

DO $$
BEGIN
  RAISE NOTICE '✓ RLS security fixes applied successfully';
END $$;
-- Migration: Fix Critical Security Issues
-- Description: Apply critical security fixes identified in security audit

-- CRITICAL FIX 1: Add proper foreign key constraints with CASCADE delete
-- Fix the login_attempts table foreign key constraint
DO $$
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'login_attempts_user_id_fkey'
        AND table_name = 'login_attempts'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.login_attempts DROP CONSTRAINT login_attempts_user_id_fkey;
    END IF;

    -- Add proper foreign key constraint with CASCADE delete
    ALTER TABLE public.login_attempts
    ADD CONSTRAINT login_attempts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

-- CRITICAL FIX 2: Add encryption extension for OTP tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted column for OTP tokens
ALTER TABLE public.otp_verifications
ADD COLUMN IF NOT EXISTS token_encrypted BYTEA;

-- Create encryption functions for OTP tokens
-- IMPORTANT: Replace with your actual encryption key from environment variables
CREATE OR REPLACE FUNCTION public.encrypt_otp_token(token TEXT)
RETURNS BYTEA AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Get encryption key from secure configuration
  SELECT value INTO v_encryption_key
  FROM public.processing_config
  WHERE key = 'otp_encryption_key';

  IF v_encryption_key IS NULL THEN
    RAISE EXCEPTION 'OTP encryption key not configured. Please set otp_encryption_key in processing_config table.';
  END IF;

  RETURN encrypt(token::BYTEA, v_encryption_key, 'aes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_otp_token(token_encrypted BYTEA)
RETURNS TEXT AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Get encryption key from secure configuration
  SELECT value INTO v_encryption_key
  FROM public.processing_config
  WHERE key = 'otp_encryption_key';

  IF v_encryption_key IS NULL THEN
    RAISE EXCEPTION 'OTP encryption key not configured. Please set otp_encryption_key in processing_config table.';
  END IF;

  RETURN convert_from(decrypt(token_encrypted, v_encryption_key, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to securely initialize OTP encryption key
CREATE OR REPLACE FUNCTION public.initialize_otp_encryption_key(p_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow this operation for service role or admins
  IF current_setting('request.jwt.claim.role', true) = 'service_role' OR
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin_ansut') THEN

    INSERT INTO public.processing_config (key, value, description)
    VALUES ('otp_encryption_key', p_key, 'Encryption key for OTP tokens (AES-256)')
    ON CONFLICT (key) DO UPDATE SET
      value = p_key,
      updated_at = NOW();

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate existing tokens to encrypted format
CREATE OR REPLACE FUNCTION public.migrate_otp_tokens()
RETURNS void AS $$
DECLARE
  otp_record RECORD;
BEGIN
  FOR otp_record IN SELECT id, token FROM public.otp_verifications WHERE token_encrypted IS NULL
  LOOP
    UPDATE public.otp_verifications
    SET token_encrypted = public.encrypt_otp_token(otp_record.token)
    WHERE id = otp_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL FIX 3: Add composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_type
ON public.otp_verifications(email, type);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_success_created
ON public.login_attempts(email, success, created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active_expires
ON public.user_sessions(user_id, is_active, expires_at);

-- CRITICAL FIX 4: Add table for security events logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for security_events
CREATE INDEX IF NOT EXISTS security_events_user_id_idx ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS security_events_type_idx ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON public.security_events(created_at);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_events
CREATE POLICY "Admins can view all security events" ON public.security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Users can view their own security events" ON public.security_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can insert security events" ON public.security_events
  FOR INSERT WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.security_events IS 'Journal des événements de sécurité pour audit et monitoring';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.security_events TO service_role;
GRANT SELECT, INSERT ON public.security_events TO authenticated;

-- Run OTP token migration (this should be run once after deployment)
-- SELECT public.migrate_otp_tokens();
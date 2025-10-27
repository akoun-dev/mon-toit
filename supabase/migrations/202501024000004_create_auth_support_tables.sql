-- Migration: Create authentication support tables
-- Description: Create tables for login attempts, OTP verification, and security

-- Create login_attempts table for security monitoring
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  fingerprint TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create otp_verifications table for OTP handling
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'signup', -- signup, login, reset_password
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_sessions table for enhanced session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create user_verifications table for verification tracking
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  oneci_status public.verification_status DEFAULT 'not_attempted',
  cnam_status public.verification_status DEFAULT 'not_attempted',
  face_status public.verification_status DEFAULT 'not_attempted',
  oneci_data JSONB,
  cnam_data JSONB,
  face_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS login_attempts_created_at_idx ON public.login_attempts(created_at);
CREATE INDEX IF NOT EXISTS login_attempts_success_idx ON public.login_attempts(success);

CREATE INDEX IF NOT EXISTS otp_verifications_email_idx ON public.otp_verifications(email);
CREATE INDEX IF NOT EXISTS otp_verifications_token_idx ON public.otp_verifications(token);
CREATE INDEX IF NOT EXISTS otp_verifications_expires_at_idx ON public.otp_verifications(expires_at);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_session_token_idx ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS user_sessions_is_active_idx ON public.user_sessions(is_active);

CREATE INDEX IF NOT EXISTS user_verifications_user_id_idx ON public.user_verifications(user_id);

-- Create triggers for updated_at
CREATE TRIGGER handle_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.login_attempts IS 'Journal des tentatives de connexion pour la sécurité';
COMMENT ON TABLE public.otp_verifications IS 'Gestion des codes OTP à usage unique';
COMMENT ON TABLE public.user_sessions IS 'Suivi des sessions utilisateur actives';
COMMENT ON TABLE public.user_verifications IS 'Suivi des statuts de vérification d''identité';

-- Create function to cleanup expired OTP tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < now() OR (used_at IS NOT NULL AND created_at < now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < now() OR (is_active = true AND last_accessed_at < now() - interval '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
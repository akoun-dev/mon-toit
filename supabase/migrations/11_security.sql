-- Logs de sécurité
CREATE TABLE public.security_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Événements de sécurité
CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  source text NOT NULL,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tentatives de connexion
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  success boolean NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  ip_address inet,
  fingerprint text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  attempted_at timestamp with time zone DEFAULT now(),
  failure_reason text,
  blocked_until timestamp with time zone
);

-- Logs de signatures électroniques
CREATE TABLE public.electronic_signature_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  document_id uuid,
  document_type text,
  document_title text,
  document_url text,
  signature_data jsonb,
  signature_method text DEFAULT 'electronic'::text,
  status text DEFAULT 'pending'::text,
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  signed_at timestamp with time zone,
  expires_at timestamp with time zone,
  verification_token text,
  audit_trail jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
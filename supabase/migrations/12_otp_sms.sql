-- Codes OTP
CREATE TABLE public.otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  is_used boolean DEFAULT false
);

-- Vérifications OTP
CREATE TABLE public.otp_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  token text NOT NULL,
  type text NOT NULL DEFAULT 'signup'::text,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  token_encrypted bytea
);

-- Codes de vérification SMS
CREATE TABLE public.sms_verification_codes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  phone_number text NOT NULL,
  country_code text NOT NULL DEFAULT '+225'::text,
  code character varying NOT NULL,
  code_hash character varying NOT NULL,
  purpose character varying NOT NULL DEFAULT 'mfa'::character varying CHECK (purpose::text = ANY (ARRAY['mfa'::character varying, 'login'::character varying, 'phone_verification'::character varying, 'password_reset'::character varying]::text[])),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  device_fingerprint text
);

-- Logs de livraison SMS
CREATE TABLE public.sms_delivery_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  phone_number text NOT NULL,
  country_code text NOT NULL DEFAULT '+225'::text,
  purpose character varying NOT NULL CHECK (purpose::text = ANY (ARRAY['mfa'::character varying, 'login'::character varying, 'phone_verification'::character varying, 'password_reset'::character varying, 'notification'::character varying]::text[])),
  message_id text,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'sent'::character varying, 'delivered'::character varying, 'failed'::character varying, 'expired'::character varying]::text[])),
  provider character varying NOT NULL DEFAULT 'twilio'::character varying,
  provider_response text,
  error_code text,
  error_message text,
  cost numeric,
  currency character DEFAULT 'USD'::bpchar,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Limites de taux SMS
CREATE TABLE public.sms_rate_limits (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  identifier text NOT NULL,
  identifier_type character varying NOT NULL CHECK (identifier_type::text = ANY (ARRAY['phone'::character varying, 'ip'::character varying, 'user_id'::character varying]::text[])),
  purpose character varying NOT NULL DEFAULT 'mfa'::character varying CHECK (purpose::text = ANY (ARRAY['mfa'::character varying, 'login'::character varying, 'phone_verification'::character varying, 'password_reset'::character varying]::text[])),
  count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  window_end timestamp with time zone NOT NULL DEFAULT (now() + '01:00:00'::interval),
  is_blocked boolean NOT NULL DEFAULT false,
  block_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
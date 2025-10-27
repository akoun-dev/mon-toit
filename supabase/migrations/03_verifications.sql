-- Vérifications utilisateurs
CREATE TABLE public.user_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  oneci_status verification_status DEFAULT 'not_attempted'::verification_status,
  cnam_status verification_status DEFAULT 'not_attempted'::verification_status,
  face_status verification_status DEFAULT 'not_attempted'::verification_status,
  oneci_data jsonb,
  cnam_data jsonb,
  face_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_score integer DEFAULT 0,
  oneci_verified_at timestamp with time zone,
  cnam_verified_at timestamp with time zone,
  face_verified_at timestamp with time zone
);

-- Certificats digitaux
CREATE TABLE public.digital_certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  certificate_number text UNIQUE,
  certificate_type text NOT NULL,
  title text NOT NULL,
  description text,
  issuing_authority text,
  issue_date date,
  expiry_date date,
  certificate_status certificate_status DEFAULT 'pending'::certificate_status,
  certificate_url text,
  thumbnail_url text,
  verification_code text UNIQUE,
  public_key text,
  digital_signature text,
  metadata jsonb DEFAULT '{}'::jsonb,
  verification_history jsonb DEFAULT '[]'::jsonb,
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamp with time zone,
  revoked_reason text,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Vérifications téléphone
CREATE TABLE public.phone_verifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  phone_number text NOT NULL,
  country_code text NOT NULL DEFAULT '+225'::text,
  is_verified boolean NOT NULL DEFAULT false,
  verification_method character varying NOT NULL DEFAULT 'sms'::character varying CHECK (verification_method::text = ANY (ARRAY['sms'::character varying, 'call'::character varying, 'whatsapp'::character varying]::text[])),
  verified_at timestamp with time zone,
  verification_attempts integer NOT NULL DEFAULT 0,
  last_verification_attempt timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
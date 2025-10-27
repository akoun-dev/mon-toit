-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  user_type user_type NOT NULL DEFAULT 'locataire'::user_type,
  phone text,
  avatar_url text,
  bio text,
  city text,
  is_verified boolean DEFAULT false,
  oneci_verified boolean DEFAULT false,
  cnam_verified boolean DEFAULT false,
  face_verified boolean DEFAULT false,
  ui_density text DEFAULT 'comfortable'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sms_enabled boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  phone_verified_at timestamp with time zone,
  preferred_mfa_method character varying DEFAULT 'totp'::character varying CHECK (preferred_mfa_method::text = ANY (ARRAY['totp'::character varying, 'sms'::character varying, 'backup'::character varying]::text[])),
  country_code text DEFAULT '+225'::text,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Rôles utilisateurs
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  role user_type NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Rôle actif de l'utilisateur
CREATE TABLE public.user_active_roles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id),
  active_role user_type NOT NULL,
  available_roles user_type[] DEFAULT '{}'::user_type[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Sessions utilisateurs
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);
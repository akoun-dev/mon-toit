-- Demandes de changement de rôle
CREATE TABLE public.role_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  from_role text NOT NULL CHECK (from_role = ANY (ARRAY['locataire'::text, 'proprietaire'::text, 'agence'::text, 'tiers_de_confiance'::text, 'admin_ansut'::text])),
  to_role text NOT NULL CHECK (to_role = ANY (ARRAY['locataire'::text, 'proprietaire'::text, 'agence'::text, 'tiers_de_confiance'::text, 'admin_ansut'::text])),
  justification text,
  supporting_documents jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])),
  requested_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Résumé des rôles utilisateurs
CREATE TABLE public.user_roles_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type user_type NOT NULL UNIQUE,
  total_users integer NOT NULL DEFAULT 0,
  verified_users integer NOT NULL DEFAULT 0,
  unverified_users integer NOT NULL DEFAULT 0,
  created_this_month integer NOT NULL DEFAULT 0,
  last_30_days integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Configuration du traitement
CREATE TABLE public.processing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  category text DEFAULT 'general'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Litiges
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title character varying NOT NULL,
  description text,
  status character varying DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'closed'::character varying]::text[])),
  priority character varying DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  dispute_type character varying,
  plaintiff_id uuid NOT NULL REFERENCES public.profiles(id),
  defendant_id uuid NOT NULL REFERENCES public.profiles(id),
  property_id uuid REFERENCES public.properties(id),
  evidence jsonb DEFAULT '[]'::jsonb,
  resolution text,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Avis
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id),
  property_id uuid REFERENCES public.properties(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text NOT NULL,
  moderation_status character varying DEFAULT 'pending'::character varying CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'flagged'::character varying]::text[])),
  moderation_notes text,
  moderated_by uuid REFERENCES public.profiles(id),
  moderated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
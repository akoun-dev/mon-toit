-- Préférences utilisateurs
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  theme text DEFAULT 'light'::text,
  language text DEFAULT 'fr'::text,
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  property_alerts boolean DEFAULT false,
  preferred_areas text[],
  budget_min integer,
  budget_max integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Alertes propriétés
CREATE TABLE public.property_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  notification_frequency text NOT NULL DEFAULT 'daily'::text CHECK (notification_frequency = ANY (ARRAY['immediate'::text, 'daily'::text, 'weekly'::text, 'never'::text])),
  last_notification_sent_at timestamp with time zone,
  max_price integer,
  min_bedrooms integer DEFAULT 1,
  max_bedrooms integer,
  property_types text[] DEFAULT '{}'::text[],
  neighborhoods text[] DEFAULT '{}'::text[],
  cities text[] DEFAULT '{}'::text[],
  is_furnished boolean,
  min_surface_area integer,
  max_surface_area integer,
  has_ac boolean,
  has_parking boolean,
  has_garden boolean,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
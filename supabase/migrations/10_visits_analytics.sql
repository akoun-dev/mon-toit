-- Visites de propriétés
CREATE TABLE public.property_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  visitor_id uuid NOT NULL REFERENCES public.profiles(id),
  scheduled_date timestamp with time zone NOT NULL,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Analytics des propriétés
CREATE TABLE public.property_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  view_date date NOT NULL,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Historique de recherche
CREATE TABLE public.search_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  search_filters jsonb,
  results_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Favoris utilisateurs
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
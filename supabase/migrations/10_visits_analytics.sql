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

-- Views des propriétés (table de tracking pour analytics)
CREATE TABLE public.property_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  user_id uuid REFERENCES public.profiles(id),
  view_date timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  session_id text,
  referrer text,
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_unique UNIQUE (user_id, property_id)
);

-- Indexes pour les analytics et performances
CREATE INDEX idx_property_visits_property_id ON property_views(property_id);
CREATE INDEX idx_property_visits_view_date ON property_views(view_date);
CREATE INDEX idx_property_visits_user_id ON property_views(user_id);
CREATE INDEX idx_property_analytics_property_date ON property_analytics(property_id, view_date);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_property_id ON user_favorites(property_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);
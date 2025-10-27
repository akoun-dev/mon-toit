-- Propriétés immobilières
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  property_type text NOT NULL,
  city text NOT NULL,
  neighborhood text,
  address text NOT NULL,
  monthly_rent integer NOT NULL CHECK (monthly_rent > 0 AND monthly_rent < 10000000),
  deposit_amount integer,
  surface_area integer CHECK (surface_area > 0 AND surface_area < 10000),
  bedrooms integer DEFAULT 1 CHECK (bedrooms >= 0 AND bedrooms <= 50),
  bathrooms integer DEFAULT 1 CHECK (bathrooms >= 0 AND bathrooms <= 20),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  status text DEFAULT 'disponible'::text,
  is_furnished boolean DEFAULT false,
  has_ac boolean DEFAULT false,
  has_parking boolean DEFAULT false,
  has_garden boolean DEFAULT false,
  latitude numeric,
  longitude numeric,
  floor_number integer,
  moderated_at timestamp with time zone,
  moderated_by uuid REFERENCES public.profiles(id),
  moderation_notes text,
  moderation_status text DEFAULT 'pending'::text,
  view_count integer DEFAULT 0,
  title_deed_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  main_image text,
  images text[],
  video_url text,
  virtual_tour_url text,
  panoramic_images jsonb,
  floor_plans jsonb,
  media_metadata jsonb,
  work_status text DEFAULT 'aucun_travail'::text CHECK (work_status = ANY (ARRAY['aucun_travail'::text, 'travaux_a_effectuer'::text])),
  work_description text,
  work_images text[],
  work_estimated_cost integer,
  work_estimated_duration text,
  work_start_date timestamp with time zone,
  charges_amount integer,
  is_new boolean DEFAULT false
);

-- Indexes pour les performances des requêtes publiques
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_monthly_rent ON properties(monthly_rent);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_view_count ON properties(view_count);
CREATE INDEX idx_properties_location ON properties USING GIST (point(longitude, latitude)) WHERE longitude IS NOT NULL AND latitude IS NOT NULL;
CREATE INDEX idx_properties_search ON properties USING GIN (to_tsvector('french', title || ' ' || COALESCE(description, '') || ' ' || city || ' ' || COALESCE(neighborhood, '')));
CREATE INDEX idx_properties_type_surface ON properties(property_type, surface_area);
CREATE INDEX idx_properties_available ON properties(status, monthly_rent) WHERE status = 'disponible';

-- Médias des propriétés
CREATE TABLE public.property_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text, 'floor_plan'::text, 'panoramic'::text, 'virtual_tour'::text])),
  url text NOT NULL,
  title text,
  description text,
  order_index integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Coûts des utilités
CREATE TABLE public.property_utility_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  utility_type text NOT NULL CHECK (utility_type = ANY (ARRAY['electricity'::text, 'water'::text, 'internet'::text, 'maintenance'::text, 'other'::text])),
  amount integer,
  frequency text DEFAULT 'monthly'::text CHECK (frequency = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'annual'::text])),
  is_included_in_rent boolean DEFAULT false,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Travaux sur propriétés
CREATE TABLE public.property_work (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  work_status text CHECK (work_status = ANY (ARRAY['none'::text, 'planned'::text, 'in_progress'::text, 'completed'::text])),
  description text,
  estimated_cost integer,
  estimated_duration text,
  start_date date,
  end_date date,
  images jsonb DEFAULT '[]'::jsonb,
  contractor_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
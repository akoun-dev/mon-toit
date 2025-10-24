-- Migration: Fix trigger and add properties table
-- Description: Fix handle_new_user trigger and create properties table

-- Fix the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'locataire'::public.user_type)
  );

  -- Initialize user active roles
  INSERT INTO public.user_active_roles (user_id, active_role, available_roles)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'locataire'::public.user_type),
    ARRAY[COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'locataire'::public.user_type)]
  );

  -- Initialize user verifications
  INSERT INTO public.user_verifications (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT NOT NULL,
  monthly_rent INTEGER NOT NULL,
  deposit_amount INTEGER,
  surface_area INTEGER,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'disponible',
  main_image TEXT,
  images TEXT[],
  is_furnished BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  latitude DECIMAL,
  longitude DECIMAL,
  floor_number INTEGER,
  floor_plans JSONB,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES public.profiles(id),
  moderation_notes TEXT,
  moderation_status TEXT DEFAULT 'pending',
  view_count INTEGER DEFAULT 0,
  panoramic_images JSONB,
  media_metadata JSONB,
  video_url TEXT,
  virtual_tour_url TEXT,
  title_deed_url TEXT,
  work_status TEXT,
  work_description TEXT,
  work_images JSONB,
  work_estimated_cost INTEGER,
  work_estimated_duration TEXT,
  work_start_date DATE,
  charges_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for properties
CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_monthly_rent_idx ON public.properties(monthly_rent);
CREATE INDEX IF NOT EXISTS properties_bedrooms_idx ON public.properties(bedrooms);
CREATE INDEX IF NOT EXISTS properties_property_type_idx ON public.properties(property_type);

-- Create trigger for updated_at
CREATE TRIGGER handle_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.properties IS 'Biens immobiliers disponibles sur la plateforme Mon Toit';
COMMENT ON COLUMN public.properties.monthly_rent IS 'Loyer mensuel en FCFA';
COMMENT ON COLUMN public.properties.deposit_amount IS 'Montant de la caution en FCFA';

-- Create RLS policies for properties
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT USING (status = 'disponible');

CREATE POLICY "Owners can view own properties" ON public.properties
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );
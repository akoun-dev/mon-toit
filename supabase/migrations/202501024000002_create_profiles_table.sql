-- Migration: Create profiles table
-- Description: Create main user profiles table with all required fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  user_type public.user_type NOT NULL DEFAULT 'locataire',
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT false,
  oneci_verified BOOLEAN DEFAULT false,
  cnam_verified BOOLEAN DEFAULT false,
  face_verified BOOLEAN DEFAULT false,
  ui_density TEXT DEFAULT 'comfortable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);
CREATE INDEX IF NOT EXISTS profiles_is_verified_idx ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON public.profiles(full_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.profiles IS 'Profils des utilisateurs du système Mon Toit';
COMMENT ON COLUMN public.profiles.id IS 'Référence à l''utilisateur auth.users';
COMMENT ON COLUMN public.profiles.user_type IS 'Type d''utilisateur (locataire, proprietaire, agence, tiers_de_confiance, admin_ansut)';
COMMENT ON COLUMN public.profiles.is_verified IS 'Statut de vérification générale';
COMMENT ON COLUMN public.profiles.oneci_verified IS 'Vérification par l''ONECI';
COMMENT ON COLUMN public.profiles.cnam_verified IS 'Vérification par la CNAM';
COMMENT ON COLUMN public.profiles.face_verified IS 'Vérification faciale';
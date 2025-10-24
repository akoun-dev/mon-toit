-- Migration: Create base enums and types
-- Description: Create all enum types for the application

-- Create user_type enum with all required roles
DO $$ BEGIN
  CREATE TYPE public.user_type AS ENUM (
    'locataire',
    'proprietaire',
    'agence',
    'tiers_de_confiance',
    'admin_ansut'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create other enums needed by the application
DO $$ BEGIN
  CREATE TYPE public.property_status AS ENUM (
    'disponible',
    'loué',
    'en_attente',
    'retiré'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'not_attempted'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM (
    'free',
    'pro',
    'premium',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.moderation_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mandate_type AS ENUM (
    'location',
    'vente',
    'gestion'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_frequency AS ENUM (
    'mensuel',
    'trimestriel',
    'annuel'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add comments for documentation
COMMENT ON TYPE public.user_type IS 'Type d''utilisateur dans le système Mon Toit';
COMMENT ON TYPE public.property_status IS 'Statut d''un bien immobilier';
COMMENT ON TYPE public.application_status IS 'Statut d''une candidature';
COMMENT ON TYPE public.verification_status IS 'Statut de vérification d''identité';
COMMENT ON TYPE public.subscription_tier IS 'Niveau d''abonnement';
COMMENT ON TYPE public.moderation_status IS 'Statut de modération';
COMMENT ON TYPE public.mandate_type IS 'Type de mandat';
COMMENT ON TYPE public.billing_frequency IS 'Fréquence de facturation';
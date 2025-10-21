-- Fix app_role enum to match expected values
-- Date: 2025-10-21
-- This migration fixes the app_role enum to include all expected values

-- Drop existing function that depends on the enum
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);

-- Update the app_role enum to include all expected values
DO $$
BEGIN
  -- Check if the enum exists and update it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    -- Add missing enum values if they don't exist
    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'super_admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'proprietaire';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'locataire';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'agence';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'tiers_de_confiance';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'user';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'agent';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.app_role ADD VALUE 'moderator';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  ELSE
    -- Create the enum with all expected values if it doesn't exist
    CREATE TYPE public.app_role AS ENUM (
      'admin',
      'super_admin',
      'proprietaire',
      'locataire',
      'agence',
      'tiers_de_confiance',
      'user',
      'agent',
      'moderator'
    );
  END IF;
END $$;

-- Recreate the has_role function with the updated enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update the user_type enum if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    -- Add missing enum values
    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'locataire';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'proprietaire';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'agence';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'admin_ansut';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'super_admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.user_type ADD VALUE 'tiers_de_confiance';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Update user_roles table to use the correct default values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    -- Update any 'user' roles to 'locataire' for consistency
    UPDATE public.user_roles
    SET role = 'locataire'
    WHERE role = 'user';

    -- Update any 'agent' roles to 'agence' for consistency
    UPDATE public.user_roles
    SET role = 'agence'
    WHERE role = 'agent';
  END IF;
END $$;

-- Ensure profiles table has the correct user_type values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- Update profiles to use correct user_type values
    UPDATE public.profiles
    SET user_type = 'locataire'
    WHERE user_type NOT IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'admin', 'super_admin', 'tiers_de_confiance');
  END IF;
END $$;

-- Add a constraint to ensure only valid values are used
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT IF NOT EXISTS user_roles_role_check
    CHECK (role IN ('admin', 'super_admin', 'proprietaire', 'locataire', 'agence', 'tiers_de_confiance'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT IF NOT EXISTS profiles_user_type_check
    CHECK (user_type IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'admin', 'super_admin', 'tiers_de_confiance'));
  END IF;
END $$;

COMMIT;
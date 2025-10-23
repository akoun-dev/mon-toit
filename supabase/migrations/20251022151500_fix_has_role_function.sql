-- Fix missing has_role function and ensure it's properly created
-- This migration safely creates or recreates the has_role function without breaking existing policies

-- First, create the app_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM (
      'admin',
      'user',
      'agent',
      'moderator',
      'super_admin',
      'tiers_de_confiance',
      'proprietaire',
      'locataire',
      'agence'
    );
  END IF;
END $$;

-- Safely create or replace the has_role function
-- This function checks if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role::text
  );
$$;

-- Create an overload for text input for backward compatibility
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Convert text to app_role and call the main function
  RETURN public.has_role(_user_id, _role::app_role);
EXCEPTION
  WHEN invalid_text_representation THEN
    -- If the role is not a valid app_role, return false
    RETURN false;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO anon, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 'Checks if a user has a specific role. Returns true if the user has the role and it is active.';
COMMENT ON FUNCTION public.has_role(uuid, text) IS 'Overload for backward compatibility. Converts text role to app_role enum.';


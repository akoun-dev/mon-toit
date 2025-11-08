-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_public_profile_safe(uuid);
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

-- Fix 1: Secure profiles_public view
-- Revoke public access from profiles_public view
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM authenticated;

-- Create secure RPC function to access public profiles
CREATE FUNCTION public.get_public_profile_safe(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  user_type user_type,
  city text,
  bio text,
  avatar_url text,
  cnib_verified boolean,
  cnam_verified boolean,
  face_verified boolean,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.full_name, p.user_type, p.city, p.bio, p.avatar_url,
    p.cnib_verified, p.cnam_verified, p.face_verified, p.is_verified
  FROM public.profiles p
  WHERE p.id = target_user_id AND auth.uid() IS NOT NULL;
$$;

-- Fix 2: Create missing get_active_hero_images function (only if doesn't exist)
CREATE OR REPLACE FUNCTION public.get_active_hero_images(p_device_type text DEFAULT 'both')
RETURNS TABLE(
  id uuid,
  title text,
  alt_text text,
  image_url text,
  display_order integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hci.id,
    hci.title,
    hci.alt_text,
    hci.image_url,
    hci.display_order
  FROM public.hero_carousel_images hci
  WHERE hci.is_active = true
    AND (hci.device_type = p_device_type OR hci.device_type = 'both')
  ORDER BY hci.display_order ASC, hci.created_at DESC;
END;
$$;

-- Fix 3: Secure guest_messages with proper RLS
ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view their guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Anyone can send guest messages" ON public.guest_messages;

-- Policy: Owner can view their own guest messages
CREATE POLICY "Owners can view their guest messages"
ON public.guest_messages
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Authenticated users can insert messages
CREATE POLICY "Authenticated users can send guest messages"
ON public.guest_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix 4: Update get_public_profile with correct column names
CREATE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  user_type user_type,
  city text,
  bio text,
  avatar_url text,
  cnib_verified boolean,
  cnam_verified boolean,
  face_verified boolean,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.user_type, p.city, p.bio, p.avatar_url,
    p.cnib_verified, p.cnam_verified, p.face_verified, p.is_verified
  FROM public.profiles p WHERE p.id = target_user_id;
$$;

-- Fix 5: Add audit logging table for sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id),
  target_user_id uuid,
  data_type text NOT NULL,
  access_granted boolean NOT NULL,
  relationship_type text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can view access logs" ON public.sensitive_data_access_log;
DROP POLICY IF EXISTS "System can log access" ON public.sensitive_data_access_log;

-- Only admins can view access logs
CREATE POLICY "Only admins can view access logs"
ON public.sensitive_data_access_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert logs
CREATE POLICY "System can log access"
ON public.sensitive_data_access_log
FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());
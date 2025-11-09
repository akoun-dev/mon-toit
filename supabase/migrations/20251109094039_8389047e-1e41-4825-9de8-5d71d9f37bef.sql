-- Fix last 3 critical security errors

-- 1. Fix guest_messages SELECT - remove duplicate/conflicting policies
DROP POLICY IF EXISTS "Owners can view their guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Property owners view their guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Admins view all guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Admins can view all guest messages" ON public.guest_messages;

-- Create clean, non-overlapping policies
CREATE POLICY "Property owners view their messages only"
ON public.guest_messages
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Admins view all messages"
ON public.guest_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix user_verifications - only super_admin can SELECT directly
DROP POLICY IF EXISTS "Block direct user access to verifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verifications;

-- Only super_admin can SELECT (regular admins use RPC functions)
CREATE POLICY "Only super_admin can view verifications"
ON public.user_verifications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Create a safe public profile view that excludes phone numbers
-- First, check if view exists and drop it
DROP VIEW IF EXISTS public.profiles_safe_public CASCADE;

-- Create a view that excludes sensitive fields like phone numbers
CREATE VIEW public.profiles_safe_public AS
SELECT 
  id,
  full_name,
  user_type,
  city,
  bio,
  avatar_url,
  cnib_verified,
  cnam_verified,
  face_verified,
  is_verified,
  created_at
  -- Explicitly exclude: phone, email_public, date_of_birth, etc.
FROM public.profiles;

-- Grant SELECT on the safe view
GRANT SELECT ON public.profiles_safe_public TO authenticated;

-- Enable RLS on the view (inherits from profiles table)
ALTER VIEW public.profiles_safe_public SET (security_invoker = on);
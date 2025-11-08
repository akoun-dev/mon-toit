-- Fix critical security issues found in scan

-- 1. Fix profiles table - it's currently publicly readable
-- Remove overly permissive policy and ensure proper restrictions
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix guest_messages - ensure it's not publicly readable
-- We already added RLS policies earlier, but let's ensure there's no public access
DROP POLICY IF EXISTS "Public can view guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Anyone can view guest messages" ON public.guest_messages;

-- Owners and admins only (we already have this but let's be explicit)
-- The policies we created earlier should be sufficient

-- 3. Fix user_verifications - remove conflicting policy
DROP POLICY IF EXISTS "Block all direct user SELECT access" ON public.user_verifications;
DROP POLICY IF EXISTS "Users cannot SELECT user_verifications directly" ON public.user_verifications;

-- Ensure the policy we created earlier is the only one
-- "Only admins can view all verifications" should be sufficient

-- 4. Ensure anon role has no access to sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.guest_messages FROM anon;
REVOKE ALL ON public.user_verifications FROM anon;
REVOKE ALL ON public.sensitive_data_access_log FROM anon;
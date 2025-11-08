-- Fix critical security issues - restrict access to sensitive data

-- 1. Fix profiles table - only allow viewing own profile and business relationships
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can view profiles of people they have active business relationships with
CREATE POLICY "Users can view profiles with business relationship"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Property owners can see tenant/applicant profiles
  EXISTS (
    SELECT 1 FROM rental_applications ra
    JOIN properties p ON p.id = ra.property_id
    WHERE p.owner_id = auth.uid() 
    AND ra.applicant_id = profiles.id
  )
  OR
  -- Tenants can see their landlord's profile
  EXISTS (
    SELECT 1 FROM leases l
    WHERE l.tenant_id = auth.uid() 
    AND l.landlord_id = profiles.id
    AND l.status = 'active'
  )
  OR
  -- Landlords can see their tenant's profile
  EXISTS (
    SELECT 1 FROM leases l
    WHERE l.landlord_id = auth.uid() 
    AND l.tenant_id = profiles.id
    AND l.status = 'active'
  )
  OR
  -- Users in active conversations can see each other
  EXISTS (
    SELECT 1 FROM messages m
    WHERE (m.sender_id = auth.uid() AND m.receiver_id = profiles.id)
       OR (m.receiver_id = auth.uid() AND m.sender_id = profiles.id)
  )
);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix guest_messages - only property owners and admins can read
DROP POLICY IF EXISTS "Anyone can view guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Only property owners can view their guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Admins can view all guest messages" ON public.guest_messages;

CREATE POLICY "Property owners view their guest messages"
ON public.guest_messages
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Admins view all guest messages"
ON public.guest_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix user_verifications - restrict access to sensitive fields
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own verification" ON public.user_verifications;
DROP POLICY IF EXISTS "User verifications only via secure functions" ON public.user_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Only admins can view all verifications" ON public.user_verifications;

-- Only allow access through secure RPC functions for regular users
CREATE POLICY "Block direct user access to verifications"
ON public.user_verifications
FOR SELECT
TO authenticated
USING (
  -- Only admins can SELECT directly (they need 2FA for sensitive fields via functions)
  public.has_role(auth.uid(), 'admin'::app_role)
  -- Regular users must use get_my_verification_status() which filters sensitive data
);
-- Fix remaining critical security issues

-- 1. Fix profiles - remove message-based access (too permissive)
DROP POLICY IF EXISTS "Users can view profiles with business relationship" ON public.profiles;

-- Recreate with stricter business relationship rules
CREATE POLICY "Users view profiles with active business relationship"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Property owners can see applicant profiles for their properties
  EXISTS (
    SELECT 1 FROM rental_applications ra
    JOIN properties p ON p.id = ra.property_id
    WHERE p.owner_id = auth.uid() 
    AND ra.applicant_id = profiles.id
    AND ra.status IN ('pending', 'reviewing', 'approved')
  )
  OR
  -- Tenants can see their current landlord's profile (active lease only)
  EXISTS (
    SELECT 1 FROM leases l
    WHERE l.tenant_id = auth.uid() 
    AND l.landlord_id = profiles.id
    AND l.status = 'active'
  )
  OR
  -- Landlords can see their current tenant's profile (active lease only)
  EXISTS (
    SELECT 1 FROM leases l
    WHERE l.landlord_id = auth.uid() 
    AND l.tenant_id = profiles.id
    AND l.status = 'active'
  )
  OR
  -- Applicants can see property owner profile for properties they applied to
  EXISTS (
    SELECT 1 FROM rental_applications ra
    JOIN properties p ON p.id = ra.property_id
    WHERE ra.applicant_id = auth.uid()
    AND p.owner_id = profiles.id
    AND ra.status IN ('pending', 'reviewing', 'approved')
  )
);

-- 2. Fix guest_messages - restrict INSERT to valid properties only
DROP POLICY IF EXISTS "Authenticated users can send guest messages" ON public.guest_messages;

-- Only allow inserting for properties that exist and are available
CREATE POLICY "Users can send messages for available properties"
ON public.guest_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_id
    AND p.moderation_status = 'approved'
    AND p.status IN ('disponible', 'en_negociation')
  )
);

-- 3. Fix user_verifications - remove all user access policies
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres vérifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leurs vérifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Users can view their own verification" ON public.user_verifications;
DROP POLICY IF EXISTS "Users can update their own verification" ON public.user_verifications;
DROP POLICY IF EXISTS "Users can insert their own verification" ON public.user_verifications;

-- Only allow INSERT through system (for initial creation)
CREATE POLICY "System creates user verifications"
ON public.user_verifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT EXISTS (
  SELECT 1 FROM user_verifications WHERE user_id = auth.uid()
));

-- Only allow UPDATE through secure functions (admins only via policies we already have)
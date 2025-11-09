-- ===================================
-- FIX 1: Protéger les données personnelles dans profiles
-- ===================================

-- Supprimer les anciennes politiques SELECT problématiques
DROP POLICY IF EXISTS "Users can view profiles with business relationship" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles with active rental relationship" ON public.profiles;

-- Nouvelle politique SELECT stricte : uniquement son propre profil + profils publics via RPC
CREATE POLICY "Users can only view own profile directly"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- ===================================
-- FIX 2: Sécuriser guest_messages
-- ===================================

-- Supprimer toutes les politiques SELECT existantes
DROP POLICY IF EXISTS "Property owners can view their messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Admins can view all guest messages" ON public.guest_messages;

-- Nouvelle politique SELECT stricte
CREATE POLICY "Only property owners can view their own messages"
ON public.guest_messages FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Limiter l'INSERT pour éviter le spam
DROP POLICY IF EXISTS "Authenticated users can send guest messages" ON public.guest_messages;
DROP POLICY IF EXISTS "Users can send messages for active properties" ON public.guest_messages;

CREATE POLICY "Users can send messages for available properties only"
ON public.guest_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id
      AND p.moderation_status = 'approved'
      AND p.status IN ('disponible', 'en_negociation')
  )
);

-- ===================================
-- FIX 3: Durcir l'accès à user_verifications
-- ===================================

-- Supprimer TOUTES les politiques SELECT directes
DROP POLICY IF EXISTS "Super admins can view all verifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Admins can view verifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Only super admins can view verifications directly" ON public.user_verifications;

-- Nouvelle politique : UNIQUEMENT super_admin avec audit
CREATE POLICY "Only super_admin with audit can view verifications"
ON public.user_verifications FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  AND public.require_admin_mfa()
);

-- Les utilisateurs doivent utiliser get_my_verification_status() pour voir leur statut
-- Les admins doivent utiliser get_pending_verifications_list() (sans données sensibles)
-- Seuls les super_admins avec 2FA peuvent SELECT directement
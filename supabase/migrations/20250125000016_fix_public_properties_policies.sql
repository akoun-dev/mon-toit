-- Migration: Fix Public Properties RLS Policies
-- Description: Corriger les politiques RLS pour permettre l'accès public aux propriétés disponibles

-- Supprimer TOUTES les policies existantes sur properties pour éviter les conflits
DROP POLICY IF EXISTS "Properties are publicly viewable" ON public.properties;
DROP POLICY IF EXISTS "Owners can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;

-- Recréer les policies avec la bonne hiérarchie
-- 1. Policy publique pour les propriétés disponibles (priorité la plus basse)
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT USING (status = 'disponible'::text);

-- 2. Policy pour les propriétaires (priorité moyenne)
CREATE POLICY "Owners can view own properties" ON public.properties
  FOR SELECT USING (
    (auth.uid() IS NOT NULL) AND
    (owner_id = auth.uid())
  );

-- 3. Policy pour les admins (priorité la plus haute)
CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin_ansut'
    ))
  );

-- Policies pour les autres opérations (CRUD)
CREATE POLICY "Owners can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL) AND
    (owner_id = auth.uid())
  );

CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL) AND
    (owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE USING (
    (auth.uid() IS NOT NULL) AND
    (owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin_ansut'
    ))
  ) WITH CHECK (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin_ansut'
    ))
  );

-- Supprimer TOUTES les policies existantes sur rental_applications
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON public.rental_applications;
DROP POLICY IF EXISTS "Public read access to application counts" ON public.rental_applications;
DROP POLICY IF EXISTS "Users can insert own rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Users can update own rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Users can view own rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Admins can view all rental applications" ON public.rental_applications;

-- Recréer les policies pour rental_applications
CREATE POLICY "Users can view own rental applications" ON public.rental_applications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL) AND
    (applicant_id = auth.uid())
  );

CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id AND p.owner_id = auth.uid()
    ))
  );

CREATE POLICY "Admins can view all rental applications" ON public.rental_applications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin_ansut'
    ))
  );

CREATE POLICY "Users can insert own rental applications" ON public.rental_applications
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL) AND
    (applicant_id = auth.uid())
  );

CREATE POLICY "Users can update own rental applications" ON public.rental_applications
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL) AND
    (applicant_id = auth.uid())
  );

-- S'assurer que RLS est activé sur les deux tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Accorder les permissions nécessaires
GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.rental_applications TO authenticated;

-- Commentaires pour la documentation
COMMENT ON POLICY "Properties are publicly viewable" ON public.properties IS 'Permet l''accès public aux propriétés avec statut disponible';
COMMENT ON POLICY "Owners can view own properties" ON public.properties IS 'Permet aux propriétaires de voir leurs propriétés';
COMMENT ON POLICY "Admins can view all properties" ON public.properties IS 'Permet aux admins de voir toutes les propriétés';

COMMENT ON POLICY "Users can view own rental applications" ON public.rental_applications IS 'Permet aux utilisateurs de voir leurs candidatures';
COMMENT ON POLICY "Property owners can view applications for their properties" ON public.rental_applications IS 'Permet aux propriétaires de voir les candidatures pour leurs propriétés';
COMMENT ON POLICY "Admins can view all rental applications" ON public.rental_applications IS 'Permet aux admins de voir toutes les candidatures';
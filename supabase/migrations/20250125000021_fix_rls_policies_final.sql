-- Migration: Fix Final RLS Policies
-- Description: Corriger définitivement les politiques RLS pour permettre l'accès public

-- Supprimer toutes les policies existantes sur properties
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Récupérer toutes les policies sur la table properties
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'properties'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', policy_record.policyname);
  END LOOP;
END $$;

-- Recréer les policies dans le bon ordre de priorité

-- 1. Policy publique (la plus permissive, s'applique en dernier)
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT USING (status = 'disponible'::text);

-- 2. Policy pour les propriétaires
CREATE POLICY "Owners can manage own properties" ON public.properties
  FOR ALL USING (
    (auth.uid() IS NOT NULL) AND
    (owner_id = auth.uid())
  ) WITH CHECK (
    (auth.uid() IS NOT NULL) AND
    (owner_id = auth.uid())
  );

-- 3. Policy pour les admins (la plus restrictive, s'applique en premier)
CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::user_type
    ))
  ) WITH CHECK (
    (auth.uid() IS NOT NULL) AND
    (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::user_type
    ))
  );

-- Corriger les policies pour rental_applications
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Récupérer toutes les policies sur la table rental_applications
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rental_applications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rental_applications', policy_record.policyname);
  END LOOP;
END $$;

-- Recréer les policies pour rental_applications
CREATE POLICY "Users can manage own rental applications" ON public.rental_applications
  FOR ALL USING (
    (auth.uid() IS NOT NULL) AND
    (applicant_id = auth.uid())
  ) WITH CHECK (
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
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::user_type
    ))
  );

-- S'assurer que RLS est activé
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Accorder les permissions
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rental_applications TO authenticated;


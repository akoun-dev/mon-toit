-- Clean duplicate RLS policies and recreate them properly
-- This migration drops all existing RLS policies for problematic tables and recreates them

-- Drop all existing RLS policies for properties
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'properties'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.properties';
    END LOOP;
    
    RAISE NOTICE '✓ Dropped all existing policies for properties table';
END $$;

-- Drop all existing RLS policies for user_favorites
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_favorites'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.user_favorites';
    END LOOP;
    
    RAISE NOTICE '✓ Dropped all existing policies for user_favorites table';
END $$;

-- Drop all existing RLS policies for rental_applications
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'rental_applications'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.rental_applications';
    END LOOP;
    
    RAISE NOTICE '✓ Dropped all existing policies for rental_applications table';
END $$;

-- Recreate RLS policies for properties
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT USING (status = 'disponible');

CREATE POLICY "Owners can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
    )
  );

CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
    )
  );

-- Recreate RLS policies for user_favorites
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own favorites' AND tablename = 'user_favorites') THEN
    CREATE POLICY "Users can manage own favorites" ON public.user_favorites
      FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;
END $$;

-- Recreate RLS policies for rental_applications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own rental applications' AND tablename = 'rental_applications') THEN
    CREATE POLICY "Users can view own rental applications" ON public.rental_applications
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
          applicant_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::public.user_type
          )
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Property owners can view applications for their properties' AND tablename = 'rental_applications') THEN
    CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM public.properties p
          WHERE p.id = property_id AND p.owner_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own rental applications' AND tablename = 'rental_applications') THEN
    CREATE POLICY "Users can insert own rental applications" ON public.rental_applications
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND applicant_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own rental applications' AND tablename = 'rental_applications') THEN
    CREATE POLICY "Users can update own rental applications" ON public.rental_applications
      FOR UPDATE USING (auth.uid() IS NOT NULL AND applicant_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies cleaned and recreated successfully';
  RAISE NOTICE '📊 Summary of changes:';
  RAISE NOTICE '  - Dropped all duplicate policies for properties, user_favorites, rental_applications';
  RAISE NOTICE '  - Recreated clean RLS policies with proper auth.uid() checks';
  RAISE NOTICE '  - All policies now handle unauthenticated users correctly';
END $$;
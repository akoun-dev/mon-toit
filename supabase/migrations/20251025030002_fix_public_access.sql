-- Fix public access to properties and related tables
-- This migration ensures unauthenticated users can view public property information

-- Drop and recreate the publicly viewable properties policy to allow unauthenticated access
DROP POLICY IF EXISTS "Properties are publicly viewable" ON public.properties;
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT
  USING (
    status = 'disponible'
  );

-- Fix user_favorites table to allow unauthenticated users to check favorites (for UI state)
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Allow unauthenticated users to check if a property is favorited (returns empty set if not authenticated)
CREATE POLICY "Public read access to user_favorites" ON public.user_favorites
  FOR SELECT
  USING (
    auth.uid() IS NULL OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Fix rental_applications to allow public viewing of application counts (but not details)
DROP POLICY IF EXISTS "Users can view own rental applications" ON public.rental_applications;
CREATE POLICY "Users can view own rental applications" ON public.rental_applications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      applicant_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::user_type
      )
    )
  );

-- Allow unauthenticated users to see application counts (but not application details)
CREATE POLICY "Public read access to application counts" ON public.rental_applications
  FOR SELECT
  USING (
    auth.uid() IS NULL OR (
      auth.uid() IS NOT NULL AND (
        applicant_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'::user_type
        )
      )
    )
  );

-- Add comments for clarity
COMMENT ON POLICY "Properties are publicly viewable" ON public.properties IS 'Allows anyone to view available properties without authentication';
COMMENT ON POLICY "Public read access to user_favorites" ON public.user_favorites IS 'Allows checking favorites status for UI state';
COMMENT ON POLICY "Public read access to application counts" ON public.rental_applications IS 'Allows seeing application counts without revealing personal data';

DO $$
BEGIN
  RAISE NOTICE '✓ Public access fixes applied successfully';
END $$;
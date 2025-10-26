-- Fix public access to rental_applications table
-- This migration ensures proper handling of unauthenticated users

-- Drop existing policies that might not handle unauthenticated users correctly
DROP POLICY IF EXISTS "Users can view own rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON public.rental_applications;
DROP POLICY IF EXISTS "Admins can view all rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Users can insert own rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Users can update own rental applications" ON public.rental_applications;
DROP POLICY IF EXISTS "Public read access to application counts" ON public.rental_applications;

-- Create new policies with proper public access handling

-- Policy for authenticated users to view their own applications
CREATE POLICY "Users can view own rental applications" ON public.rental_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND applicant_id = auth.uid()
  );

-- Policy for property owners to view applications for their properties
CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id
      AND p.owner_id = auth.uid()
    )
  );

-- Policy for admins to view all applications
CREATE POLICY "Admins can view all rental applications" ON public.rental_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type::text = 'admin_ansut'
    )
  );

-- Policy for users to insert their own applications
CREATE POLICY "Users can insert own rental applications" ON public.rental_applications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND applicant_id = auth.uid()
  );

-- Policy for users to update their own applications
CREATE POLICY "Users can update own rental applications" ON public.rental_applications
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND applicant_id = auth.uid()
  );

-- Grant necessary permissions
GRANT SELECT ON public.rental_applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.rental_applications TO authenticated;

-- Add comments for clarity
COMMENT ON POLICY "Users can view own rental applications" ON public.rental_applications IS 'Allows authenticated users to view their own applications';
COMMENT ON POLICY "Property owners can view applications for their properties" ON public.rental_applications IS 'Allows property owners to view applications for their properties';
COMMENT ON POLICY "Admins can view all rental applications" ON public.rental_applications IS 'Allows admins to view all applications';

DO $$
BEGIN
  RAISE NOTICE '✓ Fixed access policies for rental_applications table';
  RAISE NOTICE '  - Properly handles authenticated and unauthenticated users';
  RAISE NOTICE '  - Users can manage their own applications';
  RAISE NOTICE '  - Property owners can view applications for their properties';
  RAISE NOTICE '  - Admins can view all applications';
END $$;
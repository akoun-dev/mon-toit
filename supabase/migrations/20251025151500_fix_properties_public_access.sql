-- Fix public access to properties table
-- This migration ensures unauthenticated users can view available properties

-- Drop all existing policies on properties to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Get all policies on the properties table
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'properties'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies with proper public access handling

-- Policy for public access to available properties (most permissive, applies last)
CREATE POLICY "Properties are publicly viewable" ON public.properties
  FOR SELECT USING (status::text = 'disponible');

-- Policy for property owners to manage their properties
CREATE POLICY "Owners can manage own properties" ON public.properties
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND owner_id = auth.uid()
  ) WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_id = auth.uid()
  );

-- Policy for admins to manage all properties
CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type::text = 'admin_ansut'
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type::text = 'admin_ansut'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

-- Add comments for clarity
COMMENT ON POLICY "Properties are publicly viewable" ON public.properties IS 'Allows anyone to view available properties without authentication';
COMMENT ON POLICY "Owners can manage own properties" ON public.properties IS 'Allows property owners to manage their own properties';
COMMENT ON POLICY "Admins can manage all properties" ON public.properties IS 'Allows admins to manage all properties';

DO $$
BEGIN
  RAISE NOTICE '✓ Fixed access policies for properties table';
  RAISE NOTICE '  - Unauthenticated users can view available properties';
  RAISE NOTICE '  - Property owners can manage their properties';
  RAISE NOTICE '  - Admins can manage all properties';
END $$;
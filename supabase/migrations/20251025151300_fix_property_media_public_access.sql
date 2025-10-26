-- Fix public access to property_media table
-- This migration ensures unauthenticated users can view media for available properties

-- Drop existing policy that doesn't handle unauthenticated users correctly
DROP POLICY IF EXISTS "Property media is viewable by property owners and public" ON public.property_media;

-- Create new policy that properly handles unauthenticated users
CREATE POLICY "Property media is publicly viewable for available properties" ON public.property_media
  FOR SELECT USING (
    -- Allow access if property is available (public access)
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.property_media.property_id
      AND p.status::text = 'disponible'
    )
    OR
    -- Or if user is the property owner
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = public.property_media.property_id
        AND p.owner_id = auth.uid()
      )
    )
  );

-- Drop and recreate the existing policy for property owners to manage their media
DROP POLICY IF EXISTS "Property owners can manage their property media" ON public.property_media;
CREATE POLICY "Property owners can manage their property media" ON public.property_media
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = public.property_media.property_id
      AND p.owner_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.property_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_media TO authenticated;

-- Add comment for clarity
COMMENT ON POLICY "Property media is publicly viewable for available properties" ON public.property_media IS 'Allows anyone to view media for available properties without authentication';

DO $$
BEGIN
  RAISE NOTICE '✓ Fixed public access to property_media table';
  RAISE NOTICE '  - Unauthenticated users can now view media for available properties';
  RAISE NOTICE '  - Property owners can manage their property media';
END $$;
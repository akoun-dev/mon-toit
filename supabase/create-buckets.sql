-- Create Supabase Storage buckets for Mon Toit application
-- This script creates all necessary storage buckets for file uploads

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Storage buckets needed by the application
DO $$
DECLARE
  bucket_name TEXT;
  bucket_list TEXT[] := ARRAY[
    'property-images',
    'property-videos',
    'property-360',
    'property-plans',
    'property-documents',
    'user-documents',
    'lease-documents',
    'avatars',
    'verification-documents'
  ];
BEGIN
  FOREACH bucket_name IN ARRAY bucket_list
  LOOP
    BEGIN
      -- Insert bucket into storage.buckets table
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        gen_random_uuid(),
        bucket_name,
        true,
        52428800, -- 50MB
        ARRAY[
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      )
      ON CONFLICT (name) DO NOTHING;

      RAISE NOTICE '✓ Bucket created or already exists: %', bucket_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠ Could not create bucket %: %', bucket_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Row Level Security (RLS) policies for each bucket

-- Property images bucket - public read, authenticated write
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Property images - Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Property images - Authenticated write access" ON storage.objects;

  -- Public read access for property images
  CREATE POLICY "Property images - Public read access" ON storage.objects
    FOR SELECT USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-images')
    );

  -- Authenticated write access for property images
  CREATE POLICY "Property images - Authenticated write access" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-images') AND
      auth.role() = 'authenticated'
    );

  -- Update access for property images
  CREATE POLICY "Property images - Authenticated update access" ON storage.objects
    FOR UPDATE USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-images') AND
      auth.role() = 'authenticated'
    );

  -- Delete access for property images
  CREATE POLICY "Property images - Authenticated delete access" ON storage.objects
    FOR DELETE USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-images') AND
      auth.role() = 'authenticated'
    );
END $$;

-- Property documents bucket - authenticated users only
DO $$
BEGIN
  DROP POLICY IF EXISTS "Property documents - Authenticated access" ON storage.objects;

  CREATE POLICY "Property documents - Authenticated access" ON storage.objects
    FOR ALL USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-documents') AND
      auth.role() = 'authenticated'
    ) WITH CHECK (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-documents') AND
      auth.role() = 'authenticated'
    );
END $$;

-- User documents bucket - authenticated users only
DO $$
BEGIN
  DROP POLICY IF EXISTS "User documents - Authenticated access" ON storage.objects;

  CREATE POLICY "User documents - Authenticated access" ON storage.objects
    FOR ALL USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'user-documents') AND
      auth.role() = 'authenticated'
    ) WITH CHECK (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'user-documents') AND
      auth.role() = 'authenticated'
    );
END $$;

-- Lease documents bucket - authenticated users only
DO $$
BEGIN
  DROP POLICY IF EXISTS "Lease documents - Authenticated access" ON storage.objects;

  CREATE POLICY "Lease documents - Authenticated access" ON storage.objects
    FOR ALL USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'lease-documents') AND
      auth.role() = 'authenticated'
    ) WITH CHECK (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'lease-documents') AND
      auth.role() = 'authenticated'
    );
END $$;

-- Avatars bucket - public read, authenticated write
DO $$
BEGIN
  DROP POLICY IF EXISTS "Avatars - Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars - Authenticated write access" ON storage.objects;

  CREATE POLICY "Avatars - Public read access" ON storage.objects
    FOR SELECT USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'avatars')
    );

  CREATE POLICY "Avatars - Authenticated write access" ON storage.objects
    FOR ALL USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'avatars') AND
      auth.role() = 'authenticated'
    ) WITH CHECK (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'avatars') AND
      auth.role() = 'authenticated'
    );
END $$;

-- Other property buckets (videos, 360, plans) - authenticated users only
DO $$
DECLARE
  bucket_name TEXT;
  bucket_list TEXT[] := ARRAY['property-videos', 'property-360', 'property-plans'];
BEGIN
  FOREACH bucket_name IN ARRAY bucket_list
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects
        FOR ALL USING (
          bucket_id = (SELECT id FROM storage.buckets WHERE name = %L) AND
          auth.role() = ''authenticated''
        ) WITH CHECK (
          bucket_id = (SELECT id FROM storage.buckets WHERE name = %L) AND
          auth.role() = ''authenticated''
        );
    ',
      'Property bucket policy - ' || bucket_name,
      'Property bucket policy - ' || bucket_name,
      bucket_name,
      bucket_name
    );

    RAISE NOTICE '✓ Policy created for bucket: %', bucket_name;
  END LOOP;
END $$;

-- Verification documents bucket - authenticated users only
DO $$
BEGIN
  DROP POLICY IF EXISTS "Verification documents - Authenticated access" ON storage.objects;

  CREATE POLICY "Verification documents - Authenticated access" ON storage.objects
    FOR ALL USING (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'verification-documents') AND
      auth.role() = 'authenticated'
    ) WITH CHECK (
      bucket_id = (SELECT id FROM storage.buckets WHERE name = 'verification-documents') AND
      auth.role() = 'authenticated'
    );
END $$;

RAISE NOTICE '✅ All storage buckets and policies created successfully!';
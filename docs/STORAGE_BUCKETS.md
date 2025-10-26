# Supabase Storage Buckets Documentation

## Overview

This document describes the storage buckets used by the Mon Toit application for file uploads and management.

## Created Buckets

### 1. property-documents ✅
- **Purpose**: Storage for property-related documents (title deeds, legal documents, etc.)
- **Public Access**: Yes
- **File Size Limit**: 50MB
- **Allowed MIME Types**:
  - `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - `video/mp4`, `video/webm`
  - `application/pdf`, `text/plain`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Migration File**: `20251026120000_create_property_documents_bucket.sql`
- **Used by**: `TitleDeedUploader.tsx`

### 2. role-transformation-docs
- **Purpose**: Storage for role transformation documents
- **Public Access**: No (Private)
- **File Size Limit**: 10MB
- **Allowed MIME Types**: Images and PDFs
- **Migration File**: `20251026100000_create_role_transformation_storage.sql`

### 3. temp-transformation-docs
- **Purpose**: Temporary storage for role transformation process
- **Public Access**: No (Private)
- **File Size Limit**: 5MB
- **Used by**: Role transformation service

## Storage Usage

### Property Documents Flow
```typescript
// Upload structure: /property-documents/{propertyId}/title_deed.{ext}
const filePath = `${propertyId}/title_deed.${fileExt}`;

const { data, error } = await supabase.storage
  .from('property-documents')
  .upload(filePath, file, {
    upsert: true,
    cacheControl: '3600',
  });
```

### Access Control
All buckets use Row Level Security (RLS) policies to control access:

1. **Authenticated users** can upload, read, update, and delete files
2. **Anonymous users** can read public files only
3. **File path validation** ensures users can only access their own files

## Creating New Buckets

To create a new storage bucket:

1. **Create migration file** with timestamp format:
   ```
   supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
   ```

2. **Add bucket creation SQL**:
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'bucket-name',
     'bucket-name',
     true, -- or false for private
     52428800, -- 50MB limit
     ARRAY['image/jpeg', 'image/png', 'application/pdf']
   ) ON CONFLICT (id) DO NOTHING;
   ```

3. **Add RLS policies**:
   ```sql
   CREATE POLICY "Policy name" ON storage.objects
     FOR SELECT USING (
       bucket_id = 'bucket-name' AND
       auth.role() = 'authenticated'
     );
   ```

4. **Execute migration**:
   ```bash
   docker exec supabase_db_mon-toit psql -U postgres -d postgres -f migration_file.sql
   ```

## Common Issues & Solutions

### Bucket Not Found Error
**Error**: `Bucket not found Object`
**Solution**: Ensure the bucket exists and has proper RLS policies

```sql
-- Check if bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'bucket-name';

-- Create bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bucket-name', 'bucket-name', true, 52428800, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;
```

### Permission Denied Error
**Error**: `signature verification failed` or `permission denied`
**Solution**: Check RLS policies and user permissions

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Test bucket access with service role key
```

### File Size Limit Error
**Error**: `File size exceeds limit`
**Solution**: Increase file_size_limit in bucket configuration

```sql
UPDATE storage.buckets
SET file_size_limit = 104857600 -- 100MB
WHERE name = 'bucket-name';
```

## Best Practices

1. **Use descriptive bucket names** that reflect their purpose
2. **Set appropriate file size limits** based on expected file types
3. **Configure MIME types** to only allow necessary file formats
4. **Always use RLS policies** to secure access to files
5. **Test bucket functionality** after creation
6. **Document bucket usage** in code comments and documentation

## Migration Template

Use this template for new storage bucket migrations:

```sql
-- Description: Brief description of bucket purpose
-- Migration: YYYYMMDDHHMMSS_descriptive_name.sql

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bucket-name',
  'bucket-name',
  true, -- public access
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can access bucket-name" ON storage.objects;
CREATE POLICY "Users can access bucket-name" ON storage.objects
  FOR ALL USING (
    bucket_id = 'bucket-name' AND
    auth.role() = 'authenticated'
  );
```
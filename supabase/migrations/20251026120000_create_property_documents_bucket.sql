-- Créer le bucket de stockage pour les documents de propriété (titres de propriété, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-documents',
  'property-documents',
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
) ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket property-documents
-- Les utilisateurs authentifiés peuvent uploader des documents de propriété
CREATE POLICY "Users can upload property documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated'
  );

-- Les utilisateurs authentifiés peuvent lire les documents de propriété (public)
CREATE POLICY "Users can read property documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'property-documents' AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- Les utilisateurs authentifiés peuvent mettre à jour leurs propres documents
CREATE POLICY "Users can update property documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated'
  );

-- Les utilisateurs authentifiés peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete property documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated'
  );
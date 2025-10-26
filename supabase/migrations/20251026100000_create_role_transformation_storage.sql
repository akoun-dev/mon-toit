-- Créer le bucket de stockage pour les documents de transformation de rôle
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'role-transformation-docs',
  'role-transformation-docs',
  false,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'image/jpg'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket role-transformation-docs
CREATE POLICY "Users can upload their own transformation documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'role-transformation-docs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own transformation documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'role-transformation-docs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own transformation documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'role-transformation-docs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can manage all transformation documents" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'role-transformation-docs' AND
    (
      EXISTS (
        SELECT 1 FROM public.user_active_roles uar
        WHERE uar.user_id = auth.uid() AND uar.active_role = 'admin_ansut'
      )
    )
  );

-- Créer un bucket pour les documents temporaires de transformation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-transformation-docs',
  'temp-transformation-docs',
  false,
  5242880, -- 5MB pour les documents temporaires
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'image/jpg'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket temporaire (accès limité et court)
CREATE POLICY "Authenticated users can upload temp transformation docs" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'temp-transformation-docs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own temp transformation docs" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'temp-transformation-docs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ajouter des index pour optimiser les performances de la table role_change_requests
CREATE INDEX IF NOT EXISTS idx_role_requests_user_created_at
ON public.role_change_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_role_requests_status_created_at
ON public.role_change_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_role_requests_to_role_status
ON public.role_change_requests(to_role, status);

-- Fonction pour nettoyer les anciens documents temporaires
CREATE OR REPLACE FUNCTION cleanup_temp_transformation_docs()
RETURNS void AS $$
BEGIN
  -- Supprimer les documents temporaires de plus de 24h
  DELETE FROM storage.objects
  WHERE bucket_id = 'temp-transformation-docs'
    AND created_at < NOW() - INTERVAL '24 hours';

  -- Logger le nettoyage
  INSERT INTO public.admin_logs (
    action_type,
    details,
    severity,
    created_at
  ) VALUES (
    'cleanup_temp_docs',
    json_build_object(
      'deleted_count', ROW_COUNT,
      'cleanup_time', NOW()
    ),
    'info',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction pour vérifier l'espace de stockage utilisé
CREATE OR REPLACE FUNCTION get_transformation_storage_stats()
RETURNS TABLE (
  bucket_name text,
  total_files bigint,
  total_size bigint,
  avg_file_size numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bucket_id,
    COUNT(*) as total_files,
    SUM(CAST(meta->>'size' AS BIGINT)) as total_size,
    AVG(CAST(meta->>'size' AS BIGINT)) as avg_file_size
  FROM storage.objects
  WHERE bucket_id IN ('role-transformation-docs', 'temp-transformation-docs')
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION cleanup_temp_transformation_docs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_transformation_storage_stats() TO authenticated;

-- Commentaires
COMMENT ON STORAGE.BUCKET role-transformation-docs IS 'Stockage sécurisé pour les documents de transformation de rôle (propriétaire, agence, etc.)';
COMMENT ON STORAGE.BUCKET temp-transformation-docs IS 'Stockage temporaire pour les documents en cours de validation';
COMMENT ON FUNCTION cleanup_temp_transformation_docs() IS 'Nettoie les documents temporaires de plus de 24h';
COMMENT ON FUNCTION get_transformation_storage_stats() IS 'Statistiques d utilisation du stockage de transformation';
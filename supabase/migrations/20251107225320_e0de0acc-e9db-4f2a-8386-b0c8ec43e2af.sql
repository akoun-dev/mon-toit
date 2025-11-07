-- Phase 3 & 4 : Bucket Storage + Colonnes NeoFace

-- ========================================
-- Créer le bucket verification-documents
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy : Upload pour utilisateurs authentifiés
CREATE POLICY "Users can upload own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy : Public read (nécessaire pour NeoFace)
CREATE POLICY "Public read for verification documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'verification-documents');

-- ========================================
-- Ajouter colonnes NeoFace à user_verifications
-- ========================================
ALTER TABLE user_verifications 
ADD COLUMN IF NOT EXISTS neoface_document_id TEXT,
ADD COLUMN IF NOT EXISTS neoface_status TEXT,
ADD COLUMN IF NOT EXISTS neoface_matching_score INTEGER;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_neoface_document_id 
ON user_verifications(neoface_document_id);

-- Commentaire pour archivage
COMMENT ON COLUMN user_verifications.face_similarity_score IS 'Legacy: Used by Smile ID, now replaced by neoface_matching_score';

-- ========================================
-- Vue de monitoring NeoFace
-- ========================================
CREATE OR REPLACE VIEW neoface_verification_stats AS
SELECT 
  DATE(face_verified_at) as verification_date,
  COUNT(*) as total_verifications,
  COUNT(*) FILTER (WHERE face_verification_status = 'verified') as successful,
  COUNT(*) FILTER (WHERE face_verification_status = 'failed') as failed,
  AVG(neoface_matching_score) as avg_score,
  MIN(neoface_matching_score) as min_score,
  MAX(neoface_matching_score) as max_score
FROM user_verifications
WHERE face_verified_at IS NOT NULL
GROUP BY DATE(face_verified_at)
ORDER BY verification_date DESC;
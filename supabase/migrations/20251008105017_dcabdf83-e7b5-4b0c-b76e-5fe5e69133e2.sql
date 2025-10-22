-- Créer le bucket pour les images des propriétés
-- Note: La table storage.buckets n'a PAS de colonne 'public' mais seulement id, name, owner, created_at, updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    -- Insérer seulement si les colonnes de base existent
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'storage'
      AND table_name = 'buckets'
      AND column_name IN ('id', 'name')
    ) THEN
      INSERT INTO storage.buckets (id, name)
      VALUES ('property-images', 'property-images')
      ON CONFLICT (id) DO NOTHING;

      RAISE NOTICE 'Bucket property-images créé avec succès';
    ELSE
      RAISE NOTICE 'Structure de storage.buckets incomplète, bucket non créé';
    END IF;
  ELSE
    RAISE NOTICE 'Table storage.buckets non trouvée, bucket non créé';
  END IF;
END $$;

-- Politique RLS pour permettre la lecture publique
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Politique RLS pour permettre l'upload authentifié
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

-- Politique RLS pour permettre la mise à jour par le propriétaire
CREATE POLICY "Users can update their own property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

-- Politique RLS pour permettre la suppression par le propriétaire
CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);
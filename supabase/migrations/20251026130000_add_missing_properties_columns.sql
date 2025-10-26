-- Ajouter les colonnes manquantes pour les médias des propriétés
-- Ces colonnes sont nécessaires pour le fonctionnement complet de l'application

-- Ajouter les colonnes de médias manquantes
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS main_image TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS panoramic_images JSONB,
ADD COLUMN IF NOT EXISTS floor_plans JSONB,
ADD COLUMN IF NOT EXISTS media_metadata JSONB,
ADD COLUMN IF NOT EXISTS work_status TEXT DEFAULT 'aucun_travail',
ADD COLUMN IF NOT EXISTS work_description TEXT,
ADD COLUMN IF NOT EXISTS work_images TEXT[],
ADD COLUMN IF NOT EXISTS work_estimated_cost INTEGER,
ADD COLUMN IF NOT EXISTS work_estimated_duration TEXT,
ADD COLUMN IF NOT EXISTS work_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS charges_amount INTEGER,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- Ajouter des commentaires pour clarifier l'usage des colonnes
COMMENT ON COLUMN properties.main_image IS 'URL de l''image principale de la propriété';
COMMENT ON COLUMN properties.images IS 'Tableau des URLs des images additionnelles';
COMMENT ON COLUMN properties.video_url IS 'URL de la vidéo de présentation';
COMMENT ON COLUMN properties.panoramic_images IS 'Données des images 360° au format JSON';
COMMENT ON COLUMN properties.floor_plans IS 'Plans d''étage au format JSON';
COMMENT ON COLUMN properties.media_metadata IS 'Métadonnées des fichiers médias';
COMMENT ON COLUMN properties.work_status IS 'Statut des travaux (aucun_travail, travaux_a_effectuer)';
COMMENT ON COLUMN properties.work_description IS 'Description des travaux à effectuer';
COMMENT ON COLUMN properties.work_images IS 'URLs des photos des travaux';
COMMENT ON COLUMN properties.work_estimated_cost IS 'Coût estimé des travaux';
COMMENT ON COLUMN properties.work_estimated_duration IS 'Durée estimée des travaux';
COMMENT ON COLUMN properties.work_start_date IS 'Date de début prévue des travaux';
COMMENT ON COLUMN properties.charges_amount IS 'Montant des charges mensuelles';
COMMENT ON COLUMN properties.is_new IS 'Indique si le bien est neuf ou récent';

-- Créer des index pour les nouvelles colonnes fréquemment utilisées
CREATE INDEX IF NOT EXISTS idx_properties_main_image ON properties(main_image) WHERE main_image IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_work_status ON properties(work_status) WHERE work_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_is_new ON properties(is_new);

-- Mettre à jour la contrainte de surface_area pour autoriser des surfaces plus grandes
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_surface_area_positive;
ALTER TABLE properties ADD CONSTRAINT properties_surface_area_positive
  CHECK (surface_area > 0 AND surface_area < 10000);

-- Mettre à jour la contrainte de bedrooms pour autoriser plus de chambres
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_bedrooms_reasonable;
ALTER TABLE properties ADD CONSTRAINT properties_bedrooms_reasonable
  CHECK (bedrooms >= 0 AND bedrooms <= 50);

-- Mettre à jour la contrainte de bathrooms pour autoriser plus de salles de bain
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_bathrooms_reasonable;
ALTER TABLE properties ADD CONSTRAINT properties_bathrooms_reasonable
  CHECK (bathrooms >= 0 AND bathrooms <= 20);

-- Ajouter une contrainte pour le work_status
ALTER TABLE properties ADD CONSTRAINT properties_work_status_check
  CHECK (work_status IN ('aucun_travail', 'travaux_a_effectuer'));

-- Mettre à jour les propriétés existantes pour avoir des valeurs par défaut
UPDATE properties
SET
  work_status = 'aucun_travail',
  is_new = false
WHERE work_status IS NULL OR is_new IS NULL;
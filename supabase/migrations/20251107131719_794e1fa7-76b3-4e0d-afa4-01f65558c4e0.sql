-- Phase 7.1 : Renommer toutes les colonnes ONECI en CNIB
-- Table: user_verifications

ALTER TABLE user_verifications 
  RENAME COLUMN oneci_status TO cnib_status;

ALTER TABLE user_verifications 
  RENAME COLUMN oneci_data TO cnib_data;

ALTER TABLE user_verifications 
  RENAME COLUMN oneci_cni_number TO cnib_number;

ALTER TABLE user_verifications 
  RENAME COLUMN oneci_verified_at TO cnib_verified_at;

-- Table: profiles
ALTER TABLE profiles 
  RENAME COLUMN oneci_verified TO cnib_verified;

-- Commentaires pour documentation
COMMENT ON COLUMN user_verifications.cnib_status IS 'Statut de vérification CNIB (Carte Nationale d''Identité Burkinabè) via ONI';
COMMENT ON COLUMN user_verifications.cnib_data IS 'Données de vérification CNIB retournées par l''ONI';
COMMENT ON COLUMN user_verifications.cnib_number IS 'Numéro CNIB burkinabè';
COMMENT ON COLUMN user_verifications.cnib_verified_at IS 'Date de vérification CNIB réussie';
COMMENT ON COLUMN profiles.cnib_verified IS 'Indicateur de vérification CNIB (ONI) réussie';
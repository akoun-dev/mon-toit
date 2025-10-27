-- Types manquants à créer
CREATE TYPE user_type AS ENUM ('locataire', 'proprietaire', 'agence', 'tiers_de_confiance', 'admin_ansut');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'expired');
CREATE TYPE certificate_status AS ENUM ('pending', 'verified', 'expired', 'revoked');
CREATE TYPE verification_status AS ENUM ('not_attempted', 'pending', 'verified', 'rejected');
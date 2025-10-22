-- Script pour définir les mots de passe des utilisateurs de test
-- À exécuter avec SERVICE ROLE dans Supabase SQL Editor

-- Mots de passe pour comptes de développement
UPDATE auth.users
SET encrypted_password = crypt('Test123!', gen_salt('bf'))
WHERE email = 'locataire@test.com';

UPDATE auth.users
SET encrypted_password = crypt('Test123!', gen_salt('bf'))
WHERE email = 'proprietaire1@test.com';

UPDATE auth.users
SET encrypted_password = crypt('Test123!', gen_salt('bf'))
WHERE email = 'agence1@test.com';

UPDATE auth.users
SET encrypted_password = crypt('Admin123!', gen_salt('bf'))
WHERE email = 'admin@test.com';

UPDATE auth.users
SET encrypted_password = crypt('Super123!', gen_salt('bf'))
WHERE email = 'super@test.com';

-- Mots de passe pour comptes de démonstration
UPDATE auth.users
SET encrypted_password = crypt('Demo2025!', gen_salt('bf'))
WHERE email = 'demo@locataire.ci';

UPDATE auth.users
SET encrypted_password = crypt('Demo2025!', gen_salt('bf'))
WHERE email = 'demo@proprietaire.ci';

UPDATE auth.users
SET encrypted_password = crypt('Demo2025!', gen_salt('bf'))
WHERE email = 'demo@agence.ci';

-- Mots de passe pour comptes de staging
UPDATE auth.users
SET encrypted_password = crypt('Staging2025!', gen_salt('bf'))
WHERE email = 'staging@locataire.ci';

UPDATE auth.users
SET encrypted_password = crypt('Staging2025!', gen_salt('bf'))
WHERE email = 'staging@proprietaire.ci';

UPDATE auth.users
SET encrypted_password = crypt('Staging2025!', gen_salt('bf'))
WHERE email = 'staging@agence.ci';

-- Vérification
SELECT email, 'Mot de passe mis à jour' as status FROM auth.users
WHERE email IN (
  'locataire@test.com', 'proprietaire1@test.com', 'agence1@test.com',
  'admin@test.com', 'super@test.com', 'demo@locataire.ci',
  'demo@proprietaire.ci', 'demo@agence.ci', 'staging@locataire.ci',
  'staging@proprietaire.ci', 'staging@agence.ci'
);
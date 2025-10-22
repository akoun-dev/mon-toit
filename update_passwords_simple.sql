-- Mettre à jour les mots de passe avec des caractères simples pour les tests curl
UPDATE auth.users
SET encrypted_password = crypt('test123', gen_salt('bf'))
WHERE email = 'locataire@test.com';

UPDATE auth.users
SET encrypted_password = crypt('test123', gen_salt('bf'))
WHERE email = 'proprietaire1@test.com';

UPDATE auth.users
SET encrypted_password = crypt('test123', gen_salt('bf'))
WHERE email = 'agence1@test.com';

UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@test.com';

UPDATE auth.users
SET encrypted_password = crypt('super123', gen_salt('bf'))
WHERE email = 'super@test.com';

-- Vérification
SELECT email, 'Password updated for curl testing' as status FROM auth.users
WHERE email IN (
  'locataire@test.com', 'proprietaire1@test.com', 'agence1@test.com',
  'admin@test.com', 'super@test.com'
);
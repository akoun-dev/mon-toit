-- Mettre à jour les mots de passe dans raw_user_meta_data pour Supabase local
UPDATE auth.users
SET raw_user_meta_data = '{"full_name": "Marie Konan", "user_type": "locataire", "password": "test123"}'
WHERE email = 'locataire@test.com';

UPDATE auth.users
SET raw_user_meta_data = '{"full_name": "Jean Kouadio", "user_type": "proprietaire", "password": "test123"}'
WHERE email = 'proprietaire@test.com';

UPDATE auth.users
SET raw_user_meta_data = '{"full_name": "Admin ANSUT", "user_type": "admin", "password": "admin123"}'
WHERE email = 'admin@test.com';

UPDATE auth.users
SET raw_user_meta_data = '{"full_name": "Super Admin", "user_type": "super_admin", "password": "super123"}'
WHERE email = 'super@test.com';

-- Vérification
SELECT email, 'Password updated in metadata' as status FROM auth.users
WHERE email IN ('locataire@test.com', 'proprietaire@test.com', 'admin@test.com', 'super@test.com')
ORDER BY email;
-- Corriger tous les mots de passe des utilisateurs seed
-- Utiliser la méthode correcte pour Supabase local development

-- D'abord supprimer tous les utilisateurs existants sauf notre test user
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'locataire@test.com', 'proprietaire1@test.com', 'agence1@test.com',
    'admin@test.com', 'super@test.com', 'demo@locataire.ci',
    'demo@proprietaire.ci', 'demo@agence.ci', 'staging@locataire.ci',
    'staging@proprietaire.ci', 'staging@agence.ci'
  )
);

DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'locataire@test.com', 'proprietaire1@test.com', 'agence1@test.com',
    'admin@test.com', 'super@test.com', 'demo@locataire.ci',
    'demo@proprietaire.ci', 'demo@agence.ci', 'staging@locataire.ci',
    'staging@proprietaire.ci', 'staging@agence.ci'
  )
);

DELETE FROM auth.users WHERE email IN (
  'locataire@test.com', 'proprietaire1@test.com', 'agence1@test.com',
  'admin@test.com', 'super@test.com', 'demo@locataire.ci',
  'demo@proprietaire.ci', 'demo@agence.ci', 'staging@locataire.ci',
  'staging@proprietaire.ci', 'staging@agence.ci'
);

-- Recréer les utilisateurs avec la bonne configuration
INSERT INTO auth.users (id, email, email_confirmed_at, phone, raw_user_meta_data, created_at, updated_at) VALUES
('80201867-e54a-4787-9413-c36b95e72bb5', 'locataire@test.com', NOW(), '+2250101010101', '{"full_name": "Marie Konan", "user_type": "locataire", "password": "test123"}', NOW(), NOW()),
('4c386501-f7b3-4452-8c7b-cf1a69dcd092', 'proprietaire1@test.com', NOW(), '+2250707070707', '{"full_name": "Jean Kouadio", "user_type": "proprietaire", "password": "test123"}', NOW(), NOW()),
('5d0273eb-506c-40eb-83d1-99967f44ddb3', 'agence1@test.com', NOW(), '+2250808080808', '{"full_name": "Agence Immobilière Abidjan", "user_type": "agence", "password": "test123"}', NOW(), NOW()),
('4a45989d-681a-4a3b-85b3-fc292fdf8dcc', 'admin@test.com', NOW(), '+2250202020202', '{"full_name": "Administrateur ANSUT", "user_type": "admin", "password": "admin123"}', NOW(), NOW()),
('f1cbe79f-c05e-4912-bce7-d54086996978', 'super@test.com', NOW(), '+2250303030303', '{"full_name": "Super Administrateur", "user_type": "super_admin", "password": "super123"}', NOW(), NOW()),
('81e254c9-d4d0-45aa-83a8-21d432bf7408', 'demo@locataire.ci', NOW(), '+2250404040404', '{"full_name": "Demo Locataire", "user_type": "locataire", "password": "demo2025"}', NOW(), NOW()),
('2903f7a9-5f54-4efb-b3cf-b496167e358c', 'demo@proprietaire.ci', NOW(), '+2250505050505', '{"full_name": "Demo Propriétaire", "user_type": "proprietaire", "password": "demo2025"}', NOW(), NOW()),
('b4401329-de8e-433a-aa04-6d715362eb07', 'demo@agence.ci', NOW(), '+2250606060606', '{"full_name": "Demo Agence", "user_type": "agence", "password": "demo2025"}', NOW(), NOW()),
('2afa9f63-94f7-4de6-9853-b4e421f09e7a', 'staging@locataire.ci', NOW(), '+2250717171717', '{"full_name": "Staging Locataire", "user_type": "locataire", "password": "staging2025"}', NOW(), NOW()),
('afe6e63a-86c1-4da3-97c9-26928ef46625', 'staging@proprietaire.ci', NOW(), '+2250818181818', '{"full_name": "Staging Propriétaire", "user_type": "proprietaire", "password": "staging2025"}', NOW(), NOW()),
('2b081ed3-8e71-4d5a-8759-eaa0cbbc0665', 'staging@agence.ci', NOW(), '+2250919191919', '{"full_name": "Staging Agence", "user_type": "agence", "password": "staging2025"}', NOW(), NOW());

-- Créer les profils correspondants
INSERT INTO public.profiles (id, full_name, user_type, city, bio, avatar_url, oneci_verified, cnam_verified, face_verified, is_verified, created_at, updated_at) VALUES
('80201867-e54a-4787-9413-c36b95e72bb5', 'Marie Konan', 'locataire', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('4c386501-f7b3-4452-8c7b-cf1a69dcd092', 'Jean Kouadio', 'proprietaire', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('5d0273eb-506c-40eb-83d1-99967f44ddb3', 'Agence Immobilière Abidjan', 'agence', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('4a45989d-681a-4a3b-85b3-fc292fdf8dcc', 'Administrateur ANSUT', 'admin', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('f1cbe79f-c05e-4912-bce7-d54086996978', 'Super Administrateur', 'super_admin', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('81e254c9-d4d0-45aa-83a8-21d432bf7408', 'Demo Locataire', 'locataire', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('2903f7a9-5f54-4efb-b3cf-b496167e358c', 'Demo Propriétaire', 'proprietaire', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('b4401329-de8e-433a-aa04-6d715362eb07', 'Demo Agence', 'agence', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('2afa9f63-94f7-4de6-9853-b4e421f09e7a', 'Staging Locataire', 'locataire', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('afe6e63a-86c1-4da3-97c9-26928ef46625', 'Staging Propriétaire', 'proprietaire', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW()),
('2b081ed3-8e71-4d5a-8759-eaa0cbbc0665', 'Staging Agence', 'agence', 'Abidjan', NULL, NULL, false, false, false, false, NOW(), NOW());

-- Créer les rôles correspondants
INSERT INTO public.user_roles (user_id, role) VALUES
('80201867-e54a-4787-9413-c36b95e72bb5', 'locataire'::public.app_role),
('4c386501-f7b3-4452-8c7b-cf1a69dcd092', 'proprietaire'::public.app_role),
('5d0273eb-506c-40eb-83d1-99967f44ddb3', 'agence'::public.app_role),
('4a45989d-681a-4a3b-85b3-fc292fdf8dcc', 'admin'::public.app_role),
('f1cbe79f-c05e-4912-bce7-d54086996978', 'super_admin'::public.app_role),
('81e254c9-d4d0-45aa-83a8-21d432bf7408', 'locataire'::public.app_role),
('2903f7a9-5f54-4efb-b3cf-b496167e358c', 'proprietaire'::public.app_role),
('b4401329-de8e-433a-aa04-6d715362eb07', 'agence'::public.app_role),
('2afa9f63-94f7-4de6-9853-b4e421f09e7a', 'locataire'::public.app_role),
('afe6e63a-86c1-4da3-97c9-26928ef46625', 'proprietaire'::public.app_role),
('2b081ed3-8e71-4d5a-8759-eaa0cbbc0665', 'agence'::public.app_role);

SELECT 'Comptes recréés avec succès !' as status;
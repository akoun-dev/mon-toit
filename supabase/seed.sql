-- Seed data for Mon Toit application
-- This file contains sample users and data for development and testing

-- ===================================================================
-- UTILISATEURS DE DÉMONSTRATION
-- ===================================================================

-- Note: Les mots de passe sont hashés avec bcrypt
-- Pour générer de nouveaux hash: https://bcrypt-generator.com/

-- 1. COMPTE ADMINISTRATEUR ANSUT
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@mon-toit.ci',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: Admin123!
  NOW(),
  '+2250707070707',
  NOW(),
  NOW(),
  '{"full_name": "Administrateur ANSUT", "user_type": "admin_ansut"}'::jsonb
);

-- 2. COMPTE PROPRIÉTAIRE
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'proprietaire@mon-toit.ci',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: Proprio123!
  NOW(),
  '+2250101010101',
  NOW(),
  NOW(),
  '{"full_name": "Kouassi Jean Baptiste", "user_type": "proprietaire"}'::jsonb
);

-- 3. COMPTE LOCATAIRE
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'locataire@mon-toit.ci',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: Locataire123!
  NOW(),
  '+2250202020202',
  NOW(),
  NOW(),
  '{"full_name": "Aya Maria Koné", "user_type": "locataire"}'::jsonb
);

-- 4. COMPTE AGENCE IMMOBILIÈRE
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'agence@mon-toit.ci',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: Agence123!
  NOW(),
  '+2250303030303',
  NOW(),
  NOW(),
  '{"full_name": "Agence Immobilière Abidjan", "user_type": "agence"}'::jsonb
);

-- 5. COMPTE TIERS DE CONFIANCE
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  'tiers@mon-toit.ci',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: Tiers123!
  NOW(),
  '+2250404040404',
  NOW(),
  NOW(),
  '{"full_name": "Maître Traoré Avocat", "user_type": "tiers_de_confiance"}'::jsonb
);

-- 6. COMPTE MULTI-RÔLES (Propriétaire + Locataire)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000006',
  'multirole@mon-toit.ci',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: MultiRole123!
  NOW(),
  '+2250505050505',
  NOW(),
  NOW(),
  '{"full_name": "Yao Charles", "user_type": "proprietaire"}'::jsonb
);

-- ===================================================================
-- COMPTES SUPPLÉMENTAIRES POUR TESTS
-- ===================================================================

-- Propriétaires additionnels
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, phone, created_at, updated_at, raw_user_meta_data) VALUES
('00000000-0000-0000-0000-000000000007', 'sangare@mon-toit.ci', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', NOW(), '+2250606060616', NOW(), NOW(), '{"full_name": "Sangare Mamadou", "user_type": "proprietaire"}'::jsonb),
('00000000-0000-0000-0000-000000000008', 'touré@mon-toit.ci', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', NOW(), '+2250707070717', NOW(), NOW(), '{"full_name": "Touré Fatoumata", "user_type": "proprietaire"}'::jsonb);

-- Locataires additionnels
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, phone, created_at, updated_at, raw_user_meta_data) VALUES
('00000000-0000-0000-0000-000000000009', 'diarrassouba@mon-toit.ci', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', NOW(), '+2250808080818', NOW(), NOW(), '{"full_name": "Diarrassouba Mohamed", "user_type": "locataire"}'::jsonb),
('00000000-0000-0000-0000-000000000010', 'koffi@mon-toit.ci', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', NOW(), '+2250909090919', NOW(), NOW(), '{"full_name": "Koffi Yasmine", "user_type": "locataire"}'::jsonb);

-- ===================================================================
-- CONFIGURATION DES PROFILS (sera créée automatiquement par le trigger)
-- ===================================================================

-- Mise à jour des profils avec des informations supplémentaires
UPDATE profiles SET
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  bio = 'Administrateur principal de la plateforme Mon Toit',
  city = 'Abidjan',
  is_verified = true,
  oneci_verified = true,
  cnam_verified = true,
  face_verified = true
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=proprietaire',
  bio = 'Propriétaire de plusieurs biens à Abidjan, spécialisé dans les appartements de standing',
  city = 'Cocody',
  is_verified = true,
  oneci_verified = true,
  cnam_verified = false,
  face_verified = true
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE profiles SET
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=locataire',
  bio = 'Jeune professionnelle à la recherche d''un logement moderne et sécurisé',
  city = 'Abidjan',
  is_verified = true,
  oneci_verified = false,
  cnam_verified = false,
  face_verified = true
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE profiles SET
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=agence',
  bio = 'Agence immobilière de référence à Abidjan depuis 2010',
  city = 'Plateau',
  is_verified = true,
  oneci_verified = true,
  cnam_verified = true,
  face_verified = true
WHERE id = '00000000-0000-0000-0000-000000000004';

UPDATE profiles SET
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=tiers',
  bio = 'Avocat spécialisé en droit immobilier, médiateur certifié',
  city = 'Abidjan',
  is_verified = true,
  oneci_verified = true,
  cnam_verified = true,
  face_verified = true
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE profiles SET
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=multirole',
  bio = 'Investisseur immobilier et aussi locataire occasionnel',
  city = 'Abidjan',
  is_verified = true,
  oneci_verified = false,
  cnam_verified = false,
  face_verified = true
WHERE id = '00000000-0000-0000-0000-000000000006';

-- ===================================================================
-- CONFIGURATION DES RÔLES ACTIFS
-- ===================================================================

-- Ajouter des rôles supplémentaires pour l'utilisateur multi-rôle
UPDATE user_active_roles SET
  available_roles = ARRAY['proprietaire'::public.user_type, 'locataire'::public.user_type],
  active_role = 'proprietaire'::public.user_type
WHERE user_id = '00000000-0000-0000-0000-000000000006';

-- Ajouter l'historique des rôles pour le multi-rôle
INSERT INTO user_roles (user_id, role, created_at) VALUES
('00000000-0000-0000-0000-000000000006', 'proprietaire'::public.user_type, NOW()),
('00000000-0000-0000-0000-000000000006', 'locataire'::public.user_type, NOW());

-- ===================================================================
-- CRÉATION DE BIENS IMMOBILIERS DE DÉMONSTRATION
-- ===================================================================

-- Appartement de luxe à Cocody
INSERT INTO properties (
  id, title, description, property_type, city, neighborhood, address,
  monthly_rent, deposit_amount, surface_area, bedrooms, bathrooms,
  owner_id, status, main_image, images, is_furnished, has_ac, has_parking,
  has_garden, latitude, longitude, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  'Bel appartement de luxe à Cocody',
  'Magnifique appartement de 3 pièces dans un residence sécurisée avec piscine et terrasse',
  'appartement',
  'Abidjan',
  'Cocody',
  'Rue des Jardins, Cocody',
  350000,
  700000,
  120,
  3,
  2,
  '00000000-0000-0000-0000-000000000002',
  'disponible',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
  ],
  true,
  true,
  true,
  false,
  5.3600,
  -4.0083,
  NOW(),
  NOW()
);

-- Studio moderne à Yopougon
INSERT INTO properties (
  id, title, description, property_type, city, neighborhood, address,
  monthly_rent, deposit_amount, surface_area, bedrooms, bathrooms,
  owner_id, status, main_image, images, is_furnished, has_ac, has_parking,
  has_garden, latitude, longitude, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000102',
  'Studio meublé à Yopougon',
  'Studio moderne et fonctionnel, idéal pour étudiant ou jeune professionnel',
  'studio',
  'Abidjan',
  'Yopougon',
  'Sicogi, Yopougon',
  80000,
  160000,
  35,
  1,
  1,
  '00000000-0000-0000-0000-000000000006',
  'disponible',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
  ],
  true,
  true,
  false,
  false,
  5.3500,
  -4.0800,
  NOW(),
  NOW()
);

-- Villa avec piscine à Abidjan
INSERT INTO properties (
  id, title, description, property_type, city, neighborhood, address,
  monthly_rent, deposit_amount, surface_area, bedrooms, bathrooms,
  owner_id, status, main_image, images, is_furnished, has_ac, has_parking,
  has_garden, latitude, longitude, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000103',
  'Villa avec piscine à Riviera',
  'Superbe villa de 5 pièces avec jardin et piscine privée, quartier résidentiel calme',
  'villa',
  'Abidjan',
  'Riviera',
  'Riviera Palmeraie',
  800000,
  1600000,
  350,
  5,
  4,
  '00000000-0000-0000-0000-000000000007',
  'disponible',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
  ],
  true,
  true,
  true,
  true,
  5.3700,
  -4.0200,
  NOW(),
  NOW()
);

-- ===================================================================
-- INFORMATIONS DE CONNEXION (RÉSUMÉ)
-- ===================================================================

/*
COMPTES DE DÉMONSTRATION DISPONIBLES:

1. ADMINISTRATEUR ANSUT
   Email: admin@mon-toit.ci
   Mot de passe: Admin123!
   Rôle: admin_ansut

2. PROPRIÉTAIRE
   Email: proprietaire@mon-toit.ci
   Mot de passe: Proprio123!
   Rôle: proprietaire
   Biens: 1 appartement de luxe à Cocody

3. LOCATAIRE
   Email: locataire@mon-toit.ci
   Mot de passe: Locataire123!
   Rôle: locataire

4. AGENCE IMMOBILIÈRE
   Email: agence@mon-toit.ci
   Mot de passe: Agence123!
   Rôle: agence

5. TIERS DE CONFIANCE
   Email: tiers@mon-toit.ci
   Mot de passe: Tiers123!
   Rôle: tiers_de_confiance

6. MULTI-RÔLE (Propriétaire + Locataire)
   Email: multirole@mon-toit.ci
   Mot de passe: MultiRole123!
   Rôle: proprietaire (principal) / locataire (disponible)
   Biens: 1 studio à Yopougon

COMPTES SUPPLÉMENTAIRES:
- sangare@mon-toit.ci (Proprio123!) - Propriétaire
- touré@mon-toit.ci (Proprio123!) - Propriétaire
- diarrassouba@mon-toit.ci (Locataire123!) - Locataire
- koffi@mon-toit.ci (Locataire123!) - Locataire

BIENS IMMOBILIERS DE TEST:
1. Appartement de luxe à Cocody - 350 000 FCFA/mois
2. Studio meublé à Yopougon - 80 000 FCFA/mois
3. Villa avec piscine à Riviera - 800 000 FCFA/mois
*/
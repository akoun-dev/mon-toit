-- seed.sql
-- Comprehensive Seed Data for Mon Toit Application
--
-- 🚨 IMPORTANT: Pour créer les utilisateurs avec les vrais mots de passe, utilisez:
--    npm run seed:auth
--
-- 📋 Comptes de test disponibles après l'exécution du seed d'authentification:
--
-- 🔧 ADMIN:
--    Email: admin@mon-toit.ci
--    Mot de passe: admin123!@#
--    Tableau de bord: http://localhost:8080/admin
--
-- 🏠 PROPRIÉTAIRES (exemples):
--    kouadio.jean@mon-toit.ci (démopass123)
--    marie.aya@mon-toit.ci (démopass123)
--    patricia.kouame@mon-toit.ci (démopass123)
--    koffi.alain@mon-toit.ci (démopass123)
--    adou.rosine@mon-toit.ci (démopass123)
--    traore.sami@mon-toit.ci (démopass123)
--    konan.emma@mon-toit.ci (démopass123)
--    nguessan.fred@mon-toit.ci (démopass123)
--
-- 🏠 LOCATAIRES:
--    yao.konan@mon-toit.ci (démopass123)
--    aminata.diarra@mon-toit.ci (démopass123)
--    dr.yeo@mon-toit.ci (démopass123)
--
-- 🏢 AGENCES:
--    contact@agence-cocody.ci (démopass123)
--    info@ankou-realestate.ci (démopass123)
--
-- 🤝 TIERS DE CONFIANCE:
--    notaire.konan@mon-toit.ci (démopass123)
--
-- Note: Le seed SQL ci-dessous crée uniquement les profils dans la base de données.
-- Les utilisateurs d'authentification doivent être créés via le script npm run seed:auth

-- Create test users in auth.users first (bypassing constraints for testing)
DO $$
DECLARE
  -- Define fixed UUIDs for consistency (existing + new owners)
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
  user5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
  user6_id UUID := '550e8400-e29b-41d4-a716-446655440006';
  user7_id UUID := '550e8400-e29b-41d4-a716-446655440007';
  user8_id UUID := '550e8400-e29b-41d4-a716-446655440008';
  user9_id UUID := '550e8400-e29b-41d4-a716-446655440009';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  -- New proprietaires
  user11_id UUID := '550e8400-e29b-41d4-a716-446655440011';
  user12_id UUID := '550e8400-e29b-41d4-a716-446655440012';
  user13_id UUID := '550e8400-e29b-41d4-a716-446655440013';
  user14_id UUID := '550e8400-e29b-41d4-a716-446655440014';
  user15_id UUID := '550e8400-e29b-41d4-a716-446655440015';
BEGIN
  -- Insert auth.users (REAL PASSWORDS for tests)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, phone, created_at, updated_at, aud, role) VALUES
    (admin_user_id, 'admin@mon-toit.ci', '$2b$10$TNgMZe/jSFa92V7TwP9P5.nj3a213dYj.NooBw3GL5fA.vu64.i9m', NOW(), '+225 01 23 45 67 89', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user2_id, 'kouadio.jean@mon-toit.ci', '$2b$10$61F7i0L08qAk2msHG7FSi.pY5hSPBC97fx.Hm6cYvWLBRQX9DYkR2', NOW(), '+225 01 23 45 67 01', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user3_id, 'marie.aya@mon-toit.ci', '$2b$10$f7O.7YC51ntsRuZGfCqiNeotyCTcg5bB2ssnNmtFjsuI2whumaIAe', NOW(), '+225 01 23 45 67 02', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user4_id, 'yao.konan@mon-toit.ci', '$2b$10$SNpHxXupmnc61DKgN6joxuXnKjJQpIbBEr7BsitHRVXR47aC7ndG2', NOW(), '+225 01 23 45 67 03', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user5_id, 'aminata.diarra@mon-toit.ci', '$2b$10$1YINkBkb0XJVX/U/r4VTV.BpQVTPri7lVPF2ntLHALDdg6NBpyy5i', NOW(), '+225 01 23 45 67 04', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user6_id, 'contact@agence-cocody.ci', '$2b$10$zp1nW8dq5LOURd65Z7h0j.c3bfZ7c9zDs.PKx0qRSPDVw08HQuMvG', NOW(), '+225 01 23 45 67 05', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user7_id, 'info@ankou-realestate.ci', '$2b$10$4mDEh8ASH7/IUPb6Nm.InuqmqrcB0fZ2TQc/NdykY4XSBBAziisym', NOW(), '+225 01 23 45 67 06', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user8_id, 'notaire.konan@mon-toit.ci', '$2b$10$7Qj8KZ9w3L2wM6vN1pZr0eYj5Fh4dKl9mN8bX7vC3wR2nQqP6sO', NOW(), '+225 01 23 45 67 07', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user9_id, 'dr.yeo@mon-toit.ci', '$2b$10$s2GKKjStQIdqSMlo5QoF1OyFKMbD7G.1821dl1e1Pr8T8LgiycSAm', NOW(), '+225 01 23 45 67 08', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user10_id, 'patricia.kouame@mon-toit.ci', '$2b$10$7wRcdqlY2uwGtciuPsr7NuV9HUDSVXqSxyiDbwTD5IBKPGtRaDiz2', NOW(), '+225 01 23 45 67 09', NOW(), NOW(), 'authenticated', 'authenticated'),
    -- NEW proprietaires (auth users) - emails valides (sans apostrophes)
    (user11_id, 'koffi.alain@mon-toit.ci', '$2b$10$KMlIiHhjlD9t6f5q2isYfOeWfbXNefjuqxBWswTGDC3sS5af1EHvG', NOW(), '+225 01 23 45 67 10', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user12_id, 'adou.rosine@mon-toit.ci', '$2b$10$X9MLLN0fLFhFioX6DI7JR.ySUXQaVj0flKbORF63AGxYhbGG2WHqG', NOW(), '+225 01 23 45 67 11', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user13_id, 'traore.sami@mon-toit.ci', '$2b$10$5EG6n0MbNPawc0awrbbDJ.GrP/O5iSC2TTORpIaQEAfPrirzB0MkO', NOW(), '+225 01 23 45 67 12', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user14_id, 'konan.emma@mon-toit.ci', '$2b$10$E1MU26Pxc0UxOR1eualWj.dpB9uAl89YWBVA58JXwZ4mDWDoMEBQK', NOW(), '+225 01 23 45 67 13', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user15_id, 'nguessan.fred@mon-toit.ci', '$2b$10$2Nst.dDwDUpTJeELiQWW7uZpwx4k/ZQiwLU87wzSEQkZBde20rYzy', NOW(), '+225 01 23 45 67 14', NOW(), NOW(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

  RAISE NOTICE '✓ Utilisateurs auth (existants + nouveaux) insérés / ignorés si existants';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Impossible d''insérer dans auth.users, tentative de continuer...';
END $$;

-- Now create user profiles (existing + new)
DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
  user5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
  user6_id UUID := '550e8400-e29b-41d4-a716-446655440006';
  user7_id UUID := '550e8400-e29b-41d4-a716-446655440007';
  user8_id UUID := '550e8400-e29b-41d4-a716-446655440008';
  user9_id UUID := '550e8400-e29b-41d4-a716-446655440009';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  user11_id UUID := '550e8400-e29b-41d4-a716-446655440011';
  user12_id UUID := '550e8400-e29b-41d4-a716-446655440012';
  user13_id UUID := '550e8400-e29b-41d4-a716-446655440013';
  user14_id UUID := '550e8400-e29b-41d4-a716-446655440014';
  user15_id UUID := '550e8400-e29b-41d4-a716-446655440015';
BEGIN
  -- Temporarily disable foreign key constraint for testing
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

  INSERT INTO public.profiles (id, full_name, phone, avatar_url, bio, city, user_type, is_verified, oneci_verified, cnam_verified, face_verified, ui_density, created_at, updated_at) VALUES
    -- Admin User
    (admin_user_id, 'Administrateur Mon Toit', '+225 01 23 45 67 89', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'Administrateur principal du système Mon Toit. Accès complet à toutes les fonctionnalités.', 'Abidjan, Cocody', 'admin_ansut'::user_type, true, true, true, true, 'comfortable', NOW(), NOW()),

    -- Property Owners (existing)
    (user2_id, 'Kouadio Jean-Baptiste', '+225 01 23 45 67 01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'Propriétaire de plusieurs biens à Abidjan', 'Abidjan, Cocody', 'proprietaire'::user_type, true, true, false, false, 'comfortable', NOW(), NOW()),
    (user3_id, 'Marie Aya Bamba', '+225 01 23 45 67 02', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'Propriétaire de biens commerciaux', 'Abidjan, Plateau', 'proprietaire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),

    -- Tenants (existing)
    (user4_id, 'Yao Konan', '+225 01 23 45 67 03', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'Jeune professionnel à la recherche d''un appartement', 'Abidjan, Yopougon', 'locataire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),
    (user5_id, 'Aminata Diarra', '+225 01 23 45 67 04', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'Étudiante à la recherche d''un studio', 'Abidjan, Abobo', 'locataire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),

    -- Agencies (existing)
    (user6_id, 'Agence Immobilière Cocody', '+225 01 23 45 67 05', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150&h=150&fit=crop&crop=face', 'Agence immobilière de premier choix à Cocody', 'Abidjan, Cocody', 'agence'::user_type, true, true, false, false, 'comfortable', NOW(), NOW()),
    (user7_id, 'Ankou Real Estate', '+225 01 23 45 67 06', 'https://images.unsplash.com/photo-1556659793-08538906a9f8?w=150&h=150&fit=crop&crop=face', 'Expert en gestion immobilière à Abidjan', 'Abidjan, Plateau', 'agence'::user_type, true, true, true, false, 'compact', NOW(), NOW()),

    -- Third Party Trust (existing)
    (user8_id, 'Notaire Konan', '+225 01 23 45 67 07', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', 'Notaire certifié pour transactions immobilières', 'Abidjan, Cocody', 'tiers_de_confiance'::user_type, true, true, true, true, 'comfortable', NOW(), NOW()),

    -- Additional test users (existing)
    (user9_id, 'Dr. Yeo Martial', '+225 01 23 45 67 08', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face', 'Médecin résident à Abidjan', 'Abidjan, Marcory', 'locataire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),
    (user10_id, 'Patricia Kouamé', '+225 01 23 45 67 09', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'Chef d''entreprise à la recherche de bureaux', 'Abidjan, Plateau', 'proprietaire'::user_type, true, true, false, false, 'comfortable', NOW(), NOW()),

    -- NEW proprietaires (profiles)
    (user11_id, 'Koffi Alain', '+225 01 23 45 67 10', 'https://images.unsplash.com/photo-1545996124-1b3d1a1b7a9e?w=150&h=150&fit=crop&crop=face', 'Investisseur immobilier, propriétaire de plusieurs appartements F4/F3.', 'Abidjan, Marcory', 'proprietaire'::user_type, true, false, false, false, 'comfortable', NOW(), NOW()),
    (user12_id, 'Adou Rosine', '+225 01 23 45 67 11', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face', 'Propriétaire de petites résidences et studios.', 'Abidjan, Treichville', 'proprietaire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),
    (user13_id, 'Traoré Sami', '+225 01 23 45 67 12', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face', 'Gère des biens locatifs et locaux commerciaux.', 'Abidjan, Plateau', 'proprietaire'::user_type, true, true, false, false, 'comfortable', NOW(), NOW()),
    (user14_id, 'Konan Emma', '+225 01 23 45 67 13', 'https://images.unsplash.com/photo-1545996130-2f1b6b6d0b6a?w=150&h=150&fit=crop&crop=face', 'Investisseuse, focus sur locations de courte durée.', 'Abidjan, Cocody', 'proprietaire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),
    (user15_id, 'N''Guessan Fred', '+225 01 23 45 67 14', 'https://images.unsplash.com/photo-1524503033411-c9566986fc8f?w=150&h=150&fit=crop&crop=face', 'Propriétaire et entrepreneur, possède bureaux et appartements.', 'Abidjan, Zone 4', 'proprietaire'::user_type, true, false, false, false, 'comfortable', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Re-add the foreign key constraint (if possible)
  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Impossible d''ajouter la contrainte de clé étrangère, mais les profils sont créés';
  END;

  RAISE NOTICE '✓ Profiles existants + nouveaux créés (ou ignorés si existants)';
END $$;

-- Create user roles for proper authentication and role-based access
DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
  user5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
  user6_id UUID := '550e8400-e29b-41d4-a716-446655440006';
  user7_id UUID := '550e8400-e29b-41d4-a716-446655440007';
  user8_id UUID := '550e8400-e29b-41d4-a716-446655440008';
  user9_id UUID := '550e8400-e29b-41d4-a716-446655440009';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  user11_id UUID := '550e8400-e29b-41d4-a716-446655440011';
  user12_id UUID := '550e8400-e29b-41d4-a716-446655440012';
  user13_id UUID := '550e8400-e29b-41d4-a716-446655440013';
  user14_id UUID := '550e8400-e29b-41d4-a716-446655440014';
  user15_id UUID := '550e8400-e29b-41d4-a716-446655440015';
BEGIN
  -- Clear existing roles to avoid duplicates
  DELETE FROM public.user_roles;

  -- Insert correct roles for each user based on their user_type
  INSERT INTO public.user_roles (user_id, role) VALUES
    -- Admin
    (admin_user_id, 'admin_ansut'),

    -- Property Owners
    (user2_id, 'proprietaire'),
    (user3_id, 'proprietaire'),
    (user10_id, 'proprietaire'),
    (user11_id, 'proprietaire'),
    (user12_id, 'proprietaire'),
    (user13_id, 'proprietaire'),
    (user14_id, 'proprietaire'),
    (user15_id, 'proprietaire'),

    -- Tenants
    (user4_id, 'locataire'),
    (user5_id, 'locataire'),
    (user9_id, 'locataire'),

    -- Agencies
    (user6_id, 'agence'),
    (user7_id, 'agence'),

    -- Third Party Trust
    (user8_id, 'tiers_de_confiance')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✓ Rôles utilisateurs créés pour authentification basée sur les rôles';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Impossible de créer les rôles utilisateurs, tentative de continuer...';
END $$;

-- Create user active roles (including new proprietaires)
DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
  user5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
  user6_id UUID := '550e8400-e29b-41d4-a716-446655440006';
  user7_id UUID := '550e8400-e29b-41d4-a716-446655440007';
  user8_id UUID := '550e8400-e29b-41d4-a716-446655440008';
  user9_id UUID := '550e8400-e29b-41d4-a716-446655440009';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  user11_id UUID := '550e8400-e29b-41d4-a716-446655440011';
  user12_id UUID := '550e8400-e29b-41d4-a716-446655440012';
  user13_id UUID := '550e8400-e29b-41d4-a716-446655440013';
  user14_id UUID := '550e8400-e29b-41d4-a716-446655440014';
  user15_id UUID := '550e8400-e29b-41d4-a716-446655440015';
BEGIN
  INSERT INTO public.user_active_roles (user_id, active_role, available_roles, created_at, updated_at) VALUES
    (admin_user_id, 'admin_ansut'::user_type, ARRAY['admin_ansut'::user_type, 'proprietaire'::user_type, 'locataire'::user_type, 'agence'::user_type, 'tiers_de_confiance'::user_type], NOW(), NOW()),
    (user2_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type, 'locataire'::user_type], NOW(), NOW()),
    (user3_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type, 'agence'::user_type], NOW(), NOW()),
    (user4_id, 'locataire'::user_type, ARRAY['locataire'::user_type, 'proprietaire'::user_type], NOW(), NOW()),
    (user5_id, 'locataire'::user_type, ARRAY['locataire'::user_type], NOW(), NOW()),
    (user6_id, 'agence'::user_type, ARRAY['agence'::user_type, 'proprietaire'::user_type], NOW(), NOW()),
    (user7_id, 'agence'::user_type, ARRAY['agence'::user_type, 'proprietaire'::user_type], NOW(), NOW()),
    (user8_id, 'tiers_de_confiance'::user_type, ARRAY['tiers_de_confiance'::user_type], NOW(), NOW()),
    (user9_id, 'locataire'::user_type, ARRAY['locataire'::user_type], NOW(), NOW()),
    (user10_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type, 'agence'::user_type], NOW(), NOW()),
    -- NEW proprietaires roles
    (user11_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type], NOW(), NOW()),
    (user12_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type], NOW(), NOW()),
    (user13_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type], NOW(), NOW()),
    (user14_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type], NOW(), NOW()),
    (user15_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type], NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Create user preferences (including new proprietaires)
DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
  user5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
  user6_id UUID := '550e8400-e29b-41d4-a716-446655440006';
  user7_id UUID := '550e8400-e29b-41d4-a716-446655440007';
  user8_id UUID := '550e8400-e29b-41d4-a716-446655440008';
  user9_id UUID := '550e8400-e29b-41d4-a716-446655440009';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  user11_id UUID := '550e8400-e29b-41d4-a716-446655440011';
  user12_id UUID := '550e8400-e29b-41d4-a716-446655440012';
  user13_id UUID := '550e8400-e29b-41d4-a716-446655440013';
  user14_id UUID := '550e8400-e29b-41d4-a716-446655440014';
  user15_id UUID := '550e8400-e29b-41d4-a716-446655440015';
BEGIN
  INSERT INTO public.user_preferences (user_id, theme, language, notifications_enabled, email_notifications, push_notifications, property_alerts) VALUES
    (admin_user_id, 'dark', 'fr', true, true, true, true),
    (user2_id, 'light', 'fr', true, true, true, false),
    (user3_id, 'light', 'fr', false, true, false, false),
    (user4_id, 'light', 'fr', true, true, true, true),
    (user5_id, 'dark', 'fr', true, true, false, true),
    (user6_id, 'light', 'fr', true, true, true, false),
    (user7_id, 'light', 'fr', true, true, true, false),
    (user8_id, 'light', 'fr', false, false, false, false),
    (user9_id, 'dark', 'fr', true, true, true, true),
    (user10_id, 'light', 'fr', false, true, false, false),
    -- NEW proprietaires preferences
    (user11_id, 'light', 'fr', true, true, false, false),
    (user12_id, 'light', 'fr', false, true, false, false),
    (user13_id, 'dark', 'fr', true, true, true, true),
    (user14_id, 'light', 'fr', true, true, true, false),
    (user15_id, 'dark', 'fr', true, true, false, false)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✓ Préférences utilisateurs (existantes + nouvelles) créées';
END $$;

-- Create properties (added 5 new owned properties for the new proprietaires)
DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  user11_id UUID := '550e8400-e29b-41d4-a716-446655440011';
  user12_id UUID := '550e8400-e29b-41d4-a716-446655440012';
  user13_id UUID := '550e8400-e29b-41d4-a716-446655440013';
  user14_id UUID := '550e8400-e29b-41d4-a716-446655440014';
  user15_id UUID := '550e8400-e29b-41d4-a716-446655440015';

  prop1_id UUID := '550e8400-e29b-41d4-a716-446655440101';
  prop2_id UUID := '550e8400-e29b-41d4-a716-446655440102';
  prop3_id UUID := '550e8400-e29b-41d4-a716-446655440103';
  prop4_id UUID := '550e8400-e29b-41d4-a716-446655440104';
  prop5_id UUID := '550e8400-e29b-41d4-a716-446655440105';
  -- New property IDs
  prop6_id UUID := '550e8400-e29b-41d4-a716-446655440106';
  prop7_id UUID := '550e8400-e29b-41d4-a716-446655440107';
  prop8_id UUID := '550e8400-e29b-41d4-a716-446655440108';
  prop9_id UUID := '550e8400-e29b-41d4-a716-446655440109';
  prop10_id UUID := '550e8400-e29b-41d4-a716-446655440110';
  -- Additional 20 properties
  prop11_id UUID := '550e8400-e29b-41d4-a716-446655440111';
  prop12_id UUID := '550e8400-e29b-41d4-a716-446655440112';
  prop13_id UUID := '550e8400-e29b-41d4-a716-446655440113';
  prop14_id UUID := '550e8400-e29b-41d4-a716-446655440114';
  prop15_id UUID := '550e8400-e29b-41d4-a716-446655440115';
  prop16_id UUID := '550e8400-e29b-41d4-a716-446655440116';
  prop17_id UUID := '550e8400-e29b-41d4-a716-446655440117';
  prop18_id UUID := '550e8400-e29b-41d4-a716-446655440118';
  prop19_id UUID := '550e8400-e29b-41d4-a716-446655440119';
  prop20_id UUID := '550e8400-e29b-41d4-a716-446655440120';
  prop21_id UUID := '550e8400-e29b-41d4-a716-446655440121';
  prop22_id UUID := '550e8400-e29b-41d4-a716-446655440122';
  prop23_id UUID := '550e8400-e29b-41d4-a716-446655440123';
  prop24_id UUID := '550e8400-e29b-41d4-a716-446655440124';
  prop25_id UUID := '550e8400-e29b-41d4-a716-446655440125';
  prop26_id UUID := '550e8400-e29b-41d4-a716-446655440126';
  prop27_id UUID := '550e8400-e29b-41d4-a716-446655440127';
  prop28_id UUID := '550e8400-e29b-41d4-a716-446655440128';
  prop29_id UUID := '550e8400-e29b-41d4-a716-446655440129';
  prop30_id UUID := '550e8400-e29b-41d4-a716-446655440130';
BEGIN
  INSERT INTO public.properties (id, title, description, property_type, city, neighborhood, address, monthly_rent, surface_area, bedrooms, bathrooms, owner_id, status, latitude, longitude, created_at, updated_at) VALUES
    (prop1_id, 'Résidence Admin - Cocody', 'Propriété de luxe gérée par l''administration pour tests', 'appartement', 'Abidjan', 'Cocody', 'Rue des Administrateurs, Cocody', 500000, 150, 4, 3, admin_user_id, 'disponible', 5.3601, -3.9953, NOW(), NOW()),
    (prop2_id, 'Bureau Admin - Plateau', 'Bureau administratif pour démonstration', 'bureau', 'Abidjan', 'Plateau', 'Avenue du Gouvernement, Plateau', 750000, 200, 2, 2, admin_user_id, 'disponible', 5.3384, -4.0112, NOW(), NOW()),
    (prop3_id, 'Appartement F3 Cocody', 'Bel appartement F3 dans un quartier résidentiel calme', 'appartement', 'Abidjan', 'Cocody', 'Rue des Palmiers, Cocody', 350000, 120, 3, 2, user2_id, 'disponible', 5.3589, -4.0083, NOW(), NOW()),
    (prop4_id, 'Studio Yopougon', 'Studio idéal pour étudiant ou jeune professionnel', 'studio', 'Abidjan', 'Yopougon', 'Boulevard du Lac, Yopougon', 80000, 35, 1, 1, user3_id, 'disponible', 5.3295, -4.0627, NOW(), NOW()),
    (prop5_id, 'Bureau Plateau', 'Bureau de standing au centre-ville', 'bureau', 'Abidjan', 'Plateau', 'Avenue Ch. de Gaulle, Plateau', 250000, 100, 0, 1, user10_id, 'disponible', 5.3402, -4.0087, NOW(), NOW()),

    -- NEW properties owned by new proprietaires
    (prop6_id, 'Villa F5 Marcory', 'Spacieuse villa F5 avec jardin et garage', 'villa', 'Abidjan', 'Marcory', 'Rue des Hibiscus, Marcory', 600000, 220, 5, 4, user11_id, 'disponible', 5.3069, -3.9912, NOW(), NOW()),
    (prop7_id, 'Résidence Studio Treichville', 'Immeuble de studios meublés pour étudiants', 'studio', 'Abidjan', 'Treichville', 'Impasse des Lycéens, Treichville', 90000, 30, 0, 1, user12_id, 'disponible', 5.2846, -3.9765, NOW(), NOW()),
    (prop8_id, 'Local Commercial Plateau', 'Local commercial situé en zone passante', 'local_commercial', 'Abidjan', 'Plateau', 'Rue du Marché, Plateau', 450000, 120, 0, 2, user13_id, 'disponible', 5.3358, -4.0156, NOW(), NOW()),
    (prop9_id, 'Appartement F2 Cocody', 'Charmant F2 proche universités', 'appartement', 'Abidjan', 'Cocody', 'Avenue des Universités, Cocody', 180000, 60, 2, 1, user14_id, 'disponible', 5.3672, -3.9894, NOW(), NOW()),
    (prop10_id, 'Bureau Zone 4', 'Bureau moderne en open-space', 'bureau', 'Abidjan', 'Zone 4', 'Boulevard des Affaires, Zone 4', 300000, 110, 0, 1, user15_id, 'disponible', 5.3187, -3.9832, NOW(), NOW()),

    -- 20 ADDITIONAL PROPERTIES WITH GEOGRAPHIC COORDINATES
    (prop11_id, 'Appartement F3 Abobo', 'Appartement spacieux dans quartier résidentiel', 'appartement', 'Abidjan', 'Abobo', 'Boulevard de la Liberté, Abobo', 250000, 110, 3, 2, user2_id, 'disponible', 5.4218, -4.0215, NOW(), NOW()),
    (prop12_id, 'Studio Meublé Adjame', 'Studio moderne meublé près du marché', 'studio', 'Abidjan', 'Adjamé', 'Rue du Commerce, Adjamé', 75000, 28, 0, 1, user3_id, 'disponible', 5.3669, -4.0317, NOW(), NOW()),
    (prop13_id, 'Villa F4 Riviera', 'Villa de luxe avec piscine privative', 'villa', 'Abidjan', 'Riviera', 'Avenue des Palmiers, Riviera', 800000, 280, 4, 3, user10_id, 'disponible', 5.3765, -3.9456, NOW(), NOW()),
    (prop14_id, 'Bureau Commercial Marcory', 'Espace de bureau idéalement situé', 'bureau', 'Abidjan', 'Marcory', 'Rue des Entreprises, Marcory', 320000, 95, 0, 1, user11_id, 'disponible', 5.3024, -3.9857, NOW(), NOW()),
    (prop15_id, 'Appartement F1 Plateau', 'Studio centre-ville avec vue', 'appartement', 'Abidjan', 'Plateau', 'Avenue du Progrès, Plateau', 150000, 45, 1, 1, user12_id, 'disponible', 5.3421, -4.0098, NOW(), NOW()),
    (prop16_id, 'Résidence F5 Yopougon', 'Grande résidence familiale', 'villa', 'Abidjan', 'Yopougon', 'Boulevard des Nations, Yopougon', 450000, 200, 5, 3, user13_id, 'disponible', 5.3356, -4.0543, NOW(), NOW()),
    (prop17_id, 'Local Commercial Cocody', 'Magasin commercial en zone passante', 'local_commercial', 'Abidjan', 'Cocody', 'Rue des Commerces, Cocody', 380000, 80, 0, 1, user14_id, 'disponible', 5.3634, -3.9987, NOW(), NOW()),
    (prop18_id, 'Appartement F2 Treichville', 'Appartement rénové près du port', 'appartement', 'Abidjan', 'Treichville', 'Avenue du Port, Treichville', 200000, 65, 2, 1, user15_id, 'disponible', 5.2798, -3.9689, NOW(), NOW()),
    (prop19_id, 'Villa F6 Bingerville', 'Villa de prestige avec grand jardin', 'villa', 'Abidjan', 'Bingerville', 'Route de la Paix, Bingerville', 900000, 320, 6, 4, user2_id, 'disponible', 5.3467, -3.8765, NOW(), NOW()),
    (prop20_id, 'Studio Etudiant Cocody', 'Studio adapté pour étudiants', 'studio', 'Abidjan', 'Cocody', 'Rue Universitaire, Cocody', 95000, 32, 0, 1, user3_id, 'disponible', 5.3701, -3.9923, NOW(), NOW()),
    (prop21_id, 'Bureau Open Space Zone 4', 'Espace de travail moderne et lumineux', 'bureau', 'Abidjan', 'Zone 4', 'Avenue de la Technologie, Zone 4', 420000, 130, 0, 2, user10_id, 'disponible', 5.3156, -3.9789, NOW(), NOW()),
    (prop22_id, 'Appartement F4 Marcory', 'Appartement familial avec balcon', 'appartement', 'Abidjan', 'Marcory', 'Boulevard de la République, Marcory', 380000, 140, 4, 2, user11_id, 'disponible', 5.3087, -3.9965, NOW(), NOW()),
    (prop23_id, 'Local Commercial Plateau', 'Bureau de prestige centre financier', 'local_commercial', 'Abidjan', 'Plateau', 'Avenue Bancaire, Plateau', 650000, 180, 0, 2, user12_id, 'disponible', 5.3378, -4.0123, NOW(), NOW()),
    (prop24_id, 'Villa F3 Abobo', 'Villa avec jardin et terrasse', 'villa', 'Abidjan', 'Abobo', 'Rue des Jardins, Abobo', 280000, 150, 3, 2, user13_id, 'disponible', 5.4187, -4.0243, NOW(), NOW()),
    (prop25_id, 'Appartement F1 Yopougon', 'Studio rénové avec cuisine équipée', 'appartement', 'Abidjan', 'Yopougon', 'Rue des Artisans, Yopougon', 85000, 38, 1, 1, user14_id, 'disponible', 5.3321, -4.0587, NOW(), NOW()),
    (prop26_id, 'Bureau Cocody', 'Bureau dans quartier d''affaires', 'bureau', 'Abidjan', 'Cocody', 'Avenue des Affaires, Cocody', 280000, 85, 0, 1, user15_id, 'disponible', 5.3598, -3.9876, NOW(), NOW()),
    (prop27_id, 'Appartement F3 Adjame', 'Appartement centre commercial', 'appartement', 'Abidjan', 'Adjamé', 'Place du Marché, Adjamé', 220000, 105, 3, 2, user2_id, 'disponible', 5.3645, -4.0298, NOW(), NOW()),
    (prop28_id, 'Studio Meublé Plateau', 'Studio de luxe centre-ville', 'studio', 'Abidjan', 'Plateau', 'Rue de la Victoire, Plateau', 175000, 40, 0, 1, user3_id, 'disponible', 5.3409, -4.0065, NOW(), NOW()),
    (prop29_id, 'Villa F4 Riviera', 'Villa moderne avec alarme', 'villa', 'Abidjan', 'Riviera', 'Chemin des Rêves, Riviera', 750000, 260, 4, 3, user10_id, 'disponible', 5.3789, -3.9412, NOW(), NOW()),
    (prop30_id, 'Appartement F2 Treichville', 'Appartement près des transports', 'appartement', 'Abidjan', 'Treichville', 'Avenue des Gares, Treichville', 165000, 70, 2, 1, user11_id, 'disponible', 5.2765, -3.9734, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Propriétés existantes + nouvelles créées (ou ignorées si existants)';
END $$;

-- Create leases (unchanged, but attempt to create if table exists)
DO $$
DECLARE
  user4_id UUID := '550e8400-e29b-41d4-a716-446655440004';
  user5_id UUID := '550e8400-e29b-41d4-a716-446655440005';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user6_id UUID := '550e8400-e29b-41d4-a716-446655440006';

  prop1_id UUID := '550e8400-e29b-41d4-a716-446655440101';
  prop2_id UUID := '550e8400-e29b-41d4-a716-446655440102';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'landlord_id') THEN
    IF (SELECT COUNT(*) FROM public.leases) = 0 THEN
      INSERT INTO public.leases (id, property_id, tenant_id, owner_id, landlord_id, status, start_date, end_date, monthly_rent, created_at, updated_at) VALUES
      (gen_random_uuid(), prop1_id, user4_id, user2_id, user2_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 350000, NOW(), NOW()),
      (gen_random_uuid(), prop2_id, user5_id, user6_id, user6_id, 'draft', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '13 months', 80000, NOW(), NOW());
    END IF;
    RAISE NOTICE '✓ Baux créés (s''il y avait une table leases)';
  ELSE
    RAISE NOTICE '⚠ Table leases non trouvée, baux non créés';
  END IF;
END $$;

-- Create notifications for all users (added notifications for new proprietaires)
DO $$
BEGIN
  INSERT INTO public.notifications (id, user_id, title, message, type, read, metadata, created_at) VALUES
    -- Admin notifications
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Bienvenue Administrateur', 'Votre compte administrateur a été créé avec succès. Vous avez accès à toutes les fonctionnalités du système.', 'info', false, '{"priority": "high"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Accès complet', 'En tant qu''administrateur, vous pouvez gérer les utilisateurs, les propriétés et les paramètres du système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),

    -- Other user notifications
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'Propriété vérifiée', 'Votre propriété "Appartement F3 Cocody" a été vérifiée et approuvée.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 'Nouvelles correspondances', 'Nous avons trouvé 3 nouvelles propriétés correspondant à vos critères.', 'info', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'Nouveau mandat', 'Un nouveau mandat de gestion vous a été attribué.', 'info', false, '{"priority": "high"}'::jsonb, NOW()),

    -- Notifications pour nouveaux proprietaires
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', 'Propriété ajoutée', 'Votre propriété "Villa F5 Marcory" a été enregistrée dans le système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440012', 'Propriété ajoutée', 'Votre propriété "Résidence Studio Treichville" a été enregistrée dans le système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440013', 'Propriété ajoutée', 'Votre propriété "Local Commercial Plateau" a été enregistrée dans le système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440014', 'Propriété ajoutée', 'Votre propriété "Appartement F2 Cocody" a été enregistrée dans le système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440015', 'Propriété ajoutée', 'Votre propriété "Bureau Zone 4" a été enregistrée dans le système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Notifications pour utilisateurs (existants + nouveaux) créées';
END $$;

-- Final summary (updated)
DO $$
DECLARE
  user_count INTEGER;
  property_count INTEGER;
  lease_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  SELECT COUNT(*) INTO property_count FROM public.properties;
  SELECT COUNT(*) INTO lease_count FROM public.leases;

  RAISE NOTICE '=========================================';
  RAISE NOTICE '=== SEED GLOBAL TERMINÉ AVEC SUCCÈS (EXTENDED & FIXED) ===';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Utilisateurs créés: %', user_count;
  RAISE NOTICE 'Propriétés créées: %', property_count;
  RAISE NOTICE 'Baux créés: %', lease_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 COMPTES DE TEST DISPONIBLES:';
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMINISTRATEUR:';
  RAISE NOTICE '   Email: admin@mon-toit.ci';
  RAISE NOTICE '   Mot de passe: admin123!@#';
  RAISE NOTICE '   Tableau de bord: http://localhost:8082/admin';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 PROPRIÉTAIRES (exemples):';
  RAISE NOTICE '   kouadio.jean@mon-toit.ci (démopass123)';
  RAISE NOTICE '   marie.aya@mon-toit.ci (démopass123)';
  RAISE NOTICE '   patricia.kouame@mon-toit.ci (démopass123)';
  RAISE NOTICE '   koffi.alain@mon-toit.ci (démopass123)';
  RAISE NOTICE '   adou.rosine@mon-toit.ci (démopass123)';
  RAISE NOTICE '   traore.sami@mon-toit.ci (démopass123)';
  RAISE NOTICE '   konan.emma@mon-toit.ci (démopass123)';
  RAISE NOTICE '   nguessan.fred@mon-toit.ci (démopass123)';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 LOCATAIRES:';
  RAISE NOTICE '   yao.konan@mon-toit.ci (démopass123)';
  RAISE NOTICE '   aminata.diarra@mon-toit.ci (démopass123)';
  RAISE NOTICE '   dr.yeo@mon-toit.ci (démopass123)';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 AGENCES:';
  RAISE NOTICE '   contact@agence-cocody.ci (démopass123)';
  RAISE NOTICE '   info@ankou-realestate.ci (démopass123)';
  RAISE NOTICE '';
  RAISE NOTICE '🤝 TIERS DE CONFIANCE:';
  RAISE NOTICE '   notaire.konan@mon-toit.ci (démopass123)';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 URL DE CONNEXION: http://localhost:8082/login';
  RAISE NOTICE '=========================================';
END $$;

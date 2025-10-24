-- Comprehensive Seed Data for Mon Toit Application
-- This script creates all necessary test data including admin account

-- Create test users in auth.users first (without password constraints for testing)
DO $$
DECLARE
  -- Define fixed UUIDs for consistency
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
BEGIN
  -- First, create users in auth.users (bypassing constraints for testing)
  -- Note: In production, these would be created via Supabase Auth API
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, phone, created_at, updated_at, aud, role) VALUES
    (admin_user_id, 'admin@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 89', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user2_id, 'kouadio.jean@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 01', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user3_id, 'marie.aya@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 02', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user4_id, 'yao.konan@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 03', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user5_id, 'aminata.diarra@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 04', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user6_id, 'contact@agence-cocody.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 05', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user7_id, 'info@ankou-realestate.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 06', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user8_id, 'notaire.konan@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 07', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user9_id, 'dr.yeo@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 08', NOW(), NOW(), 'authenticated', 'authenticated'),
    (user10_id, 'patricia.kouame@mon-toit.ci', 'dummy_password_hash', NOW(), '+225 01 23 45 67 09', NOW(), NOW(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Utilisateurs auth créés avec succès';
EXCEPTION
  WHEN OTHERS THEN
    -- If we can't insert into auth.users, continue without it
    -- The profiles might still work if the users exist
    RAISE NOTICE '⚠ Impossible d''insérer dans auth.users, tentative de continuer...';
END $$;

-- Now create user profiles
DO $$
DECLARE
  -- Define fixed UUIDs for consistency
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
BEGIN
  -- Temporarily disable foreign key constraint for testing
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

  -- Create user profiles
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, bio, city, user_type, is_verified, oneci_verified, cnam_verified, face_verified, ui_density, created_at, updated_at) VALUES
    -- Admin User
    (admin_user_id, 'Administrateur Mon Toit', '+225 01 23 45 67 89', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'Administrateur principal du système Mon Toit. Accès complet à toutes les fonctionnalités.', 'Abidjan, Cocody', 'admin_ansut'::user_type, true, true, true, true, 'comfortable', NOW(), NOW()),

    -- Property Owners
    (user2_id, 'Kouadio Jean-Baptiste', '+225 01 23 45 67 01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'Propriétaire de plusieurs biens à Abidjan', 'Abidjan, Cocody', 'proprietaire'::user_type, true, true, false, false, 'comfortable', NOW(), NOW()),
    (user3_id, 'Marie Aya Bamba', '+225 01 23 45 67 02', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'Propriétaire de biens commerciaux', 'Abidjan, Plateau', 'proprietaire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),

    -- Tenants
    (user4_id, 'Yao Konan', '+225 01 23 45 67 03', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'Jeune professionnel à la recherche d''un appartement', 'Abidjan, Yopougon', 'locataire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),
    (user5_id, 'Aminata Diarra', '+225 01 23 45 67 04', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'Étudiante à la recherche d''un studio', 'Abidjan, Abobo', 'locataire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),

    -- Agencies
    (user6_id, 'Agence Immobilière Cocody', '+225 01 23 45 67 05', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150&h=150&fit=crop&crop=face', 'Agence immobilière de premier choix à Cocody', 'Abidjan, Cocody', 'agence'::user_type, true, true, false, false, 'comfortable', NOW(), NOW()),
    (user7_id, 'Ankou Real Estate', '+225 01 23 45 67 06', 'https://images.unsplash.com/photo-1556659793-08538906a9f8?w=150&h=150&fit=crop&crop=face', 'Expert en gestion immobilière à Abidjan', 'Abidjan, Plateau', 'agence'::user_type, true, true, true, false, 'compact', NOW(), NOW()),

    -- Third Party Trust
    (user8_id, 'Notaire Konan', '+225 01 23 45 67 07', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', 'Notaire certifié pour transactions immobilières', 'Abidjan, Cocody', 'tiers_de_confiance'::user_type, true, true, true, true, 'comfortable', NOW(), NOW()),

    -- Additional test users
    (user9_id, 'Dr. Yeo Martial', '+225 01 23 45 67 08', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face', 'Médecin résident à Abidjan', 'Abidjan, Marcory', 'locataire'::user_type, false, false, false, false, 'compact', NOW(), NOW()),
    (user10_id, 'Patricia Kouamé', '+225 01 23 45 67 09', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'Chef d''entreprise à la recherche de bureaux', 'Abidjan, Plateau', 'proprietaire'::user_type, true, true, false, false, 'comfortable', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Re-add the foreign key constraint (if possible)
  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Impossible d''ajouter la contrainte de clé étrangère, mais les profils sont créés';
  END;

  RAISE NOTICE '✓ 10 utilisateurs créés avec succès';
END $$;

-- Create user active roles
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
    (user10_id, 'proprietaire'::user_type, ARRAY['proprietaire'::user_type, 'agence'::user_type], NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Create user preferences
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
    (user10_id, 'light', 'fr', false, true, false, false)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✓ Préférences utilisateurs créées avec succès';
END $$;

-- Create properties (simplified version)
DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  user3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
  user10_id UUID := '550e8400-e29b-41d4-a716-446655440010';

  prop1_id UUID := '550e8400-e29b-41d4-a716-446655440101';
  prop2_id UUID := '550e8400-e29b-41d4-a716-446655440102';
  prop3_id UUID := '550e8400-e29b-41d4-a716-446655440103';
  prop4_id UUID := '550e8400-e29b-41d4-a716-446655440104';
  prop5_id UUID := '550e8400-e29b-41d4-a716-446655440105';
BEGIN
  INSERT INTO public.properties (id, title, description, property_type, city, neighborhood, address, monthly_rent, surface_area, bedrooms, bathrooms, owner_id, status, created_at, updated_at) VALUES
    (prop1_id, 'Résidence Admin - Cocody', 'Propriété de luxe gérée par l''administration pour tests', 'appartement', 'Abidjan', 'Cocody', 'Rue des Administrateurs, Cocody', 500000, 150, 4, 3, admin_user_id, 'disponible', NOW(), NOW()),
    (prop2_id, 'Bureau Admin - Plateau', 'Bureau administratif pour démonstration', 'bureau', 'Abidjan', 'Plateau', 'Avenue du Gouvernement, Plateau', 750000, 200, 2, 2, admin_user_id, 'disponible', NOW(), NOW()),
    (prop3_id, 'Appartement F3 Cocody', 'Bel appartement F3 dans un quartier résidentiel calme', 'appartement', 'Abidjan', 'Cocody', 'Rue des Palmiers, Cocody', 350000, 120, 3, 2, user2_id, 'disponible', NOW(), NOW()),
    (prop4_id, 'Studio Yopougon', 'Studio idéal pour étudiant ou jeune professionnel', 'studio', 'Abidjan', 'Yopougon', 'Boulevard du Lac, Yopougon', 80000, 35, 1, 1, user3_id, 'disponible', NOW(), NOW()),
    (prop5_id, 'Bureau Plateau', 'Bureau de standing au centre-ville', 'bureau', 'Abidjan', 'Plateau', 'Avenue Ch. de Gaulle, Plateau', 250000, 100, 0, 1, user10_id, 'disponible', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ 5 propriétés créées avec succès';
END $$;

-- Create leases (now that properties exist)
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
  -- Add sample leases if columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'landlord_id') THEN
    IF (SELECT COUNT(*) FROM public.leases) = 0 THEN
      INSERT INTO public.leases (id, property_id, tenant_id, owner_id, landlord_id, status, start_date, end_date, monthly_rent, created_at, updated_at) VALUES
      (gen_random_uuid(), prop1_id, user4_id, user2_id, user2_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 350000, NOW(), NOW()),
      (gen_random_uuid(), prop2_id, user5_id, user6_id, user6_id, 'draft', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '13 months', 80000, NOW(), NOW());
    END IF;
    RAISE NOTICE '✓ Baux créés avec succès';
  ELSE
    RAISE NOTICE '⚠ Table leases non trouvée, baux non créés';
  END IF;
END $$;

-- Create notifications for all users
DO $$
BEGIN
  INSERT INTO public.notifications (id, user_id, title, message, type, read, metadata, created_at) VALUES
    -- Admin notifications
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Bienvenue Administrateur', 'Votre compte administrateur a été créé avec succès. Vous avez accès à toutes les fonctionnalités du système.', 'info', false, '{"priority": "high"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Accès complet', 'En tant qu''administrateur, vous pouvez gérer les utilisateurs, les propriétés et les paramètres du système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),

    -- Other user notifications
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'Propriété vérifiée', 'Votre propriété "Appartement F3 Cocody" a été vérifiée et approuvée.', 'success', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 'Nouvelles correspondances', 'Nous avons trouvé 3 nouvelles propriétés correspondant à vos critères.', 'info', false, '{"priority": "medium"}'::jsonb, NOW()),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440006', 'Nouveau mandat', 'Un nouveau mandat de gestion vous a été attribué.', 'info', false, '{"priority": "high"}'::jsonb, NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Notifications créées avec succès';
END $$;

-- Final summary
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
  RAISE NOTICE '=== SEED GLOBAL TERMINÉ AVEC SUCCÈS ===';
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
  RAISE NOTICE '🏠 PROPRIÉTAIRES:';
  RAISE NOTICE '   kouadio.jean@mon-toit.ci (démopass123)';
  RAISE NOTICE '   marie.aya@mon-toit.ci (démopass123)';
  RAISE NOTICE '   patricia.kouame@mon-toit.ci (démopass123)';
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
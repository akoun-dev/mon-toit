-- seed.sql
-- Comprehensive Seed Data for Mon Toit Application
--
-- ⚠️ IMPORTANT: Ce fichier ne crée plus les comptes utilisateurs!
-- Utilisez le script: npm run create-test-users
--
-- 📋 COMPTES DE TEST DISPONIBLES:
--
-- 🔧 ADMIN:
--    Email: admin@mon-toit.ci
--    Mot de passe: admin123
--    Tableau de bord: http://localhost:8080/admin
--
-- 🏠 PROPRIÉTAIRES (9 comptes):
--    kouadio.jean@mon-toit.ci (proprietaire123)
--    marie.aya@mon-toit.ci (proprietaire123)
--    koffi.alain@mon-toit.ci (proprietaire123)
--    patricia.kouame@mon-toit.ci (proprietaire123)
--    adou.rosine@mon-toit.ci (proprietaire123)
--    traore.sami@mon-toit.ci (proprietaire123)
--    konan.emma@mon-toit.ci (proprietaire123)
--    nguessan.fred@mon-toit.ci (proprietaire123)
--    kone.adama@proprietaire.ci (proprietaire123)
--
-- 🏠 LOCATAIRES (4 comptes):
--    yao.konan@mon-toit.ci (locataire123)
--    aminata.diarra@mon-toit.ci (locataire123)
--    dr.yeo@mon-toit.ci (locataire123)
--    toure.mohamed@locataire.ci (locataire123)
--
-- 🏢 AGENCES (2 comptes):
--    contact@agence-cocody.ci (agence123)
--    info@ankou-realestate.ci (agence123)
--
-- 🤝 TIERS DE CONFIANCE (1 compte):
--    notaire.konan@mon-toit.ci (tiers123)
--
-- Note: Les comptes utilisateurs doivent être créés avec le script JS.
-- Ce seed ne contient que les données de test (propriétés, rôles, etc.)

-- ⚠️ NOTE: Les utilisateurs et profils ne sont plus créés ici.
-- Utilisez le script: npm run create-test-users pour créer les utilisateurs avec leurs profils

-- Create sample properties (these will be associated with users via the script)
DO $$
DECLARE
  -- Property IDs (fixed for consistency)
  prop1_id UUID := '550e8400-e29b-41d4-a716-446655440101';
  prop2_id UUID := '550e8400-e29b-41d4-a716-446655440102';
  prop3_id UUID := '550e8400-e29b-41d4-a716-446655440103';
  prop4_id UUID := '550e8400-e29b-41d4-a716-446655440104';
  prop5_id UUID := '550e8400-e29b-41d4-a716-446655440105';
  prop6_id UUID := '550e8400-e29b-41d4-a716-446655440106';
  prop7_id UUID := '550e8400-e29b-41d4-a716-446655440107';
  prop8_id UUID := '550e8400-e29b-41d4-a716-446655440108';
  prop9_id UUID := '550e8400-e29b-41d4-a716-446655440109';
  prop10_id UUID := '550e8400-e29b-41d4-a716-446655440110';

  -- Additional properties
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
BEGIN
  -- Insert sample properties (owner_id will be updated by the script)
  INSERT INTO public.properties (id, title, description, property_type, city, neighborhood, address, monthly_rent, surface_area, bedrooms, bathrooms, owner_id, status, latitude, longitude, created_at, updated_at) VALUES
    (prop1_id, 'Appartement F3 Cocody', 'Bel appartement F3 dans un quartier résidentiel calme', 'appartement', 'Abidjan', 'Cocody', 'Rue des Palmiers, Cocody', 350000, 120, 3, 2, NULL, 'disponible', 5.3589, -4.0083, NOW(), NOW()),
    (prop2_id, 'Studio Yopougon', 'Studio idéal pour étudiant ou jeune professionnel', 'studio', 'Abidjan', 'Yopougon', 'Boulevard du Lac, Yopougon', 80000, 35, 1, 1, NULL, 'disponible', 5.3295, -4.0627, NOW(), NOW()),
    (prop3_id, 'Bureau Plateau', 'Bureau de standing au centre-ville', 'bureau', 'Abidjan', 'Plateau', 'Avenue Ch. de Gaulle, Plateau', 250000, 100, 0, 1, NULL, 'disponible', 5.3402, -4.0087, NOW(), NOW()),
    (prop4_id, 'Villa F5 Marcory', 'Spacieuse villa F5 avec jardin et garage', 'villa', 'Abidjan', 'Marcory', 'Rue des Hibiscus, Marcory', 600000, 220, 5, 4, NULL, 'disponible', 5.3069, -3.9912, NOW(), NOW()),
    (prop5_id, 'Résidence Studio Treichville', 'Immeuble de studios meublés pour étudiants', 'studio', 'Abidjan', 'Treichville', 'Impasse des Lycéens, Treichville', 90000, 30, 0, 1, NULL, 'disponible', 5.2846, -3.9765, NOW(), NOW()),
    (prop6_id, 'Local Commercial Plateau', 'Local commercial situé en zone passante', 'local_commercial', 'Abidjan', 'Plateau', 'Rue du Marché, Plateau', 450000, 120, 0, 2, NULL, 'disponible', 5.3358, -4.0156, NOW(), NOW()),
    (prop7_id, 'Appartement F2 Cocody', 'Charmant F2 proche universités', 'appartement', 'Abidjan', 'Cocody', 'Avenue des Universités, Cocody', 180000, 60, 2, 1, NULL, 'disponible', 5.3672, -3.9894, NOW(), NOW()),
    (prop8_id, 'Bureau Zone 4', 'Bureau moderne en open-space', 'bureau', 'Abidjan', 'Zone 4', 'Boulevard des Affaires, Zone 4', 300000, 110, 0, 1, NULL, 'disponible', 5.3187, -3.9832, NOW(), NOW()),
    (prop9_id, 'Appartement F3 Abobo', 'Appartement spacieux dans quartier résidentiel', 'appartement', 'Abidjan', 'Abobo', 'Boulevard de la Liberté, Abobo', 250000, 110, 3, 2, NULL, 'disponible', 5.4218, -4.0215, NOW(), NOW()),
    (prop10_id, 'Studio Meublé Adjame', 'Studio moderne meublé près du marché', 'studio', 'Abidjan', 'Adjamé', 'Rue du Commerce, Adjamé', 75000, 28, 0, 1, NULL, 'disponible', 5.3669, -4.0317, NOW(), NOW()),

    -- Additional properties
    (prop11_id, 'Villa F4 Riviera', 'Villa de luxe avec piscine privative', 'villa', 'Abidjan', 'Riviera', 'Avenue des Palmiers, Riviera', 800000, 280, 4, 3, NULL, 'disponible', 5.3765, -3.9456, NOW(), NOW()),
    (prop12_id, 'Bureau Commercial Marcory', 'Espace de bureau idéalement situé', 'bureau', 'Abidjan', 'Marcory', 'Rue des Entreprises, Marcory', 320000, 95, 0, 1, NULL, 'disponible', 5.3024, -3.9857, NOW(), NOW()),
    (prop13_id, 'Appartement F1 Plateau', 'Studio centre-ville avec vue', 'appartement', 'Abidjan', 'Plateau', 'Avenue du Progrès, Plateau', 150000, 45, 1, 1, NULL, 'disponible', 5.3421, -4.0098, NOW(), NOW()),
    (prop14_id, 'Résidence F5 Yopougon', 'Grande résidence familiale', 'villa', 'Abidjan', 'Yopougon', 'Boulevard des Nations, Yopougon', 450000, 200, 5, 3, NULL, 'disponible', 5.3356, -4.0543, NOW(), NOW()),
    (prop15_id, 'Local Commercial Cocody', 'Magasin commercial en zone passante', 'local_commercial', 'Abidjan', 'Cocody', 'Rue des Commerces, Cocody', 380000, 80, 0, 1, NULL, 'disponible', 5.3634, -3.9987, NOW(), NOW()),
    (prop16_id, 'Appartement F2 Treichville', 'Appartement rénové près du port', 'appartement', 'Abidjan', 'Treichville', 'Avenue du Port, Treichville', 200000, 65, 2, 1, NULL, 'disponible', 5.2798, -3.9689, NOW(), NOW()),
    (prop17_id, 'Villa F6 Bingerville', 'Villa de prestige avec grand jardin', 'villa', 'Abidjan', 'Bingerville', 'Route de la Paix, Bingerville', 900000, 320, 6, 4, NULL, 'disponible', 5.3467, -3.8765, NOW(), NOW()),
    (prop18_id, 'Studio Etudiant Cocody', 'Studio adapté pour étudiants', 'studio', 'Abidjan', 'Cocody', 'Rue Universitaire, Cocody', 95000, 32, 0, 1, NULL, 'disponible', 5.3701, -3.9923, NOW(), NOW()),
    (prop19_id, 'Bureau Open Space Zone 4', 'Espace de travail moderne et lumineux', 'bureau', 'Abidjan', 'Zone 4', 'Avenue de la Technologie, Zone 4', 420000, 130, 0, 2, NULL, 'disponible', 5.3156, -3.9789, NOW(), NOW()),
    (prop20_id, 'Appartement F4 Marcory', 'Appartement familial avec balcon', 'appartement', 'Abidjan', 'Marcory', 'Boulevard de la République, Marcory', 380000, 140, 4, 2, NULL, 'disponible', 5.3087, -3.9965, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Propriétés de test créées (owner_id sera mis à jour par le script)';
END $$;

-- Create sample notifications (will be associated with users via the script)
DO $$
BEGIN
  -- Create notifications template that will be copied for each user
  -- The script will create actual notifications for each user

  RAISE NOTICE '✓ Structure des notifications préparée (sera créée par le script)';
END $$;

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE '=== SEED GLOBAL TERMINÉ AVEC SUCCÈS ===';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT: Les comptes utilisateurs doivent être créés avec:';
  RAISE NOTICE '   npm run create-test-users';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COMPTES DE TEST DISPONIBLES:';
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMINISTRATEUR:';
  RAISE NOTICE '   Email: admin@mon-toit.ci';
  RAISE NOTICE '   Mot de passe: admin123';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 PROPRIÉTAIRES (exemples):';
  RAISE NOTICE '   kouadio.jean@mon-toit.ci (proprietaire123)';
  RAISE NOTICE '   marie.aya@mon-toit.ci (proprietaire123)';
  RAISE NOTICE '   koffi.alain@mon-toit.ci (proprietaire123)';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 LOCATAIRES:';
  RAISE NOTICE '   yao.konan@mon-toit.ci (locataire123)';
  RAISE NOTICE '   aminata.diarra@mon-toit.ci (locataire123)';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 AGENCES:';
  RAISE NOTICE '   contact@agence-cocody.ci (agence123)';
  RAISE NOTICE '   info@ankou-realestate.ci (agence123)';
  RAISE NOTICE '';
  RAISE NOTICE '🤝 TIERS DE CONFIANCE:';
  RAISE NOTICE '   notaire.konan@mon-toit.ci (tiers123)';
  RAISE NOTICE '=========================================';
END $$;
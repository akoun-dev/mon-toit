-- Script de seed pour les donnees de test
-- A executer apres avoir cree les utilisateurs via l'interface Supabase Auth

-- =====================================================
-- UTILISATEURS DE TEST (UUIDs a remplacer avec les vrais UUIDs)
-- =====================================================

-- NOTE: Creez d'abord ces utilisateurs via l'interface Supabase Auth:
-- Email: admin@mon-toit.ci / Password: admin123
-- Email: kouadio.jean@mon-toit.ci / Password: proprietaire123
-- Email: marie.aya@mon-toit.ci / Password: proprietaire123
-- Email: koffi.alain@mon-toit.ci / Password: proprietaire123
-- Email: yao.konan@mon-toit.ci / Password: locataire123
-- Email: aminata.diarra@mon-toit.ci / Password: locataire123
-- Email: contact@agence-cocody.ci / Password: agence123
-- Email: info@ankou-realestate.ci / Password: agence123
-- Email: notaire.konan@mon-toit.ci / Password: tiers123

-- Recuperez les UUIDs depuis la table auth.users et remplacez ci-dessous:
-- SELECT id, email FROM auth.users ORDER BY created_at;

-- Profils utilisateurs
INSERT INTO public.profiles (id, full_name, user_type, city, phone, is_verified, oneci_verified, cnam_verified, face_verified)
VALUES
  -- Admin (remplacer 11111111-1111-1111-1111-111111111111 par le vrai UUID)
  ('11111111-1111-1111-1111-111111111111', 'Administrateur ANSUT', 'admin_ansut', 'Abidjan', '+22500000000', true, true, true, true),

  -- Proprietaires (remplacer les UUIDs par les vrais)
  ('22222222-2222-2222-2222-222222222222', 'Kouadio Jean Claude', 'proprietaire', 'Abidjan', '+22501010101', true, true, true, true),
  ('33333333-3333-3333-3333-333333333333', 'Marie Aya Bamba', 'proprietaire', 'Abidjan', '+22502020202', true, true, true, false),
  ('44444444-4444-4444-4444-444444444444', 'Koffi Alain Konan', 'proprietaire', 'Abidjan', '+22503030303', true, true, false, true),
  ('55555555-5555-5555-5555-555555555555', 'Simone Kouame', 'proprietaire', 'Abidjan', '+22504040404', false, false, false, false),
  ('66666666-6666-6666-6666-666666666666', 'Patrice Yao', 'proprietaire', 'Abidjan', '+22505050505', true, true, true, true),

  -- Locataires (remplacer les UUIDs par les vrais)
  ('77777777-7777-7777-7777-777777777777', 'Yao Konan', 'locataire', 'Abidjan', '+22506060606', true, true, true, true),
  ('88888888-8888-8888-8888-888888888888', 'Aminata Diarra', 'locataire', 'Abidjan', '+22507070707', true, true, false, true),
  ('99999999-9999-9999-9999-999999999999', 'Mohamed Traore', 'locataire', 'Abidjan', '+22508080808', false, false, false, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fatoumata Bamba', 'locataire', 'Abidjan', '+22509090909', true, true, true, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jean-Claude Kouame', 'locataire', 'Abidjan', '+22510101010', true, false, true, false),

  -- Agences (remplacer les UUIDs par les vrais)
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Agence Cocody Immobilier', 'agence', 'Abidjan', '+22520202020', true, true, true, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Ankou Real Estate', 'agence', 'Abidjan', '+22521212121', true, true, true, true),

  -- Tiers de confiance (remplacer les UUIDs par les vrais)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Maitre Konan', 'tiers_de_confiance', 'Abidjan', '+22522222222', true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ROLES UTILISATEURS
-- =====================================================

-- Roles assignes
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin_ansut'),
  ('22222222-2222-2222-2222-222222222222', 'proprietaire'),
  ('33333333-3333-3333-3333-333333333333', 'proprietaire'),
  ('44444444-4444-4444-4444-444444444444', 'proprietaire'),
  ('55555555-5555-5555-5555-555555555555', 'proprietaire'),
  ('66666666-6666-6666-6666-666666666666', 'proprietaire'),
  ('77777777-7777-7777-7777-777777777777', 'locataire'),
  ('88888888-8888-8888-8888-888888888888', 'locataire'),
  ('99999999-9999-9999-9999-999999999999', 'locataire'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'locataire'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'locataire'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'agence'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'agence'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'tiers_de_confiance')
ON CONFLICT DO NOTHING;

-- Roles actifs
INSERT INTO public.user_active_roles (user_id, active_role, available_roles)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin_ansut', '{admin_ansut}'),
  ('22222222-2222-2222-2222-222222222222', 'proprietaire', '{proprietaire}'),
  ('33333333-3333-3333-3333-333333333333', 'proprietaire', '{proprietaire}'),
  ('44444444-4444-4444-4444-444444444444', 'proprietaire', '{proprietaire}'),
  ('55555555-5555-5555-5555-555555555555', 'proprietaire', '{proprietaire}'),
  ('66666666-6666-6666-6666-666666666666', 'proprietaire', '{proprietaire}'),
  ('77777777-7777-7777-7777-777777777777', 'locataire', '{locataire}'),
  ('88888888-8888-8888-8888-888888888888', 'locataire', '{locataire}'),
  ('99999999-9999-9999-9999-999999999999', 'locataire', '{locataire}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'locataire', '{locataire}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'locataire', '{locataire}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'agence', '{agence}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'agence', '{agence}'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'tiers_de_confiance', '{tiers_de_confiance}')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- PROPRIETES
-- =====================================================

INSERT INTO public.properties (
  id, title, description, property_type, city, neighborhood, address,
  monthly_rent, deposit_amount, surface_area, bedrooms, bathrooms, owner_id, status,
  is_furnished, has_ac, has_parking, has_garden, latitude, longitude,
  main_image, images, video_url, virtual_tour_url, view_count, created_at, updated_at
) VALUES
  -- Appartements Cocody
  ('11111111-1111-1111-1111-111111111111',
   'Bel appartement 2 pieces a Cocody',
   'Magnifique appartement 2 pieces dans une residence securisee a Cocody. Proche des commerces et ecoles. Climatisation, parking securise, balcon avec vue.',
   'Appartement', 'Abidjan', 'Cocody', 'Rue des Jardins, Cocody',
   150000, 300000, 65, 2, 1, '22222222-2222-2222-2222-222222222222', 'disponible',
   true, true, true, false, 5.3600, -3.9833,
   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'],
   NULL, NULL, 45, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

  ('22222222-2222-2222-2222-222222222222',
   'Studio moderne Cocody Riviera',
   'Studio moderne et fonctionnel dans la zone riviera de Cocody. Ideal pour jeune professionnel. Cuisine equipee, salle de bain moderne.',
   'Studio', 'Abidjan', 'Cocody', 'Boulevard Riviera, Cocody',
   80000, 160000, 35, 0, 1, '22222222-2222-2222-2222-222222222222', 'disponible',
   false, true, false, false, 5.3650, -3.9800,
   'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'],
   NULL, NULL, 32, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),

  -- Maisons Yopougon
  ('33333333-3333-3333-3333-333333333333',
   'Villa 3 chambres avec piscine Yopougon',
   'Superbe villa avec piscine privee a Yopougon. Grande terrasse et jardin. Securise 24/7. Salon spacieux, cuisine moderne, garage pour 2 voitures.',
   'Villa', 'Abidjan', 'Yopougon', 'Zone industrielle, Yopougon',
   250000, 500000, 180, 3, 2, '33333333-3333-3333-3333-333333333333', 'disponible',
   true, true, true, true, 5.3200, -4.0167,
   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'],
   NULL, NULL, 78, NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days'),

  ('44444444-4444-4444-4444-444444444444',
   'Appartement T3 Yopougon',
   'Appartement 3 pieces spacieux a Yopougon. Proche du marche et des transports en commun. Bon etat general, quartier calme.',
   'Appartement', 'Abidjan', 'Yopougon', 'Andokoi, Yopougon',
   120000, 240000, 85, 3, 1, '33333333-3333-3333-3333-333333333333', 'disponible',
   false, true, true, false, 5.3250, -4.0200,
   'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&h=600&fit=crop'],
   NULL, NULL, 56, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),

  -- Plateau
  ('55555555-5555-5555-5555-555555555555',
   'Bureau de prestige Plateau',
   'Bureau de luxe dans le quartier daffaires du Plateau. Vue imprenable sur la lagune. Climatisation centralisee, parking visiteurs.',
   'Bureau', 'Abidjan', 'Plateau', 'Avenue Chardy, Plateau',
   350000, 700000, 120, 0, 2, '44444444-4444-4444-4444-444444444444', 'disponible',
   true, true, true, false, 5.3333, -4.0167,
   'https://images.unsplash.com/photo-1497366216548-375f7030c5bb?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1497366216548-375f7030c5bb?w=800&h=600&fit=crop'],
   NULL, NULL, 23, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

  -- Marcory
  ('66666666-6666-6666-6666-666666666666',
   'Appartement meuble Marcory',
   'Appartement meuble moderne a Marcory. Proche du centre commercial et restaurants. Ideal pour expatries.',
   'Appartement', 'Abidjan', 'Marcory', 'Zone 4, Marcory',
   110000, 220000, 75, 2, 1, '44444444-4444-4444-4444-444444444444', 'loue',
   true, true, false, false, 5.3000, -4.0000,
   'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&h=600&fit=crop'],
   NULL, NULL, 89, NOW() - INTERVAL '60 days', NOW() - INTERVAL '15 days'),

  ('77777777-7777-7777-7777-777777777777',
   'Studio meuble Marcory',
   'Studio meuble cosy a Marcory. Ideal pour etudiant ou jeune professionnel. Quartier anime, transports faciles.',
   'Studio', 'Abidjan', 'Marcory', 'Zone 4, Marcory',
   70000, 140000, 30, 0, 1, '55555555-5555-5555-5555-555555555555', 'disponible',
   true, true, false, false, 5.3050, -4.0050,
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'],
   NULL, NULL, 34, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

  -- Treichville
  ('88888888-8888-8888-8888-888888888888',
   'Appartement 3 pieces Treichville',
   'Appartement familial a Treichville. Proche du marche et des ecoles. Quartier populaire mais tranquille.',
   'Appartement', 'Abidjan', 'Treichville', 'Boulevard de Marseille, Treichville',
   130000, 260000, 95, 3, 2, '55555555-5555-5555-5555-555555555555', 'disponible',
   false, true, true, false, 5.2833, -4.0000,
   'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
   NULL, NULL, 67, NOW() - INTERVAL '25 days', NOW() - INTERVAL '4 days'),

  -- Abobo
  ('99999999-9999-9999-9999-999999999999',
   'Appartement 2 pieces Abobo',
   'Appartement abordable a Abobo. Bien desservi par les transports en commun. Ideal pour petit budget.',
   'Appartement', 'Abidjan', 'Abobo', 'Abobo-Baoule, Abobo',
   90000, 180000, 55, 2, 1, '66666666-6666-6666-6666-666666666666', 'disponible',
   false, false, true, false, 5.4167, -4.0167,
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'],
   NULL, NULL, 41, NOW() - INTERVAL '35 days', NOW() - INTERVAL '7 days'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Studio Abobo',
   'Studio economique a Abobo. Parfait pour debutant. Proche des commerces de premiere necessite.',
   'Studio', 'Abidjan', 'Abobo', 'Abobo-sogefiha, Abobo',
   60000, 120000, 25, 0, 1, '66666666-6666-6666-6666-666666666666', 'disponible',
   false, false, false, false, 5.4200, -4.0200,
   'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop'],
   NULL, NULL, 28, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MEDIAS DES PROPRIETES
-- =====================================================

INSERT INTO public.property_media (property_id, media_type, url, title, description, order_index, is_primary, metadata)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'image', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', 'Salon', 'Spacieux salon avec climatisation', 1, true, '{"size": "800x600", "format": "jpg"}'),
  ('11111111-1111-1111-1111-111111111111', 'image', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', 'Chambre', 'Chambre principale avec lit double', 2, false, '{"size": "800x600", "format": "jpg"}'),

  ('33333333-3333-3333-3333-333333333333', 'image', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'Facade', 'Vue exterieure de la villa', 1, true, '{"size": "800x600", "format": "jpg"}'),
  ('33333333-3333-3333-3333-333333333333', 'image', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'Piscine', 'Piscine privee avec terrasse', 2, false, '{"size": "800x600", "format": "jpg"}'),

  ('55555555-5555-5555-5555-555555555555', 'image', 'https://images.unsplash.com/photo-1497366216548-375f7030c5bb?w=800&h=600&fit=crop', 'Vue bureau', 'Bureau spacieux avec vue lagune', 1, true, '{"size": "800x600", "format": "jpg"}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COÛTS DES UTILITÉS
-- =====================================================

INSERT INTO public.property_utility_costs (property_id, utility_type, amount, frequency, is_included_in_rent, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'electricity', 15000, 'monthly', false, 'Consommation electrique estimee'),
  ('11111111-1111-1111-1111-111111111111', 'water', 5000, 'monthly', false, 'Facture d''eau mensuelle'),
  ('11111111-1111-1111-1111-111111111111', 'maintenance', 10000, 'monthly', true, 'Frais de syndic et entretien'),

  ('33333333-3333-3333-3333-333333333333', 'electricity', 25000, 'monthly', false, 'Consommation electrique (climatisation)'),
  ('33333333-3333-3333-3333-333333333333', 'water', 8000, 'monthly', false, 'Facture d''eau et piscine'),
  ('33333333-3333-3333-3333-333333333333', 'maintenance', 15000, 'monthly', false, 'Gardien et entretien jardin'),

  ('55555555-5555-5555-5555-555555555555', 'electricity', 30000, 'monthly', false, 'Climatisation centralisee'),
  ('55555555-5555-5555-5555-555555555555', 'maintenance', 50000, 'monthly', true, 'Services communs immeuble')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ANALYTICS INITIAUX
-- =====================================================

-- Analytics journaliers pour chaque propriete
INSERT INTO public.property_analytics (property_id, view_date, total_views, unique_views)
SELECT
  id,
  CURRENT_DATE - INTERVAL '1 day',
  FLOOR(RANDOM() * 20 + 5)::integer,
  FLOOR(RANDOM() * 15 + 3)::integer
FROM public.properties
ON CONFLICT (property_id, view_date) DO NOTHING;

INSERT INTO public.property_analytics (property_id, view_date, total_views, unique_views)
SELECT
  id,
  CURRENT_DATE,
  FLOOR(RANDOM() * 10 + 2)::integer,
  FLOOR(RANDOM() * 8 + 1)::integer
FROM public.properties
ON CONFLICT (property_id, view_date) DO NOTHING;

-- =====================================================
-- FAVORIS UTILISATEURS
-- =====================================================

INSERT INTO public.user_favorites (user_id, property_id, created_at)
VALUES
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days'),
  ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '1 day'),

  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days'),
  ('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '4 days'),

  ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '1 day'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '4 days')
ON CONFLICT (user_id, property_id) DO NOTHING;

-- =====================================================
-- CONFIGURATION SYSTÈME
-- =====================================================

INSERT INTO public.processing_config (key, value, description, category)
VALUES
  ('max_properties_per_user', '50', 'Nombre maximum de proprietes par utilisateur', 'limits'),
  ('auto_moderation_enabled', 'true', 'Activer la moderation automatique', 'moderation'),
  ('notification_email_enabled', 'true', 'Activer les notifications par email', 'notifications'),
  ('max_applications_per_property', '10', 'Nombre maximum de candidatures par propriete', 'limits')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VALIDATION ET RAPPORT
-- =====================================================

DO $$
DECLARE
    prop_count INTEGER;
    user_count INTEGER;
    role_count INTEGER;
    fav_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO prop_count FROM public.properties;
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    SELECT COUNT(*) INTO role_count FROM public.user_roles;
    SELECT COUNT(*) INTO fav_count FROM public.user_favorites;

    RAISE NOTICE '=== Seed de donnees cree avec succes ===';
    RAISE NOTICE 'Profils utilisateurs crees: %', user_count;
    RAISE NOTICE 'Proprietes crees: %', prop_count;
    RAISE NOTICE 'Roles utilisateurs crees: %', role_count;
    RAISE NOTICE 'Favoris crees: %', fav_count;
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: N''oubliez pas de remplacer les UUIDs dans ce fichier';
    RAISE NOTICE 'par les vrais UUIDs de vos utilisateurs crees dans auth.users';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour recuperer les UUIDs:';
    RAISE NOTICE 'SELECT id, email FROM auth.users ORDER BY created_at;';
    RAISE NOTICE '';
    RAISE NOTICE 'Comptes de test (a creer manuellement):';
    RAISE NOTICE 'Admin: admin@mon-toit.ci / admin123';
    RAISE NOTICE 'Proprietaire: kouadio.jean@mon-toit.ci / proprietaire123';
    RAISE NOTICE 'Locataire: yao.konan@mon-toit.ci / locataire123';
    RAISE NOTICE 'Agence: contact@agence-cocody.ci / agence123';
    RAISE NOTICE 'Tiers: notaire.konan@mon-toit.ci / tiers123';
END $$;
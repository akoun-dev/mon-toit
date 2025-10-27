-- Seed data pour l'application immobilière
-- Mots de passe : Tous les mots de passe sont "Password123!"

-- Nettoyage des données existantes (optionnel - à utiliser avec précaution)
-- TRUNCATE TABLE public.properties CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE;

-- Insertion des utilisateurs dans auth.users et public.profiles
-- Note: Dans un environnement Supabase, les utilisateurs sont d'abord créés via l'authentification
-- Ici nous utilisons la fonction auth.users() pour créer les utilisateurs

-- 1. Création des utilisateurs dans auth.users
INSERT INTO auth.users (id, email, email_confirmed_at, phone, phone_confirmed_at, raw_user_meta_data, created_at, updated_at) VALUES
-- Locataires
('11111111-1111-1111-1111-111111111111', 'jean.dupont@example.com', NOW(), '+2250701010101', NOW(), '{"full_name": "Jean Dupont"}', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'marie.kone@example.com', NOW(), '+2250702020202', NOW(), '{"full_name": "Marie Koné"}', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'paul.yao@example.com', NOW(), '+2250703030303', NOW(), '{"full_name": "Paul Yao"}', NOW(), NOW()),

-- Propriétaires
('44444444-4444-4444-4444-444444444444', 'sophie.traore@example.com', NOW(), '+2250704040404', NOW(), '{"full_name": "Sophie Traoré"}', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'alain.diarra@example.com', NOW(), '+2250705050505', NOW(), '{"full_name": "Alain Diarra"}', NOW(), NOW()),

-- Agences
('66666666-6666-6666-6666-666666666666', 'agence.ci@example.com', NOW(), '+2250706060606', NOW(), '{"full_name": "Agence Immobilière CI"}', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'premium.habitat@example.com', NOW(), '+2250707070707', NOW(), '{"full_name": "Premium Habitat"}', NOW(), NOW()),

-- Admin
('88888888-8888-8888-8888-888888888888', 'admin.ansut@example.com', NOW(), '+2250708080808', NOW(), '{"full_name": "Admin ANSUT"}', NOW(), NOW());

-- 2. Création des profils utilisateurs
INSERT INTO public.profiles (id, full_name, user_type, phone, city, is_verified, created_at, updated_at) VALUES
-- Locataires
('11111111-1111-1111-1111-111111111111', 'Jean Dupont', 'locataire'::user_type, '+2250701010101', 'Abidjan', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Marie Koné', 'locataire'::user_type, '+2250702020202', 'Abidjan', true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Paul Yao', 'locataire'::user_type, '+2250703030303', 'Bouaké', true, NOW(), NOW()),

-- Propriétaires
('44444444-4444-4444-4444-444444444444', 'Sophie Traoré', 'proprietaire'::user_type, '+2250704040404', 'Abidjan', true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Alain Diarra', 'proprietaire'::user_type, '+2250705050505', 'Yamoussoukro', true, NOW(), NOW()),

-- Agences
('66666666-6666-6666-6666-666666666666', 'Agence Immobilière CI', 'agence'::user_type, '+2250706060606', 'Abidjan', true, NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'Premium Habitat', 'agence'::user_type, '+2250707070707', 'Abidjan', true, NOW(), NOW()),

-- Admin
('88888888-8888-8888-8888-888888888888', 'Admin ANSUT', 'admin_ansut'::user_type, '+2250708080808', 'Abidjan', true, NOW(), NOW());

-- Insertion des rôles utilisateurs
INSERT INTO public.user_roles (user_id, role) VALUES
('11111111-1111-1111-1111-111111111111', 'locataire'::user_type),
('22222222-2222-2222-2222-222222222222', 'locataire'::user_type),
('33333333-3333-3333-3333-333333333333', 'locataire'::user_type),
('44444444-4444-4444-4444-444444444444', 'proprietaire'::user_type),
('55555555-5555-5555-5555-555555555555', 'proprietaire'::user_type),
('66666666-6666-6666-6666-666666666666', 'agence'::user_type),
('77777777-7777-7777-7777-777777777777', 'agence'::user_type),
('88888888-8888-8888-8888-888888888888', 'admin_ansut'::user_type);

-- Insertion des rôles actifs
INSERT INTO public.user_active_roles (user_id, active_role, available_roles) VALUES
('11111111-1111-1111-1111-111111111111', 'locataire'::user_type, ARRAY['locataire']::user_type[]),
('22222222-2222-2222-2222-222222222222', 'locataire'::user_type, ARRAY['locataire']::user_type[]),
('33333333-3333-3333-3333-333333333333', 'locataire'::user_type, ARRAY['locataire']::user_type[]),
('44444444-4444-4444-4444-444444444444', 'proprietaire'::user_type, ARRAY['proprietaire']::user_type[]),
('55555555-5555-5555-5555-555555555555', 'proprietaire'::user_type, ARRAY['proprietaire']::user_type[]),
('66666666-6666-6666-6666-666666666666', 'agence'::user_type, ARRAY['agence']::user_type[]),
('77777777-7777-7777-7777-777777777777', 'agence'::user_type, ARRAY['agence']::user_type[]),
('88888888-8888-8888-8888-888888888888', 'admin_ansut'::user_type, ARRAY['admin_ansut']::user_type[]);

-- Insertion des préférences utilisateurs
INSERT INTO public.user_preferences (user_id, theme, language, notifications_enabled, preferred_areas, budget_min, budget_max) VALUES
('11111111-1111-1111-1111-111111111111', 'light', 'fr', true, ARRAY['Cocody', 'Plateau'], 150000, 300000),
('22222222-2222-2222-2222-222222222222', 'dark', 'fr', true, ARRAY['Marcory', 'Koumassi'], 80000, 180000),
('33333333-3333-3333-3333-333333333333', 'light', 'fr', true, ARRAY['Bouaké Centre'], 50000, 120000),
('44444444-4444-4444-4444-444444444444', 'light', 'fr', true, NULL, NULL, NULL),
('55555555-5555-5555-5555-555555555555', 'light', 'fr', true, NULL, NULL, NULL);

-- Insertion des propriétés
INSERT INTO public.properties (
  id, title, description, property_type, city, neighborhood, address, 
  monthly_rent, deposit_amount, surface_area, bedrooms, bathrooms, 
  owner_id, status, is_furnished, has_ac, has_parking, has_garden,
  latitude, longitude, floor_number, moderated_at, moderated_by,
  moderation_status, main_image, images, created_at, updated_at
) VALUES
-- Propriétés de Sophie Traoré
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Appartement moderne à Cocody',
  'Bel appartement moderne de 3 pièces situé à Cocody, proche de l''Université Félix Houphouët-Boigny. Appartement entièrement meublé avec climatisation et parking sécurisé.',
  'appartement',
  'Abidjan',
  'Cocody',
  'Rue des Jardins, Cocody',
  250000,
  500000,
  85,
  3,
  2,
  '44444444-4444-4444-4444-444444444444',
  'disponible',
  true,
  true,
  true,
  false,
  5.359952,
  -4.008256,
  3,
  NOW(),
  '88888888-8888-8888-8888-888888888888',
  'approved',
  'https://example.com/images/apt1-main.jpg',
  ARRAY[
    'https://example.com/images/apt1-1.jpg',
    'https://example.com/images/apt1-2.jpg',
    'https://example.com/images/apt1-3.jpg'
  ],
  NOW(),
  NOW()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Studio étudiant à Plateau',
  'Studio fonctionnel idéal pour étudiant, situé au cœur du Plateau. Proche des transports et des commodités. Charges comprises.',
  'studio',
  'Abidjan',
  'Plateau',
  'Avenue Chardy, Plateau',
  120000,
  240000,
  35,
  1,
  1,
  '44444444-4444-4444-4444-444444444444',
  'disponible',
  true,
  true,
  false,
  false,
  5.326054,
  -4.027426,
  2,
  NOW(),
  '88888888-8888-8888-8888-888888888888',
  'approved',
  'https://example.com/images/studio1-main.jpg',
  ARRAY[
    'https://example.com/images/studio1-1.jpg',
    'https://example.com/images/studio1-2.jpg'
  ],
  NOW(),
  NOW()
),

-- Propriétés de Alain Diarra
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Villa spacieuse à Yamoussoukro',
  'Magnifique villa de 4 chambres avec jardin et garage. Idéale pour famille. Quartier calme et résidentiel.',
  'villa',
  'Yamoussoukro',
  'Hôtel de Ville',
  'Route de l''Hôtel de Ville',
  350000,
  700000,
  150,
  4,
  3,
  '55555555-5555-5555-5555-555555555555',
  'disponible',
  false,
  true,
  true,
  true,
  6.840785,
  -5.251835,
  1,
  NOW(),
  '88888888-8888-8888-8888-888888888888',
  'approved',
  'https://example.com/images/villa1-main.jpg',
  ARRAY[
    'https://example.com/images/villa1-1.jpg',
    'https://example.com/images/villa1-2.jpg',
    'https://example.com/images/villa1-3.jpg',
    'https://example.com/images/villa1-4.jpg'
  ],
  NOW(),
  NOW()
),

-- Propriétés de l''Agence Immobilière CI
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Duplex de standing à Marcory',
  'Superbe duplex récemment rénové avec vue sur la lagune. Standing haut de gamme avec piscine et sécurité 24h/24.',
  'duplex',
  'Abidjan',
  'Marcory',
  'Rue du Commerce, Marcory',
  450000,
  900000,
  120,
  3,
  2,
  '66666666-6666-6666-6666-666666666666',
  'disponible',
  true,
  true,
  true,
  true,
  5.296978,
  -4.001426,
  2,
  NOW(),
  '88888888-8888-8888-8888-888888888888',
  'approved',
  'https://example.com/images/duplex1-main.jpg',
  ARRAY[
    'https://example.com/images/duplex1-1.jpg',
    'https://example.com/images/duplex1-2.jpg',
    'https://example.com/images/duplex1-3.jpg'
  ],
  NOW(),
  NOW()
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Appartement F4 à Koumassi',
  'Appartement spacieux F4 dans immeuble calme. Proche marché et transports. Idéal pour famille.',
  'appartement',
  'Abidjan',
  'Koumassi',
  'Avenue 12, Koumassi',
  180000,
  360000,
  75,
  4,
  2,
  '66666666-6666-6666-6666-666666666666',
  'disponible',
  false,
  true,
  true,
  false,
  5.287574,
  -3.968119,
  1,
  NOW(),
  '88888888-8888-8888-8888-888888888888',
  'approved',
  'https://example.com/images/apt2-main.jpg',
  ARRAY[
    'https://example.com/images/apt2-1.jpg',
    'https://example.com/images/apt2-2.jpg'
  ],
  NOW(),
  NOW()
),

-- Propriétés de Premium Habitat
(
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Résidence sécurisée à Angré',
  'Appartement dans résidence haut standing avec piscine, gym et sécurité. Vue dégagée et environnement calme.',
  'appartement',
  'Abidjan',
  'Angré',
  'Rue des Pêcheurs, Angré',
  320000,
  640000,
  90,
  3,
  2,
  '77777777-7777-7777-7777-777777777777',
  'disponible',
  true,
  true,
  true,
  true,
  5.376945,
  -3.987654,
  5,
  NOW(),
  '88888888-8888-8888-8888-888888888888',
  'approved',
  'https://example.com/images/residence1-main.jpg',
  ARRAY[
    'https://example.com/images/residence1-1.jpg',
    'https://example.com/images/residence1-2.jpg',
    'https://example.com/images/residence1-3.jpg'
  ],
  NOW(),
  NOW()
);

-- Insertion des médias des propriétés
INSERT INTO public.property_media (property_id, media_type, url, title, order_index, is_primary) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'image', 'https://example.com/images/apt1-1.jpg', 'Salon', 1, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'image', 'https://example.com/images/apt1-2.jpg', 'Cuisine', 2, false),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'image', 'https://example.com/images/apt1-3.jpg', 'Chambre', 3, false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'image', 'https://example.com/images/studio1-1.jpg', 'Vue générale', 1, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'image', 'https://example.com/images/studio1-2.jpg', 'Coin cuisine', 2, false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'image', 'https://example.com/images/villa1-1.jpg', 'Façade', 1, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'image', 'https://example.com/images/villa1-2.jpg', 'Jardin', 2, false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'image', 'https://example.com/images/villa1-3.jpg', 'Salon', 3, false);

-- Insertion des coûts des utilités
INSERT INTO public.property_utility_costs (property_id, utility_type, amount, frequency, is_included_in_rent, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'water', 15000, 'monthly', false, 'Consommation eau'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'electricity', 20000, 'monthly', false, 'Consommation électricité'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'water', 8000, 'monthly', true, 'Eau incluse'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'electricity', 12000, 'monthly', true, 'Électricité incluse'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'maintenance', 25000, 'monthly', false, 'Entretien jardin');

-- Insertion des favoris utilisateurs
INSERT INTO public.user_favorites (user_id, property_id) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Insertion des alertes propriétés
INSERT INTO public.property_alerts (
  user_id, title, criteria, is_active, notification_frequency,
  max_price, min_bedrooms, property_types, cities
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Recherche appartement Cocody',
  '{"city": "Abidjan", "neighborhood": "Cocody", "min_bedrooms": 2}',
  true,
  'immediate',
  300000,
  2,
  ARRAY['appartement'],
  ARRAY['Abidjan']
),
(
  '22222222-2222-2222-2222-222222222222',
  'Studio économique Abidjan',
  '{"city": "Abidjan", "max_price": 150000}',
  true,
  'daily',
  150000,
  1,
  ARRAY['studio', 'appartement'],
  ARRAY['Abidjan']
);

-- Insertion des mandats d'agence
INSERT INTO public.agency_mandates (
  property_id, agency_id, owner_id, mandate_number, mandate_type, status,
  start_date, end_date, commission_rate, signed_document_url
) VALUES
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  'MAND-001',
  'exclusive',
  'active',
  '2024-01-01',
  '2024-12-31',
  8.5,
  'https://example.com/documents/mandate1.pdf'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '66666666-6666-6666-6666-666666666666',
  '55555555-5555-5555-5555-555555555555',
  'MAND-002',
  'exclusive',
  'active',
  '2024-01-15',
  '2024-12-31',
  7.5,
  'https://example.com/documents/mandate2.pdf'
);

-- Insertion des applications de location
INSERT INTO public.rental_applications (
  property_id, applicant_id, status, cover_letter, proposed_rent, move_in_date,
  employment_info, background_check_status, created_at, updated_at
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'pending'::application_status,
  'Je suis très intéressé par cet appartement qui correspond parfaitement à mes besoins. Je suis cadre dans une entreprise et cherche un logement près de mon lieu de travail.',
  250000,
  '2024-02-01',
  '{"company": "Société ABC", "position": "Cadre", "monthly_income": 600000, "employment_type": "CDI"}',
  'pending',
  NOW(),
  NOW()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'approved'::application_status,
  'Étudiant sérieux à la recherche d''un studio fonctionnel pour mes études. Références disponibles sur demande.',
  120000,
  '2024-01-15',
  '{"university": "Université FHB", "field": "Informatique", "year": 3, "scholarship": 150000}',
  'completed',
  NOW(),
  NOW()
);

-- Insertion des baux de location
INSERT INTO public.leases (
  id, property_id, tenant_id, owner_id, lease_number, status,
  start_date, end_date, monthly_rent, deposit_amount, currency,
  payment_frequency, signed_document_url, created_at, updated_at
) VALUES
(
  '99999999-9999-9999-9999-999999999999',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444444',
  'LEASE-001',
  'active',
  '2024-01-15',
  '2025-01-14',
  120000,
  240000,
  'XOF',
  'monthly',
  'https://example.com/documents/lease1.pdf',
  NOW(),
  NOW()
);

-- Insertion des termes du bail
INSERT INTO public.lease_terms (lease_id, term_type, title, description) VALUES
(
  '99999999-9999-9999-9999-999999999999',
  'rental_terms',
  'Termes de location',
  'Le présent bail est conclu pour une durée de 12 mois. Le loyer est payable le 1er de chaque mois.'
),
(
  '99999999-9999-9999-9999-999999999999',
  'security_deposit',
  'Dépôt de garantie',
  'Un dépôt de garantie équivalent à 2 mois de loyer est requis. Il sera restitué dans les 30 jours suivant la fin du bail, sous réserve de dommages.'
);

-- Insertion des visites de propriétés
INSERT INTO public.property_visits (
  property_id, visitor_id, scheduled_date, status, notes
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  NOW() + INTERVAL '2 days',
  'scheduled',
  'Visite prévue à 10h00'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  NOW() + INTERVAL '3 days',
  'scheduled',
  'Visite avec agent immobilier'
);

-- Insertion des conversations et messages
INSERT INTO public.conversations (user1_id, user2_id, property_id, last_message_at) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444444',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  NOW()
);

INSERT INTO public.messages (sender_id, receiver_id, property_id, content, message_type) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Bonjour, je suis intéressé par votre appartement à Cocody. Est-il toujours disponible ?',
  'message'
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Bonjour, oui l''appartement est toujours disponible. Quand souhaitez-vous le visiter ?',
  'message'
);

-- Insertion des préférences de notifications
INSERT INTO public.notification_preferences (user_id, category, enabled, email_enabled, sms_enabled, push_enabled, frequency) VALUES
('11111111-1111-1111-1111-111111111111', 'recommendations', true, true, false, true, 'immediate'),
('11111111-1111-1111-1111-111111111111', 'messages', true, true, true, true, 'immediate'),
('11111111-1111-1111-1111-111111111111', 'visits', true, true, false, true, 'immediate'),
('22222222-2222-2222-2222-222222222222', 'recommendations', true, true, false, true, 'daily'),
('22222222-2222-2222-2222-222222222222', 'messages', true, true, true, true, 'immediate');

-- Insertion des vérifications utilisateurs
INSERT INTO public.user_verifications (user_id, oneci_status, cnam_status, face_status, tenant_score) VALUES
('11111111-1111-1111-1111-111111111111', 'verified'::verification_status, 'verified'::verification_status, 'verified'::verification_status, 85),
('22222222-2222-2222-2222-222222222222', 'verified'::verification_status, 'verified'::verification_status, 'pending'::verification_status, 78),
('44444444-4444-4444-4444-444444444444', 'verified'::verification_status, 'verified'::verification_status, 'verified'::verification_status, 92),
('55555555-5555-5555-5555-555555555555', 'verified'::verification_status, 'pending'::verification_status, 'not_attempted'::verification_status, 65);

-- Insertion des données analytiques
INSERT INTO public.property_analytics (property_id, view_date, total_views, unique_views) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE, 45, 23),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE, 67, 34),
('cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE, 23, 15),
('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE, 89, 42);

-- Insertion des avis
INSERT INTO public.reviews (reviewer_id, reviewee_id, property_id, rating, title, content, moderation_status) VALUES
(
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444444',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  5,
  'Excellente expérience',
  'Propriétaire très réactif et professionnel. Le studio correspond parfaitement à la description.',
  'approved'::character varying
);

-- Résumé des statistiques utilisateurs
INSERT INTO public.user_roles_summary (user_type, total_users, verified_users, unverified_users, created_this_month, last_30_days) VALUES
('locataire'::user_type, 3, 3, 0, 3, 3),
('proprietaire'::user_type, 2, 2, 0, 2, 2),
('agence'::user_type, 2, 2, 0, 2, 2),
('admin_ansut'::user_type, 1, 1, 0, 1, 1);

-- Configuration du traitement
INSERT INTO public.processing_config (key, value, description, category, is_active) VALUES
(
  'application_auto_approval_threshold',
  '{"score": 80, "required_verifications": ["oneci", "cnam"]}',
  'Seuil pour l''approbation automatique des applications',
  'applications',
  true
),
(
  'rental_price_ranges',
  '{"cocody": {"min": 150000, "max": 600000}, "plateau": {"min": 120000, "max": 400000}}',
  'Plages de prix par quartier',
  'pricing',
  true
);
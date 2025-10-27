-- Seed de test simple pour les propriétés publiques
-- Ce fichier crée des propriétés sans dépendance à l'authentification

-- Créer quelques propriétés de test sans avoir besoin d'utilisateurs authentifiés
INSERT INTO public.properties (
  id, title, description, property_type, city, neighborhood, address,
  monthly_rent, deposit_amount, surface_area, bedrooms, bathrooms, owner_id, status,
  is_furnished, has_ac, has_parking, has_garden, latitude, longitude,
  main_image, images, view_count, created_at, updated_at
) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Bel appartement 2 pieces a Cocody',
   'Magnifique appartement 2 pieces dans une residence securisee a Cocody. Proche des commerces et ecoles.',
   'Appartement', 'Abidjan', 'Cocody', 'Rue des Jardins, Cocody',
   150000, 300000, 65, 2, 1, '11111111-1111-1111-1111-111111111111', 'disponible',
   true, true, true, false, 5.3600, -3.9833,
   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'],
   45, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

  ('22222222-2222-2222-2222-222222222222',
   'Studio moderne Cocody Riviera',
   'Studio moderne et fonctionnel dans la zone riviera de Cocody. Ideal pour jeune professionnel.',
   'Studio', 'Abidjan', 'Cocody', 'Boulevard Riviera, Cocody',
   80000, 160000, 35, 0, 1, '22222222-2222-2222-2222-222222222222', 'disponible',
   false, true, false, false, 5.3650, -3.9800,
   'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'],
   32, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),

  ('33333333-3333-3333-3333-333333333333',
   'Villa 3 chambres avec piscine Yopougon',
   'Superbe villa avec piscine privee a Yopougon. Grande terrasse et jardin. Securise 24/7.',
   'Villa', 'Abidjan', 'Yopougon', 'Zone industrielle, Yopougon',
   250000, 500000, 180, 3, 2, '33333333-3333-3333-3333-333333333333', 'disponible',
   true, true, true, true, 5.3200, -4.0167,
   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
   78, NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days'),

  ('44444444-4444-4444-4444-444444444444',
   'Duplex 4 pieces Plateau',
   'Magnifique duplex avec vue sur le golfe. Proche des administrations et banques.',
   'Duplex', 'Abidjan', 'Plateau', 'Avenue Chardy, Plateau',
   350000, 700000, 120, 4, 2, '44444444-4444-4444-4444-444444444444', 'disponible',
   true, true, true, false, 5.3400, -4.0000,
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'],
   156, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),

  ('55555555-5555-5555-5555-555555555555',
   'Chambre student Marcory',
   'Chambre individuelle meublee ideale pour etudiant. Wifi inclus, proche universite.',
   'Chambre', 'Abidjan', 'Marcory', 'Rue du Commerce, Marcory',
   40000, 80000, 18, 0, 1, '55555555-5555-5555-5555-555555555555', 'disponible',
   true, false, false, false, 5.3000, -4.0000,
   'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop'],
   23, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

  ('66666666-6666-6666-6666-666666666666',
   'Appartement T3 Treichville',
   'Appartement 3 pieces spacieux avec balcon. Proche marche et transport en commun.',
   'Appartement', 'Abidjan', 'Treichville', 'Boulevard de Marseille, Treichville',
   120000, 240000, 85, 3, 1, '66666666-6666-6666-6666-666666666666', 'disponible',
   false, true, true, false, 5.2800, -4.0200,
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'],
   67, NOW() - INTERVAL '35 days', NOW() - INTERVAL '7 days'),

  ('77777777-7777-7777-7777-777777777777',
   'Villa de luxe Abobo',
   'Villa moderne avec jardin et piscine. Parfait pour famille. Quartier residentiel calme.',
   'Villa', 'Abidjan', 'Abobo', 'Zone residentielle, Abobo',
   200000, 400000, 150, 4, 3, '77777777-7777-7777-7777-777777777777', 'disponible',
   true, true, true, true, 5.3800, -4.0500,
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'],
   89, NOW() - INTERVAL '25 days', NOW() - INTERVAL '4 days'),

  ('88888888-8888-8888-8888-888888888888',
   'Studio meuble Attécoubé',
   'Studio fonctionnel meublé avec kitchenette. Idéal pour jeune actif.',
   'Studio', 'Abidjan', 'Attécoubé', 'Route d''Attécoubé',
   70000, 140000, 30, 0, 1, '88888888-8888-8888-8888-888888888888', 'disponible',
   true, true, false, false, 5.3500, -4.0300,
   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
   41, NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),

  ('99999999-9999-9999-9999-999999999999',
   'Appartement penthouse Cocody',
   'Penthouse de luxe avec terrasse panoramique. Vue imprenable sur la ville.',
   'Penthouse', 'Abidjan', 'Cocody', 'Iles, Cocody',
   500000, 1000000, 200, 5, 3, '99999999-9999-9999-9999-999999999999', 'disponible',
   true, true, true, false, 5.3700, -3.9700,
   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
   203, NOW() - INTERVAL '40 days', NOW() - INTERVAL '8 days'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Maison 3 chambres Koumassi',
   'Maison familiale avec cour et garage. Proche écoles et commerces.',
   'Maison', 'Abidjan', 'Koumassi', 'Quartier administratif, Koumassi',
   180000, 360000, 140, 3, 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'disponible',
   false, true, true, true, 5.2500, -4.0400,
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'],
   92, NOW() - INTERVAL '22 days', NOW() - INTERVAL '5 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Loft moderne Port-Bouët',
   'Loft industriel avec haute plafond. Espace ouvert lumineux et moderne.',
   'Loft', 'Abidjan', 'Port-Bouët', 'Zone portuaire, Port-Bouët',
   160000, 320000, 110, 2, 1, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'disponible',
   true, true, true, false, 5.2300, -4.0100,
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'],
   74, NOW() - INTERVAL '28 days', NOW() - INTERVAL '6 days'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Appartement F2 Yopougon',
   'Appartement 2 pieces rénové avec balcon. Quartier animé et accessible.',
   'Appartement', 'Abidjan', 'Yopougon', 'Andokoi, Yopougon',
   90000, 180000, 55, 2, 1, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'disponible',
   false, true, false, false, 5.3100, -4.0200,
   'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop'],
   58, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'Villa avec jardin Bingerville',
   'Villa spacieuse avec grand jardin. Idéal pour famille avec enfants.',
   'Villa', 'Bingerville', 'Centre-ville', 'Quartier résidentiel, Bingerville',
   220000, 440000, 160, 4, 2, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'disponible',
   true, true, true, true, 5.4500, -3.9000,
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'],
   81, NOW() - INTERVAL '38 days', NOW() - INTERVAL '9 days'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'Chambre meublée Adjamé',
   'Chambre individuelle dans colocation. Cuisine et salon partagés.',
   'Chambre', 'Abidjan', 'Adjamé', 'Marché d''Adjamé',
   35000, 70000, 20, 0, 1, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'disponible',
   true, false, false, false, 5.3400, -4.0300,
   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'],
   29, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff',
   'Appartement T4 Grand-Bassam',
   'Appartement 4 pieces en bord de mer. Vue sur l''océan Atlantique.',
   'Appartement', 'Grand-Bassam', 'Centre-ville', 'Boulevard Treich-Laplénie',
   280000, 560000, 130, 4, 2, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'disponible',
   true, true, true, false, 5.2000, -3.7500,
   'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'],
   145, NOW() - INTERVAL '33 days', NOW() - INTERVAL '7 days'),

  ('11111111-1111-1111-2222-111111111111',
   'Studio avec terrasse Marcory',
   'Studio lumineux avec terrasse privative. Quartier commercial dynamique.',
   'Studio', 'Abidjan', 'Marcory', 'Zone industrielle, Marcory',
   85000, 170000, 40, 0, 1, '11111111-1111-1111-2222-111111111111', 'disponible',
   true, true, false, false, 5.2900, -3.9900,
   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'],
   52, NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days'),

  ('22222222-2222-2222-3333-222222222222',
   'Maison de ville Anyama',
   'Maison de ville avec petit jardin. Ambiance villageoise proche d''Abidjan.',
   'Maison', 'Anyama', 'Centre-ville', 'Quartier résidentiel, Anyama',
   130000, 260000, 100, 3, 1, '22222222-2222-2222-3333-222222222222', 'disponible',
   false, true, true, true, 5.4800, -4.0500,
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'],
   63, NOW() - INTERVAL '27 days', NOW() - INTERVAL '5 days'),

  ('33333333-3333-3333-4444-333333333333',
   'Appartement meublé Songon',
   'Appartement meublé moderne. Tranquillité et nature à 30min d''Abidjan.',
   'Appartement', 'Songon', 'Centre-ville', 'Route de Songon',
   110000, 220000, 75, 2, 1, '33333333-3333-3333-4444-333333333333', 'disponible',
   true, true, true, false, 5.4200, -4.1200,
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'],
   71, NOW() - INTERVAL '19 days', NOW() - INTERVAL '4 days'),

  ('44444444-4444-4444-5555-444444444444',
   'Duplex avec piscine Jacqueville',
   'Duplux moderne avec piscine privée. Station balnéaire exclusive.',
   'Duplex', 'Jacqueville', 'Centre-ville', 'Zone touristique, Jacqueville',
   320000, 640000, 140, 3, 2, '44444444-4444-4444-5555-444444444444', 'disponible',
   true, true, true, true, 5.1800, -4.4500,
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'],
   98, NOW() - INTERVAL '42 days', NOW() - INTERVAL '10 days'),

  ('55555555-5555-5555-6666-555555555555',
   'Chambre d''hôtes Assinie',
   'Chambre d''hôtes de luxe avec accès plage. Service petit-déjeuner inclus.',
   'Chambre', 'Assinie', 'Centre-ville', 'Route d''Assinie',
   95000, 190000, 25, 0, 1, '55555555-5555-5555-6666-555555555555', 'disponible',
   true, true, false, false, 5.1500, -3.6500,
   'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'],
   87, NOW() - INTERVAL '24 days', NOW() - INTERVAL '6 days')
;

-- Ajouter des analytics pour chaque propriété
INSERT INTO public.property_analytics (property_id, view_date, total_views, unique_views)
SELECT
  id,
  CURRENT_DATE - INTERVAL '1 day',
  FLOOR(RANDOM() * 20 + 5)::integer,
  FLOOR(RANDOM() * 15 + 3)::integer
FROM public.properties
;

INSERT INTO public.property_analytics (property_id, view_date, total_views, unique_views)
SELECT
  id,
  CURRENT_DATE,
  FLOOR(RANDOM() * 10 + 2)::integer,
  FLOOR(RANDOM() * 8 + 1)::integer
FROM public.properties
;

DO $$
DECLARE
    prop_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO prop_count FROM public.properties;
    RAISE NOTICE '=== Seed de test cree avec succes ===';
    RAISE NOTICE 'Proprietes crees: %', prop_count;
END $$;
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
   78, NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days')
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
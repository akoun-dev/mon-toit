-- Replace Unsplash images with reliable Picsum images
-- Update all property_media with working house/apartment images

-- First, clear existing images
DELETE FROM public.property_media WHERE property_id IN (
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440104',
  '550e8400-e29b-41d4-a716-446655440105'
);

-- Insert reliable house/apartment images
INSERT INTO public.property_media (
  id,
  property_id,
  media_type,
  url,
  title,
  description,
  order_index,
  is_primary,
  metadata,
  created_at
) VALUES
-- Résidence Admin - Cocody (Appartement de luxe)
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://picsum.photos/seed/luxury-apartment-cocody-1/800/600.jpg', 'Façade principale', 'Magnifique appartement en plein cœur de Cocody', 1, true, '{"room_type": "exterior", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://picsum.photos/seed/luxury-apartment-cocody-2/800/600.jpg', 'Salon moderne', 'Spacieux salon avec vue sur la ville', 2, false, '{"room_type": "living_room", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://picsum.photos/seed/luxury-apartment-cocody-3/800/600.jpg', 'Cuisine équipée', 'Cuisine moderne entièrement équipée', 3, false, '{"room_type": "kitchen", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://picsum.photos/seed/luxury-apartment-cocody-4/800/600.jpg', 'Chambre principale', 'Grande chambre avec dressing', 4, false, '{"room_type": "bedroom", "verified": true}', NOW()),

-- Bureau Admin - Plateau (Bureau moderne)
  ('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440102', 'image', 'https://picsum.photos/seed/modern-office-plateau-1/800/600.jpg', 'Bureau principal', 'Bureau spacieux et lumineux au Plateau', 1, true, '{"room_type": "office", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440102', 'image', 'https://picsum.photos/seed/modern-office-plateau-2/800/600.jpg', 'Salle de réunion', 'Salle de réunion moderne', 2, false, '{"room_type": "meeting_room", "verified": true}', NOW()),

-- Appartement F3 Cocody (Appartement familial)
  ('550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://picsum.photos/seed/family-apartment-cocody-1/800/600.jpg', 'Balcon', 'Grand balcon avec vue sur Cocody', 1, true, '{"room_type": "balcony", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://picsum.photos/seed/family-apartment-cocody-2/800/600.jpg', 'Chambre 1', 'Première chambre avec rangements', 2, false, '{"room_type": "bedroom", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440309', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://picsum.photos/seed/family-apartment-cocody-3/800/600.jpg', 'Cuisine', 'Cuisine fonctionnelle et moderne', 3, false, '{"room_type": "kitchen", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://picsum.photos/seed/family-apartment-cocody-4/800/600.jpg', 'Séjour', 'Séjour lumineux et accueillant', 4, false, '{"room_type": "living_room", "verified": true}', NOW()),

-- Studio Yopougon (Studio compact)
  ('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440104', 'image', 'https://picsum.photos/seed/cozy-studio-yopougon-1/800/600.jpg', 'Studio complet', 'Studio optimisé et fonctionnel à Yopougon', 1, true, '{"room_type": "studio", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440104', 'image', 'https://picsum.photos/seed/cozy-studio-yopougon-2/800/600.jpg', 'Coin cuisine', 'Kitchenette intégrée', 2, false, '{"room_type": "kitchenette", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440104', 'image', 'https://picsum.photos/seed/cozy-studio-yopougon-3/800/600.jpg', 'Salle de bain', 'Salle de bain moderne', 3, false, '{"room_type": "bathroom", "verified": true}', NOW()),

-- Bureau Plateau (Espace commercial)
  ('550e8400-e29b-41d4-a716-446655440314', '550e8400-e29b-41d4-a716-446655440105', 'image', 'https://picsum.photos/seed/commercial-office-plateau-1/800/600.jpg', 'Entrée principale', 'Bureau professionnel au Plateau', 1, true, '{"room_type": "entrance", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440315', '550e8400-e29b-41d4-a716-446655440105', 'image', 'https://picsum.photos/seed/commercial-office-plateau-2/800/600.jpg', 'Espace de travail', 'Open space lumineux', 2, false, '{"room_type": "workspace", "verified": true}', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT
  p.title as property_title,
  COUNT(pm.id) as image_count,
  STRING_AGG(pm.title, ', ' ORDER BY pm.order_index) as images
FROM properties p
LEFT JOIN property_media pm ON p.id = pm.property_id
GROUP BY p.id, p.title
ORDER BY p.id;
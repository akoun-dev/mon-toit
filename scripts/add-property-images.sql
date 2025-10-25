-- Add house images for all properties
-- This script adds realistic house/apartment images for each property

-- Insert house images for each property
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
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format', 'Façade principale', ' magnifique appartement en plein cœur de Cocody', 1, true, '{"room_type": "exterior", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://images.unsplash.com/photo-1600566753376-12c8ac7c11e1?w=800&h=600&fit=crop&auto=format', 'Salon moderne', 'Spacieux salon avec vue sur la ville', 2, false, '{"room_type": "living_room", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format', 'Cuisine équipée', 'Cuisine moderne entièrement équipée', 3, false, '{"room_type": "kitchen", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440101', 'image', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop&auto=format', 'Chambre principale', 'Grande chambre avec dressing', 4, false, '{"room_type": "bedroom", "verified": true}', NOW()),

-- Bureau Admin - Plateau (Bureau moderne)
  ('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440102', 'image', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format', 'Bureau principal', 'Bureau spacieux et lumineux au Plateau', 1, true, '{"room_type": "office", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440102', 'image', 'https://images.unsplash.com/photo-1604079628040-9f02bd3b2d95?w=800&h=600&fit=crop&auto=format', 'Salle de réunion', 'Salle de réunion moderne', 2, false, '{"room_type": "meeting_room", "verified": true}', NOW()),

-- Appartement F3 Cocody (Appartement familial)
  ('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://images.unsplash.com/photo-1600566753086-00a18a5e8339?w=800&h=600&fit=crop&auto=format', 'Balcon', 'Grand balcon avec vue sur Cocody', 1, true, '{"room_type": "balcony", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop&auto=format', 'Chambre 1', 'Première chambre avec rangements', 2, false, '{"room_type": "bedroom", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format', 'Cuisine', 'Cuisine fonctionnelle et moderne', 3, false, '{"room_type": "kitchen", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440210', '550e8400-e29b-41d4-a716-446655440103', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format', 'Séjour', 'Séjour lumineux et accueillant', 4, false, '{"room_type": "living_room", "verified": true}', NOW()),

-- Studio Yopougon (Studio compact)
  ('550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440104', 'image', 'https://images.unsplash.com/photo-1613551267766-9b6930b76a20?w=800&h=600&fit=crop&auto=format', 'Studio complet', 'Studio optimisé et fonctionnel à Yopougon', 1, true, '{"room_type": "studio", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440212', '550e8400-e29b-41d4-a716-446655440104', 'image', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop&auto=format', 'Coin cuisine', 'Kitchenette intégrée', 2, false, '{"room_type": "kitchenette", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440213', '550e8400-e29b-41d4-a716-446655440104', 'image', 'https://images.unsplash.com/photo-1618221195728-2a5a35c8c7dc?w=800&h=600&fit=crop&auto=format', 'Salle de bain', 'Salle de bain moderne', 3, false, '{"room_type": "bathroom", "verified": true}', NOW()),

-- Bureau Plateau (Espace commercial)
  ('550e8400-e29b-41d4-a716-446655440214', '550e8400-e29b-41d4-a716-446655440105', 'image', 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&h=600&fit=crop&auto=format', 'Entrée principale', 'Bureau professionnel au Plateau', 1, true, '{"room_type": "entrance", "verified": true}', NOW()),
  ('550e8400-e29b-41d4-a716-446655440215', '550e8400-e29b-41d4-a716-446655440105', 'image', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format', 'Espace de travail', 'Open space lumineux', 2, false, '{"room_type": "workspace", "verified": true}', NOW())
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
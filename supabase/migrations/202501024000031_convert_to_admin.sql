-- Migration: Convert User to Admin
-- Description: Convert existing user to admin_ansut type

UPDATE public.profiles
SET
  user_type = 'admin_ansut',
  is_verified = true,
  oneci_verified = true,
  cnam_verified = true,
  face_verified = true,
  full_name = 'Administrateur Principal',
  phone = '+225 01 23 45 67 89',
  city = 'Abidjan, Cocody',
  ui_density = 'comfortable',
  updated_at = NOW()
WHERE id = 'b9789e9f-d55b-42c4-b8c1-f5d89c8bab30';

-- Update or create user active role
INSERT INTO public.user_active_roles (user_id, active_role, available_roles, created_at, updated_at)
VALUES (
  'b9789e9f-d55b-42c4-b8c1-f5d89c8bab30',
  'admin_ansut'::user_type,
  ARRAY['admin_ansut'::user_type, 'proprietaire'::user_type, 'locataire'::user_type, 'agence'::user_type, 'tiers_de_confiance'::user_type],
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  active_role = 'admin_ansut',
  available_roles = ARRAY['admin_ansut'::user_type, 'proprietaire'::user_type, 'locataire'::user_type, 'agence'::user_type, 'tiers_de_confiance'::user_type],
  updated_at = NOW();

-- Create user preferences if not exists
INSERT INTO public.user_preferences (user_id, theme, language, notifications_enabled, email_notifications, push_notifications, property_alerts)
VALUES (
  'b9789e9f-d55b-42c4-b8c1-f5d89c8bab30',
  'dark',
  'fr',
  true,
  true,
  true,
  true
)
ON CONFLICT (user_id) DO NOTHING;
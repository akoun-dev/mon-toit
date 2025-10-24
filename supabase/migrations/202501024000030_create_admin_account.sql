-- Migration: Create Admin Account
-- Description: Convert existing account to admin type

DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Find the user ID for admin-real@mon-toit.ci
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'admin-real@mon-toit.ci'
  LIMIT 1;

  IF user_id IS NOT NULL THEN
    -- Update or insert the profile with admin type
    INSERT INTO public.profiles (
      id, full_name, phone, avatar_url, bio, city, user_type,
      is_verified, oneci_verified, cnam_verified, face_verified,
      ui_density, created_at, updated_at
    ) VALUES (
      user_id,
      'Administrateur Principal',
      '+225 01 23 45 67 89',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'Administrateur principal du système Mon Toit. Accès complet à toutes les fonctionnalités.',
      'Abidjan, Cocody',
      'admin_ansut'::user_type,
      true,  -- is_verified
      true,  -- oneci_verified
      true,  -- cnam_verified
      true,  -- face_verified
      'comfortable',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      user_type = 'admin_ansut',
      full_name = 'Administrateur Principal',
      is_verified = true,
      oneci_verified = true,
      cnam_verified = true,
      face_verified = true,
      updated_at = NOW();

    -- Create user active role entry
    INSERT INTO public.user_active_roles (
      user_id, active_role, available_roles, created_at, updated_at
    ) VALUES (
      user_id,
      'admin_ansut'::user_type,
      ARRAY['admin_ansut'::user_type, 'proprietaire'::user_type, 'locataire'::user_type, 'agence'::user_type, 'tiers_de_confiance'::user_type],
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      active_role = 'admin_ansut',
      available_roles = ARRAY['admin_ansut'::user_type, 'proprietaire'::user_type, 'locataire'::user_type, 'agence'::user_type, 'tiers_de_confiance'::user_type],
      updated_at = NOW();

    -- Create user preferences
    INSERT INTO public.user_preferences (
      user_id, theme, language, notifications_enabled, email_notifications, push_notifications, property_alerts
    ) VALUES (
      user_id, 'dark', 'fr', true, true, true, true
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE '✓ Compte admin créé avec succès: admin-real@mon-toit.ci';
  ELSE
    RAISE NOTICE '⚠ Utilisateur admin-real@mon-toit.ci non trouvé';
  END IF;
END $$;

-- Create admin notifications
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Find the user ID for admin-real@mon-toit.ci
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'admin-real@mon-toit.ci'
  LIMIT 1;

  IF user_id IS NOT NULL THEN
    INSERT INTO public.notifications (id, user_id, title, message, type, read, metadata, created_at) VALUES
    (gen_random_uuid(), user_id, 'Bienvenue Administrateur', 'Votre compte administrateur a été configuré avec succès. Vous avez accès à toutes les fonctionnalités du système.', 'info', false, '{"priority": "high"}'::jsonb, NOW()),
    (gen_random_uuid(), user_id, 'Accès complet', 'En tant qu''administrateur, vous pouvez gérer les utilisateurs, les propriétés et les paramètres du système.', 'success', false, '{"priority": "medium"}'::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✓ Notifications admin créées';
  END IF;
END $$;
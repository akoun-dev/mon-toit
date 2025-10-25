-- Migration: Convert User to Admin (Fixed)
-- Description: Convert existing user to admin type with robust error handling

DO $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- Find the admin user we created
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'admin@mon-toit.ci'
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RAISE NOTICE '⚠ Admin user admin@mon-toit.ci not found, skipping conversion';
    RETURN;
  END IF;

  -- Update profile if it exists
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
  WHERE id = v_admin_user_id;

  -- Update or create user active role
  INSERT INTO public.user_active_roles (user_id, active_role, available_roles, created_at, updated_at)
  VALUES (
    v_admin_user_id,
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
    v_admin_user_id,
    'dark',
    'fr',
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✓ Admin user converted successfully: %', v_admin_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Error converting admin user: %', SQLERRM;
END $$;
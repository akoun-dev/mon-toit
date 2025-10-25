-- Create a proper admin user with working password
-- This script creates an admin user that can actually authenticate

DO $$
DECLARE
  admin_user_id UUID := '550e8400-e29b-41d4-a716-446655440001';
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM public.profiles WHERE id = admin_user_id;
  DELETE FROM auth.users WHERE id = admin_user_id;

  -- Create auth user with proper password hash for 'admin123!@#'
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    phone,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    admin_user_id,
    'admin@mon-toit.ci',
    crypt('admin123!@#', gen_salt('bf', 12)),
    NOW(),
    '+225 01 23 45 67 89',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  -- Create profile with admin role
  INSERT INTO public.profiles (
    id,
    full_name,
    user_type,
    is_verified,
    oneci_verified,
    cnam_verified,
    face_verified,
    phone,
    city,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Administrateur Principal',
    'admin_ansut',
    true,
    true,
    true,
    true,
    '+225 01 23 45 67 89',
    'Abidjan, Cocody',
    NOW(),
    NOW()
  );

  -- Set up user roles
  INSERT INTO public.user_active_roles (
    user_id,
    active_role,
    available_roles,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'admin_ansut',
    ARRAY['admin_ansut', 'proprietaire', 'locataire', 'agence', 'tiers_de_confiance'],
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    active_role = 'admin_ansut',
    available_roles = ARRAY['admin_ansut', 'proprietaire', 'locataire', 'agence', 'tiers_de_confiance'],
    updated_at = NOW();

  -- Create user preferences
  INSERT INTO public.user_preferences (
    user_id,
    theme,
    language,
    notifications_enabled,
    email_notifications,
    push_notifications,
    property_alerts
  ) VALUES (
    admin_user_id,
    'dark',
    'fr',
    true,
    true,
    true,
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✓ Admin user created successfully: admin@mon-toit.ci / admin123!@#';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Error creating admin user: %', SQLERRM;
END $$;
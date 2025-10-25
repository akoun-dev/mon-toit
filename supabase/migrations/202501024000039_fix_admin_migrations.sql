-- Migration: Fix Admin Migrations
-- Description: Fix migrations that reference non-existent users

-- First, let's update the migration to be more robust
-- Instead of hardcoding user IDs, we'll find existing users or create them

DO $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- Find an existing admin user or use the test admin
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'testadmin@mon-toit.ci'
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RAISE NOTICE '⚠ No admin user found, skipping admin role setup';
  ELSE
    -- Update or create user active role for the found admin
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

    RAISE NOTICE '✓ Admin roles configured for user: %', v_admin_user_id;
  END IF;
END $$;

-- Update all existing admin profiles to ensure they have proper roles
UPDATE public.profiles
SET user_type = 'admin_ansut',
    is_verified = true,
    oneci_verified = true,
    cnam_verified = true,
    face_verified = true
WHERE user_type = 'admin_ansut';

-- Create user preferences for any admin users that don't have them
INSERT INTO public.user_preferences (user_id, theme, language, notifications_enabled, email_notifications, push_notifications, property_alerts)
SELECT
  p.id,
  'dark',
  'fr',
  true,
  true,
  true,
  true
FROM public.profiles p
WHERE p.user_type = 'admin_ansut'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_preferences up WHERE up.user_id = p.id
  );

-- Grant necessary permissions for admin operations
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure RLS is properly configured
DO $$
DECLARE
  v_table_name TEXT;
BEGIN
  FOR v_table_name IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'user_active_roles', 'user_preferences', 'properties', 'rental_applications', 'user_favorites', 'digital_certificates', 'electronic_signature_logs')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
  END LOOP;
END $$;
-- ========================================
-- Phase 9: Suppression de 'admin_ansut' de l'enum user_type
-- ========================================

-- ========================================
-- 1. SAFETY CHECK
-- ========================================
DO $$
DECLARE
  admin_ansut_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_ansut_count FROM public.profiles WHERE user_type = 'admin_ansut';
  IF admin_ansut_count > 0 THEN
    RAISE EXCEPTION 'Migration annulée: % utilisateur(s) ont encore user_type = admin_ansut', admin_ansut_count;
  END IF;
  
  SELECT COUNT(*) INTO admin_ansut_count FROM public.user_active_roles WHERE current_role = 'admin_ansut';
  IF admin_ansut_count > 0 THEN
    RAISE EXCEPTION 'Migration annulée: % utilisateur(s) ont encore current_role = admin_ansut', admin_ansut_count;
  END IF;
  
  SELECT COUNT(*) INTO admin_ansut_count FROM public.user_active_roles WHERE 'admin_ansut' = ANY(available_roles);
  IF admin_ansut_count > 0 THEN
    RAISE EXCEPTION 'Migration annulée: % utilisateur(s) ont encore admin_ansut dans available_roles', admin_ansut_count;
  END IF;
  
  RAISE NOTICE 'Safety check passed ✓';
END $$;

-- ========================================
-- 2. SUPPRIMER LA VUE profiles_public
-- ========================================
DROP VIEW IF EXISTS public.profiles_public CASCADE;

-- ========================================
-- 3. CRÉER LE NOUVEL ENUM
-- ========================================
CREATE TYPE public.user_type_new AS ENUM ('locataire', 'proprietaire', 'agence');

-- ========================================
-- 4. MIGRER profiles.user_type
-- ========================================
ALTER TABLE public.profiles ALTER COLUMN user_type DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN user_type TYPE public.user_type_new
  USING user_type::text::public.user_type_new;

ALTER TABLE public.profiles ALTER COLUMN user_type SET DEFAULT 'locataire'::public.user_type_new;

-- ========================================
-- 5. MIGRER user_active_roles
-- ========================================
ALTER TABLE public.user_active_roles ALTER COLUMN "current_role" DROP DEFAULT;
ALTER TABLE public.user_active_roles ALTER COLUMN "available_roles" DROP DEFAULT;

ALTER TABLE public.user_active_roles
  ALTER COLUMN "current_role" TYPE public.user_type_new
  USING "current_role"::text::public.user_type_new;

ALTER TABLE public.user_active_roles
  ALTER COLUMN "available_roles" TYPE public.user_type_new[]
  USING "available_roles"::text[]::public.user_type_new[];

ALTER TABLE public.user_active_roles ALTER COLUMN "current_role" SET DEFAULT 'locataire'::public.user_type_new;
ALTER TABLE public.user_active_roles ALTER COLUMN "available_roles" SET DEFAULT ARRAY['locataire'::public.user_type_new];

-- ========================================
-- 6. SUPPRIMER L'ANCIEN ENUM
-- ========================================
DROP TYPE public.user_type CASCADE;

-- ========================================
-- 7. RENOMMER LE NOUVEL ENUM
-- ========================================
ALTER TYPE public.user_type_new RENAME TO user_type;

-- ========================================
-- 8. RECRÉER LA VUE profiles_public
-- ========================================
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  user_type,
  city,
  bio,
  avatar_url,
  oneci_verified,
  cnam_verified,
  face_verified,
  is_verified,
  created_at,
  updated_at
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS 'Vue publique des profils utilisateurs MZAKA (locataire/proprietaire/agence)';

-- ========================================
-- 9. VALIDATION
-- ========================================
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel::text, ', ' ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_type');
  
  RAISE NOTICE '✓ Migration réussie';
  RAISE NOTICE '✓ Enum user_type: %', enum_values;
  RAISE NOTICE '✓ Vue profiles_public recréée';
  RAISE NOTICE '✓ Les admins utilisent user_roles (app_role = admin/super_admin)';
END $$;
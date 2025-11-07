-- ========================================
-- Phase 9: Suppression de 'admin_ansut' de l'enum user_type
-- ========================================
-- Description: Nettoie l'enum user_type pour ne garder que les 3 types d'utilisateurs
-- Impact: profiles, user_active_roles, profiles_public (vue) et 5 fonctions
-- Sécurité: Vérifie qu'aucun utilisateur n'utilise 'admin_ansut' avant de procéder

-- ========================================
-- 1. SAFETY CHECK: Vérifier qu'aucun utilisateur n'utilise 'admin_ansut'
-- ========================================
DO $$
DECLARE
  admin_ansut_count INTEGER;
BEGIN
  -- Vérifier dans profiles (comparaison textuelle)
  SELECT COUNT(*) INTO admin_ansut_count
  FROM public.profiles
  WHERE user_type::text = 'admin_ansut';
  
  IF admin_ansut_count > 0 THEN
    RAISE EXCEPTION 'Migration annulée: % utilisateur(s) ont encore user_type = admin_ansut. Veuillez les migrer vers le système de rôles d''abord.', admin_ansut_count;
  END IF;
  
  -- Vérifier dans user_active_roles (current_role - comparaison textuelle)
  SELECT COUNT(*) INTO admin_ansut_count
  FROM public.user_active_roles
  WHERE "current_role"::text = 'admin_ansut';
  
  IF admin_ansut_count > 0 THEN
    RAISE EXCEPTION 'Migration annulée: % utilisateur(s) ont encore current_role = admin_ansut dans user_active_roles.', admin_ansut_count;
  END IF;
  
  -- Vérifier dans user_active_roles (available_roles array)
  SELECT COUNT(*) INTO admin_ansut_count
  FROM public.user_active_roles
  WHERE 'admin_ansut' = ANY("available_roles"::text[]);
  
  IF admin_ansut_count > 0 THEN
    RAISE EXCEPTION 'Migration annulée: % utilisateur(s) ont encore admin_ansut dans available_roles.', admin_ansut_count;
  END IF;
  
  RAISE NOTICE 'Safety check passed: Aucun utilisateur n''utilise admin_ansut ✓';
END $$;

-- ========================================
-- 2. SUPPRIMER LA VUE profiles_public temporairement
-- ========================================
DROP VIEW IF EXISTS public.profiles_public;

-- ========================================
-- 3. CRÉER LE NOUVEL ENUM sans 'admin_ansut'
-- ========================================
CREATE TYPE public.user_type_new AS ENUM (
  'locataire',
  'proprietaire',
  'agence'
);

COMMENT ON TYPE public.user_type_new IS 'Types d''utilisateurs MZAKA (sans admin_ansut - les admins utilisent user_roles)';

-- ========================================
-- 4. MIGRER LA TABLE profiles
-- ========================================
ALTER TABLE public.profiles ALTER COLUMN user_type DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN user_type TYPE public.user_type_new USING user_type::text::public.user_type_new;
ALTER TABLE public.profiles ALTER COLUMN user_type SET DEFAULT 'locataire'::public.user_type_new;

COMMENT ON COLUMN public.profiles.user_type IS 'Type d''utilisateur MZAKA (locataire/proprietaire/agence). Les admins utilisent la table user_roles.';

-- ========================================
-- 5. MIGRER LA TABLE user_active_roles
-- ========================================
ALTER TABLE public.user_active_roles ALTER COLUMN "current_role" DROP DEFAULT;
ALTER TABLE public.user_active_roles ALTER COLUMN "available_roles" DROP DEFAULT;

ALTER TABLE public.user_active_roles ALTER COLUMN "current_role" TYPE public.user_type_new USING "current_role"::text::public.user_type_new;
ALTER TABLE public.user_active_roles ALTER COLUMN "available_roles" TYPE public.user_type_new[] USING "available_roles"::text[]::public.user_type_new[];

ALTER TABLE public.user_active_roles ALTER COLUMN "current_role" SET DEFAULT 'locataire'::public.user_type_new;
ALTER TABLE public.user_active_roles ALTER COLUMN "available_roles" SET DEFAULT ARRAY['locataire'::public.user_type_new];

COMMENT ON COLUMN public.user_active_roles."current_role" IS 'Rôle actif de l''utilisateur (locataire/proprietaire/agence)';
COMMENT ON COLUMN public.user_active_roles."available_roles" IS 'Rôles disponibles pour l''utilisateur (locataire/proprietaire/agence)';

-- ========================================
-- 6. SUPPRIMER L'ANCIEN ENUM (CASCADE supprime les fonctions dépendantes)
-- ========================================
DROP TYPE public.user_type CASCADE;

-- ========================================
-- 7. RENOMMER LE NOUVEL ENUM
-- ========================================
ALTER TYPE public.user_type_new RENAME TO user_type;

-- ========================================
-- 8. RECRÉER LES FONCTIONS avec le nouveau type
-- ========================================

-- Fonction: add_available_role
CREATE OR REPLACE FUNCTION public.add_available_role(p_user_id uuid, p_new_role user_type)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() != p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.user_active_roles
  SET available_roles = array_append(available_roles, p_new_role), updated_at = now()
  WHERE user_id = p_user_id AND NOT (p_new_role = ANY(available_roles));
  INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, notes)
  VALUES (auth.uid(), 'role_added', 'user', p_user_id, 'Ajout du rôle : ' || p_new_role::text);
END;
$function$;

-- Fonction: get_public_profile
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
 RETURNS TABLE(id uuid, full_name text, user_type user_type, city text, bio text, avatar_url text, oneci_verified boolean, cnam_verified boolean, face_verified boolean, is_verified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name, p.user_type, p.city, p.bio, p.avatar_url,
    p.oneci_verified, p.cnam_verified, p.face_verified, p.is_verified
  FROM public.profiles p WHERE p.id = target_user_id;
$function$;

-- Fonction: get_public_profile_safe
CREATE OR REPLACE FUNCTION public.get_public_profile_safe(target_user_id uuid)
 RETURNS TABLE(id uuid, full_name text, user_type user_type, city text, bio text, avatar_url text, oneci_verified boolean, cnam_verified boolean, face_verified boolean, is_verified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, p.full_name, p.user_type, p.city, p.bio, p.avatar_url,
    p.oneci_verified, p.cnam_verified, p.face_verified, p.is_verified
  FROM public.profiles p
  WHERE p.id = target_user_id AND auth.uid() IS NOT NULL;
$function$;

-- Fonction: get_verifications_for_review
CREATE OR REPLACE FUNCTION public.get_verifications_for_review()
 RETURNS TABLE(user_id uuid, full_name text, user_type user_type, city text, oneci_status text, cnam_status text, oneci_verified_at timestamp with time zone, cnam_verified_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_trusted_third_party(auth.uid()) THEN
    RAISE EXCEPTION 'Only active trusted third parties can access verification queue';
  END IF;
  
  INSERT INTO public.admin_audit_logs (
    admin_id, action_type, target_type, target_id, notes
  ) VALUES (
    auth.uid(), 'verification_queue_accessed', 'user_verification', auth.uid(),
    'Trusted third party accessed verification review queue'
  );
  
  RETURN QUERY
  SELECT 
    uv.user_id, p.full_name, p.user_type, p.city,
    uv.oneci_status, uv.cnam_status,
    uv.oneci_verified_at, uv.cnam_verified_at,
    uv.created_at, uv.updated_at
  FROM public.user_verifications uv
  JOIN public.profiles p ON p.id = uv.user_id
  WHERE uv.oneci_status = 'pending_review' OR uv.cnam_status = 'pending_review';
END;
$function$;

-- ========================================
-- 9. RECRÉER LA VUE profiles_public
-- ========================================
CREATE VIEW public.profiles_public AS
SELECT 
  id, full_name, user_type, city, bio, avatar_url,
  oneci_verified, cnam_verified, face_verified, is_verified,
  created_at, updated_at
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS 'Vue publique des profils utilisateurs (données non sensibles uniquement)';
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- ========================================
-- 10. RECRÉER LA FONCTION get_property_owner_public_info (dépend de profiles_public)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_property_owner_public_info(property_id_param uuid)
 RETURNS TABLE(id uuid, full_name text, user_type user_type, city text, avatar_url text, is_verified boolean, oneci_verified boolean, face_verified boolean, cnam_verified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    pp.id, pp.full_name, pp.user_type, pp.city, pp.avatar_url,
    pp.is_verified, pp.oneci_verified, pp.face_verified, pp.cnam_verified
  FROM public.profiles_public pp
  INNER JOIN public.properties p ON p.owner_id = pp.id
  WHERE p.id = property_id_param AND p.moderation_status = 'approved';
$function$;

-- ========================================
-- 11. VALIDATION FINALE
-- ========================================
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel::text, ', ' ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_type');
  
  RAISE NOTICE 'Migration réussie ✓';
  RAISE NOTICE 'Valeurs de l''enum user_type: %', enum_values;
  RAISE NOTICE 'Les admins utilisent maintenant exclusivement la table user_roles avec app_role = admin';
  RAISE NOTICE 'Vue profiles_public recréée avec succès';
  RAISE NOTICE '5 fonctions recréées avec le nouveau type user_type';
END $$;
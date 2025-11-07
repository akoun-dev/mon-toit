-- ========================================
-- Correction sécurité : Ajouter search_path aux fonctions
-- ========================================
-- Description: Ajoute SET search_path TO 'public' aux 3 fonctions qui en manquent
-- Impact: get_public_profile, get_public_profile_safe, get_property_owner_public_info
-- Sécurité: Prévient les attaques de type search_path hijacking

-- ========================================
-- 1. Fonction: get_public_profile (ajouter search_path)
-- ========================================
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

-- ========================================
-- 2. Fonction: get_public_profile_safe (ajouter search_path)
-- ========================================
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

-- ========================================
-- 3. Fonction: get_property_owner_public_info (ajouter search_path)
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
-- 4. VALIDATION
-- ========================================
DO $$
BEGIN
  RAISE NOTICE 'Sécurité renforcée : search_path ajouté aux 3 fonctions ✓';
  RAISE NOTICE 'get_public_profile: SET search_path TO ''public''';
  RAISE NOTICE 'get_public_profile_safe: SET search_path TO ''public''';
  RAISE NOTICE 'get_property_owner_public_info: SET search_path TO ''public''';
END $$;
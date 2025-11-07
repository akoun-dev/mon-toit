
-- Supprimer les anciennes fonctions pour pouvoir les recréer avec les nouveaux types
DROP FUNCTION IF EXISTS public.get_verifications_for_review();
DROP FUNCTION IF EXISTS public.get_pending_verifications_list();
DROP FUNCTION IF EXISTS public.get_verification_details(uuid);
DROP FUNCTION IF EXISTS public.reject_verification(uuid, text, text);

-- Corriger la fonction init_user_verifications pour utiliser les bonnes colonnes
CREATE OR REPLACE FUNCTION public.init_user_verifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insérer une ligne par défaut dans user_verifications avec les bonnes colonnes
  INSERT INTO public.user_verifications (user_id, cnib_status, cnam_status)
  VALUES (NEW.id, 'pending', 'pending')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recréer toutes les fonctions avec les bons noms de colonnes

-- 1. Fonction get_verifications_for_review
CREATE OR REPLACE FUNCTION public.get_verifications_for_review()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  user_type user_type,
  city text,
  cnib_status text,
  cnam_status text,
  cnib_verified_at timestamp with time zone,
  cnam_verified_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    uv.cnib_status, uv.cnam_status,
    uv.cnib_verified_at, uv.cnam_verified_at,
    uv.created_at, uv.updated_at
  FROM public.user_verifications uv
  JOIN public.profiles p ON p.id = uv.user_id
  WHERE uv.cnib_status = 'pending_review' OR uv.cnam_status = 'pending_review';
END;
$$;

-- 2. Fonction get_pending_verifications_list
CREATE OR REPLACE FUNCTION public.get_pending_verifications_list()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone,
  cnib_status text,
  cnam_status text,
  cnib_number text,
  cnam_employer text,
  has_pending boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can view pending verifications';
  END IF;

  INSERT INTO public.admin_audit_logs (
    admin_id, action_type, target_type, target_id, notes
  ) VALUES (
    auth.uid(), 'pending_verifications_list_viewed', 'user_verification', auth.uid(),
    'Admin viewed pending verifications list'
  );

  RETURN QUERY
  SELECT 
    uv.user_id,
    p.full_name,
    au.email,
    p.avatar_url,
    uv.created_at,
    uv.cnib_status,
    uv.cnam_status,
    uv.cnib_number,
    uv.cnam_employer,
    (uv.cnib_status = 'pending_review' OR uv.cnam_status = 'pending_review') as has_pending
  FROM public.user_verifications uv
  JOIN public.profiles p ON p.id = uv.user_id
  LEFT JOIN auth.users au ON au.id = uv.user_id
  WHERE uv.cnib_status = 'pending_review' 
     OR uv.cnam_status = 'pending_review'
  ORDER BY uv.created_at ASC;
END;
$$;

-- 3. Fonction get_verification_details
CREATE OR REPLACE FUNCTION public.get_verification_details(p_user_id uuid)
RETURNS TABLE(user_id uuid, cnib_data jsonb, cnam_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can view verification details';
  END IF;

  IF NOT public.admin_has_2fa_enabled(auth.uid()) THEN
    RAISE EXCEPTION 'Two-factor authentication required to access sensitive verification data';
  END IF;

  INSERT INTO public.admin_audit_logs (
    admin_id, action_type, target_type, target_id, notes
  ) VALUES (
    auth.uid(), 'verification_details_accessed', 'user_verification', p_user_id,
    'Admin accessed sensitive verification data'
  );

  RETURN QUERY
  SELECT 
    uv.user_id,
    uv.cnib_data,
    uv.cnam_data
  FROM public.user_verifications uv
  WHERE uv.user_id = p_user_id;
END;
$$;

-- 4. Fonction reject_verification
CREATE OR REPLACE FUNCTION public.reject_verification(
  p_user_id uuid,
  p_verification_type text,
  p_review_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT require_admin_mfa() THEN
    RAISE EXCEPTION 'MFA enforcement failed';
  END IF;

  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent rejeter des vérifications';
  END IF;

  IF p_review_notes IS NULL OR p_review_notes = '' THEN
    RAISE EXCEPTION 'Les notes de rejet sont obligatoires';
  END IF;

  -- Utiliser cnib au lieu de oneci
  IF p_verification_type = 'cnib' OR p_verification_type = 'oneci' THEN
    UPDATE user_verifications 
    SET 
      cnib_status = 'rejected',
      admin_reviewed_by = auth.uid(),
      admin_review_notes = p_review_notes,
      admin_reviewed_at = now(),
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF p_verification_type = 'cnam' THEN
    UPDATE user_verifications 
    SET 
      cnam_status = 'rejected',
      admin_reviewed_by = auth.uid(),
      admin_review_notes = p_review_notes,
      admin_reviewed_at = now(),
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Type de vérification invalide: %', p_verification_type;
  END IF;

  INSERT INTO notifications (
    user_id, type, category, title, message, link, metadata
  ) VALUES (
    p_user_id,
    'verification_rejected',
    'verification',
    'Vérification rejetée',
    'Motif: ' || p_review_notes,
    '/verification',
    jsonb_build_object(
      'verification_type', p_verification_type,
      'rejection_reason', p_review_notes
    )
  );

  INSERT INTO admin_audit_logs (
    admin_id, action_type, target_type, target_id, new_values, notes
  ) VALUES (
    auth.uid(),
    'verification_rejected',
    'user_verification',
    p_user_id,
    jsonb_build_object(
      'verification_type', p_verification_type,
      'status', 'rejected'
    ),
    p_review_notes
  );
END;
$$;

-- Mettre à jour les colonnes du profil
DO $$ 
BEGIN
  -- Ajouter cnib_verified si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cnib_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cnib_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- Copier les valeurs de oneci_verified vers cnib_verified si oneci_verified existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'oneci_verified'
  ) THEN
    UPDATE public.profiles SET cnib_verified = oneci_verified WHERE cnib_verified IS NULL;
  END IF;
END $$;

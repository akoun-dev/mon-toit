-- Migration pour les fonctions RPC OTP
-- Version : 17
-- Description : Création des fonctions RPC pour la gestion des codes OTP
-- Auteur : Claude Code
-- Date : 2025-10-27

-- =====================================================
-- FONCTIONS RPC POUR LA GESTION OTP
-- =====================================================

-- Fonction pour créer un code OTP
-- Cette fonction génère un code à 6 chiffres et l'insère dans la table otp_codes
CREATE OR REPLACE FUNCTION public.create_otp_code(
  email_param text,
  code_type_param text DEFAULT 'signup',
  temp_user_id_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp_code_uuid uuid;
  generated_code text;
  expires_at_timestamp timestamptz;
BEGIN
  -- Générer un UUID pour le code OTP
  otp_code_uuid := gen_random_uuid();

  -- Générer un code à 6 chiffres
  generated_code := FLOOR(RANDOM() * 900000 + 100000)::text;

  -- Définir l'expiration (15 minutes)
  expires_at_timestamp := NOW() + INTERVAL '15 minutes';

  -- Insérer le code OTP avec la structure existante
  INSERT INTO public.otp_codes (
    id,
    user_id,
    email,
    code,
    expires_at,
    created_at,
    is_used
  ) VALUES (
    otp_code_uuid,
    temp_user_id_param::uuid,
    email_param,
    generated_code,
    expires_at_timestamp,
    NOW(),
    false
  );

  -- Afficher le code en développement (simuler envoi email)
  -- En production, cette partie devrait être remplacée par un vrai service d'envoi d'email
  RAISE LOG '🔑 OTP Code for %: % (expires: %)', email_param, generated_code, expires_at_timestamp;

  RETURN otp_code_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating OTP code for %: %', email_param, SQLERRM;
    RETURN NULL;
END;
$$;

-- Fonction pour vérifier un code OTP
-- Cette fonction vérifie si un code est valide et le marque comme utilisé
CREATE OR REPLACE FUNCTION public.verify_otp_code_simple(
  email_param text,
  code_param text,
  code_type_param text DEFAULT 'signup'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp_record RECORD;
  result json;
BEGIN
  -- Chercher le code OTP valide
  SELECT * INTO otp_record
  FROM public.otp_codes
  WHERE email = email_param
    AND code = code_param
    AND expires_at > NOW()
    AND is_used = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Code invalide ou expiré',
      'code', 'INVALID_OR_EXPIRED'
    );
  END IF;

  -- Marquer comme utilisé
  UPDATE public.otp_codes
  SET used_at = NOW(),
      is_used = true
  WHERE id = otp_record.id;

  RETURN json_build_object(
    'valid', true,
    'message', 'Code vérifié avec succès',
    'code', 'SUCCESS',
    'otp_id', otp_record.id,
    'verified_at', NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Erreur lors de la vérification: ' || SQLERRM,
      'code', 'VERIFICATION_ERROR'
    );
END;
$$;

-- Fonction pour nettoyer les anciens codes OTP
-- Cette fonction supprime les codes expirés depuis plus de 7 jours
CREATE OR REPLACE FUNCTION public.cleanup_old_otp_notifications()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codes_deleted int;
  notifications_deleted int;
  total_deleted int;
BEGIN
  -- Supprimer les codes OTP expirés depuis plus de 7 jours
  DELETE FROM public.otp_codes
  WHERE created_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS codes_deleted = ROW_COUNT;

  -- Supprimer les notifications OTP plus vieilles que 7 jours (si la table existe)
  BEGIN
    DELETE FROM public.otp_notifications
    WHERE created_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS notifications_deleted = ROW_COUNT;
  EXCEPTION
    WHEN undefined_table THEN
      notifications_deleted := 0;
  END;

  total_deleted := codes_deleted + notifications_deleted;

  RETURN total_deleted;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error cleaning up old OTP codes: %', SQLERRM;
    RETURN 0;
END;
$$;

-- Fonction pour vérifier le statut d'un code OTP
-- Permet de savoir si un code est encore valide sans le marquer comme utilisé
CREATE OR REPLACE FUNCTION public.check_otp_status(
  email_param text,
  code_type_param text DEFAULT 'signup'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp_record RECORD;
  pending_count int;
BEGIN
  -- Compter les codes en attente pour cet email
  SELECT COUNT(*) INTO pending_count
  FROM public.otp_codes
  WHERE email = email_param
    AND expires_at > NOW()
    AND is_used = false;

  -- Chercher le dernier code OTP valide
  SELECT * INTO otp_record
  FROM public.otp_codes
  WHERE email = email_param
    AND expires_at > NOW()
    AND is_used = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'has_pending', false,
      'pending_count', 0,
      'message', 'Aucun code OTP en attente',
      'code', 'NO_PENDING_CODE'
    );
  END IF;

  RETURN json_build_object(
    'has_pending', true,
    'pending_count', pending_count,
    'otp_id', otp_record.id,
    'expires_at', otp_record.expires_at,
    'created_at', otp_record.created_at,
    'message', 'Code OTP en attente disponible',
    'code', 'PENDING_CODE'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'has_pending', false,
      'pending_count', 0,
      'message', 'Erreur lors de la vérification: ' || SQLERRM,
      'code', 'STATUS_CHECK_ERROR'
    );
END;
$$;

-- Fonction pour invalider tous les codes OTP d'un utilisateur
-- Utile quand l'utilisateur change de mot de passe ou réinitialise son compte
CREATE OR REPLACE FUNCTION public.invalidate_user_otp_codes(
  email_param text,
  code_type_param text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invalidated_count int;
BEGIN
  -- Invalider tous les codes non utilisés pour cet email
  IF code_type_param IS NOT NULL THEN
    UPDATE public.otp_codes
    SET is_used = true,
        used_at = NOW()
    WHERE email = email_param
      AND type = code_type_param
      AND is_used = false;
  ELSE
    UPDATE public.otp_codes
    SET is_used = true,
        used_at = NOW()
    WHERE email = email_param
      AND is_used = false;
  END IF;

  GET DIAGNOSTICS invalidated_count = ROW_COUNT;

  RETURN invalidated_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error invalidating OTP codes for %: %', email_param, SQLERRM;
    RETURN 0;
END;
$$;

-- =====================================================
-- PERMISSIONS POUR LES FONCTIONS RPC OTP
-- =====================================================

-- Permissions pour la fonction create_otp_code
GRANT EXECUTE ON FUNCTION public.create_otp_code TO anon;
GRANT EXECUTE ON FUNCTION public.create_otp_code TO authenticated;

-- Permissions pour la fonction verify_otp_code_simple
GRANT EXECUTE ON FUNCTION public.verify_otp_code_simple TO anon;
GRANT EXECUTE ON FUNCTION public.verify_otp_code_simple TO authenticated;

-- Permissions pour la fonction cleanup_old_otp_notifications
GRANT EXECUTE ON FUNCTION public.cleanup_old_otp_notifications TO anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_otp_notifications TO authenticated;

-- Permissions pour la fonction check_otp_status
GRANT EXECUTE ON FUNCTION public.check_otp_status TO anon;
GRANT EXECUTE ON FUNCTION public.check_otp_status TO authenticated;

-- Permissions pour la fonction invalidate_user_otp_codes
GRANT EXECUTE ON FUNCTION public.invalidate_user_otp_codes TO anon;
GRANT EXECUTE ON FUNCTION public.invalidate_user_otp_codes TO authenticated;

-- =====================================================
-- INDEXES POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour la recherche rapide par email et expiration
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_expires_at
ON public.otp_codes(email, expires_at DESC);

-- Index pour la recherche par email et statut utilisé
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_used
ON public.otp_codes(email, is_used);

-- Index pour la recherche par date de création (pour le nettoyage)
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at
ON public.otp_codes(created_at);

-- Index composite pour les requêtes de vérification
CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup
ON public.otp_codes(email, code, expires_at, is_used);

-- =====================================================
-- COMMENTAIRES POUR LES DÉVELOPPEURS
-- =====================================================

COMMENT ON FUNCTION public.create_otp_code IS 'Crée un code OTP à 6 chiffres valide pendant 15 minutes. Affiche le code dans les logs en développement.';
COMMENT ON FUNCTION public.verify_otp_code_simple IS 'Vérifie un code OTP et le marque comme utilisé. Retourne un objet JSON avec le statut.';
COMMENT ON FUNCTION public.cleanup_old_otp_notifications IS 'Supprime les codes OTP et notifications de plus de 7 jours. Retourne le nombre d enregistrements supprimés.';
COMMENT ON FUNCTION public.check_otp_status IS 'Vérifie le statut des codes OTP en attente pour un email sans les marquer comme utilisés.';
COMMENT ON FUNCTION public.invalidate_user_otp_codes IS 'Invalide tous les codes OTP en attente pour un utilisateur. Utile pour les réinitialisations.';

-- =====================================================
-- EXEMPLES D UTILISATION
-- =====================================================

/*
-- Exemple 1: Créer un code OTP
SELECT create_otp_code('user@example.com', 'signup', 'temp-user-id');

-- Exemple 2: Vérifier un code OTP
SELECT verify_otp_code_simple('user@example.com', '123456', 'signup');

-- Exemple 3: Vérifier le statut des codes en attente
SELECT check_otp_status('user@example.com', 'signup');

-- Exemple 4: Nettoyer les anciens codes
SELECT cleanup_old_otp_notifications();

-- Exemple 5: Invalider tous les codes d'un utilisateur
SELECT invalidate_user_otp_codes('user@example.com', 'signup');
*/
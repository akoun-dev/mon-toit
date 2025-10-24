-- ============================================================
-- Mon Toit — Trigger pour créer automatiquement le profil lors de l'inscription
-- Date: 2025-10-23
-- ============================================================

-- Fonction améliorée pour créer le profil et le rôle utilisateur automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type public.user_type;
  v_full_name text;
  v_profile_exists boolean;
BEGIN
  -- L'email est déjà validé par Supabase Auth

  -- Vérifier si le profil existe déjà (éviter les doublons)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO v_profile_exists;

  IF v_profile_exists THEN
    -- Le profil existe déjà, ne rien faire
    RAISE LOG 'Profil existe déjà pour l utilisateur: id=%, email=%', NEW.id, NEW.email;
    RETURN NEW;
  END IF;

  -- Extraire et valider le type d'utilisateur depuis les métadonnées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire')::public.user_type;

  -- Valider que le type d'utilisateur est dans l'énumération autorisée
  IF NOT (v_user_type IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance')) THEN
    v_user_type := 'locataire'; -- Fallback sûr
    RAISE LOG 'Type d utilisateur invalide, utilisation du défaut locataire: id=%', NEW.id;
  END IF;

  -- Nettoyer et valider le nom complet
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_full_name := TRIM(v_full_name);
  IF v_full_name = '' OR v_full_name IS NULL THEN
    v_full_name := NEW.email;
  END IF;

  -- Limiter la longueur du nom pour éviter les abus
  IF LENGTH(v_full_name) > 255 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 255);
  END IF;

  -- Créer le profil pour le nouvel utilisateur avec des validations et gestion de conflit
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    updated_at = now();

  -- Créer le rôle utilisateur par défaut avec gestion de conflit
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    v_user_type
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Logger la création pour audit
  RAISE LOG 'Nouvel utilisateur créé: id=%, email=%, type=%', NEW.id, NEW.email, v_user_type;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur pour débogage mais ne pas bloquer l'inscription
    RAISE LOG 'Erreur dans handle_new_user: %, utilisateur: %', SQLERRM, NEW.id;
    -- Ne pas lever d'exception pour éviter de bloquer l'inscription
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- NOTE: Trigger réactivé avec logique améliorée - crée le profil uniquement si pas déjà créé
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Donner les permissions nécessaires
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

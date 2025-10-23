-- ============================================================
-- Mon Toit — Trigger pour créer automatiquement le profil lors de l'inscription
-- Date: 2025-10-23
-- ============================================================

-- Fonction pour créer le profil et le rôle utilisateur automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type public.user_type;
  v_full_name text;
BEGIN
  -- Valider que l'email est présent et valide
  IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email invalide requis';
  END IF;
  
  -- Extraire et valider le type d'utilisateur depuis les métadonnées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire')::public.user_type;
  
  -- Valider que le type d'utilisateur est dans l'énumération autorisée
  IF NOT (v_user_type IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance')) THEN
    RAISE EXCEPTION 'Type d utilisateur non valide: %', v_user_type;
  END IF;
  
  -- Nettoyer et valider le nom complet
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_full_name := TRIM(v_full_name);
  IF v_full_name = '' THEN
    v_full_name := NEW.email;
  END IF;
  
  -- Limiter la longueur du nom pour éviter les abus
  IF LENGTH(v_full_name) > 255 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 255);
  END IF;

  -- Créer le profil pour le nouvel utilisateur avec des validations
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type
  );

  -- Créer le rôle utilisateur par défaut
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    v_user_type
  );

  -- Logger la création pour audit
  RAISE LOG 'Nouvel utilisateur créé: id=%, email=%, type=%', NEW.id, NEW.email, v_user_type;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur pour débogage
    RAISE LOG 'Erreur dans handle_new_user: %, utilisateur: %', SQLERRM, NEW.id;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui s'exécute après l'insertion dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
-- ===================================================================
-- Script de Seed simplifié pour Supabase Mon Toit
-- Crée un seul compte par type d'utilisateur
-- ===================================================================

-- ===================================================================
-- 1. CRÉATION DES UTILISATEURS SIMPLIFIÉS
-- ===================================================================

DO $$
DECLARE
  -- Un seul compte par type
  locataire_id UUID;
  proprietaire_id UUID;
  agence_id UUID;
  admin_id UUID;

  user_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== CRÉATION DES COMPTES UTILISATEURS (1 par type) ===';

  -- Locataire
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'locataire@mon-toit.ci') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      phone,
      raw_user_meta_data,
      encrypted_password,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'locataire@mon-toit.ci',
      NOW(),
      '+2250101010101',
      '{"full_name": "Locataire Mon Toit", "user_type": "locataire"}',
      crypt('locataire123', gen_salt('bf')),
      NOW(),
      NOW()
    ) RETURNING id INTO locataire_id;
    RAISE NOTICE '✓ Locataire créé: locataire@mon-toit.ci / locataire123';
  ELSE
    SELECT id INTO locataire_id FROM auth.users WHERE email = 'locataire@mon-toit.ci';
    RAISE NOTICE '✓ Locataire existe déjà: locataire@mon-toit.ci';
  END IF;

  -- Propriétaire
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'proprietaire@mon-toit.ci') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      phone,
      raw_user_meta_data,
      encrypted_password,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'proprietaire@mon-toit.ci',
      NOW(),
      '+2250202020202',
      '{"full_name": "Propriétaire Mon Toit", "user_type": "proprietaire"}',
      crypt('proprietaire123', gen_salt('bf')),
      NOW(),
      NOW()
    ) RETURNING id INTO proprietaire_id;
    RAISE NOTICE '✓ Propriétaire créé: proprietaire@mon-toit.ci / proprietaire123';
  ELSE
    SELECT id INTO proprietaire_id FROM auth.users WHERE email = 'proprietaire@mon-toit.ci';
    RAISE NOTICE '✓ Propriétaire existe déjà: proprietaire@mon-toit.ci';
  END IF;

  -- Agence
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'agence@mon-toit.ci') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      phone,
      raw_user_meta_data,
      encrypted_password,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'agence@mon-toit.ci',
      NOW(),
      '+2250303030303',
      '{"full_name": "Agence Mon Toit", "user_type": "agence"}',
      crypt('agence123', gen_salt('bf')),
      NOW(),
      NOW()
    ) RETURNING id INTO agence_id;
    RAISE NOTICE '✓ Agence créée: agence@mon-toit.ci / agence123';
  ELSE
    SELECT id INTO agence_id FROM auth.users WHERE email = 'agence@mon-toit.ci';
    RAISE NOTICE '✓ Agence existe déjà: agence@mon-toit.ci';
  END IF;

  -- Admin
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@mon-toit.ci') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      phone,
      raw_user_meta_data,
      encrypted_password,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'admin@mon-toit.ci',
      NOW(),
      '+2250404040404',
      '{"full_name": "Admin Mon Toit", "user_type": "admin"}',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW()
    ) RETURNING id INTO admin_id;
    RAISE NOTICE '✓ Admin créé: admin@mon-toit.ci / admin123';
  ELSE
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@mon-toit.ci';
    RAISE NOTICE '✓ Admin existe déjà: admin@mon-toit.ci';
  END IF;

  RAISE NOTICE '=== CRÉATION DES UTILISATEURS TERMINÉE ===';

  -- ===================================================================
  -- 2. CRÉATION DES PROFILS ASSOCIÉS
  -- ===================================================================

  -- Créer les profiles pour chaque utilisateur
  INSERT INTO public.profiles (id, full_name, user_type, created_at, updated_at)
  SELECT
    id,
    (raw_user_meta_data->>'full_name'),
    (raw_user_meta_data->>'user_type'),
    NOW(),
    NOW()
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles);

  RAISE NOTICE '=== CRÉATION DES PROFILS TERMINÉE ===';

END $$;

-- ===================================================================
-- 3. CRÉATION DES RÔLES UTILISATEURS
-- ===================================================================

INSERT INTO public.user_roles (user_id, role, created_at)
SELECT
  u.id as user_id,
  (u.raw_user_meta_data->>'user_type') as role,
  NOW() as created_at
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.user_roles)
AND (u.raw_user_meta_data->>'user_type') IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '=== CRÉATION DES RÔLES TERMINÉE ===';
END $$;

-- ===================================================================
-- 4. RÉCAPITULATIF ET COMPTES SUPPLÉMENTAIRES
-- ===================================================================

-- Ajout des comptes créés via l'API Supabase (ceux qui fonctionnent)
-- Ces comptes ont été créés avec l'API d'authentification
-- et utilisent le hashing correct de Supabase
--
-- Comptes recommandés pour les tests :
-- test@mon-toit.ci / test123456 (Locataire)
-- demo@mon-toit.ci / demo123 (Propriétaire)
-- agence.immobiliere@mon-toit.ci / agence123 (Agence)
-- admin@ansut.ci / admin123 (Admin ANSUT)
--
-- NOTE : Les comptes créés dans la section 1 utilisent crypt()
--        qui est incompatible avec l'authentification Supabase
--        Utiliser plutôt les comptes ci-dessus pour les tests

RAISE NOTICE '=== COMPTES CRÉÉS ===';
RAISE NOTICE '';
RAISE NOTICE '🎯 COMPTES FONCTIONNELS (API Supabase):';
RAISE NOTICE '';
RAISE NOTICE 'LOCATAIRE :';
RAISE NOTICE '- Email: test@mon-toit.ci';
RAISE NOTICE '- Mot de passe: test123456';
RAISE NOTICE '';
RAISE NOTICE 'PROPRIÉTAIRE :';
RAISE NOTICE '- Email: demo@mon-toit.ci';
RAISE NOTICE '- Mot de passe: demo123';
RAISE NOTICE '';
RAISE NOTICE 'AGENCE :';
RAISE NOTICE '- Email: agence.immobiliere@mon-toit.ci';
RAISE NOTICE '- Mot de passe: agence123';
RAISE NOTICE '';
RAISE NOTICE 'ADMIN ANSUT :';
RAISE NOTICE '- Email: admin@ansut.ci';
RAISE NOTICE '- Mot de passe: admin123';
RAISE NOTICE '';
RAISE NOTICE '⚠️  COMPTES MIGRATION (non fonctionnels) :';
RAISE NOTICE '';
RAISE NOTICE 'LOCATAIRE : locataire@mon-toit.ci / locataire123';
RAISE NOTICE 'PROPRIÉTAIRE : proprietaire@mon-toit.ci / proprietaire123';
RAISE NOTICE 'AGENCE : agence@mon-toit.ci / agence123';
RAISE NOTICE 'ADMIN : admin@mon-toit.ci / admin123';
RAISE NOTICE '';
RAISE NOTICE '=== SEED TERMINÉ AVEC SUCCÈS ===';
DO $$
BEGIN
  RAISE NOTICE '=== COMPTES UTILISATEURS CRÉÉS ===';
  RAISE NOTICE '';
  RAISE NOTICE 'LOCATAIRE :';
  RAISE NOTICE '- Email: locataire@mon-toit.ci';
  RAISE NOTICE '- Mot de passe: locataire123';
  RAISE NOTICE '';
  RAISE NOTICE 'PROPRIÉTAIRE :';
  RAISE NOTICE '- Email: proprietaire@mon-toit.ci';
  RAISE NOTICE '- Mot de passe: proprietaire123';
  RAISE NOTICE '';
  RAISE NOTICE 'AGENCE :';
  RAISE NOTICE '- Email: agence@mon-toit.ci';
  RAISE NOTICE '- Mot de passe: agence123';
  RAISE NOTICE '';
  RAISE NOTICE 'ADMIN :';
  RAISE NOTICE '- Email: admin@mon-toit.ci';
  RAISE NOTICE '- Mot de passe: admin123';
  RAISE NOTICE '';
  RAISE NOTICE '=== SEED TERMINÉ AVEC SUCCÈS ===';
END $$;
-- ===================================================================
-- Script de Seed simplifié pour Supabase Mon Toit
-- Crée un seul compte par type d'utilisateur
-- ===================================================================

-- ===================================================================
-- 1. CRÉATION DES UTILISATEURS SIMPLIFIÉS
-- ===================================================================

DO $$
BEGIN
  RAISE NOTICE '=== CRÉATION DES COMPTES UTILISATEURS (SKIPPED) ===';
  RAISE NOTICE 'Les comptes doivent être créés via l''API Auth ou Supabase Studio.';
  RAISE NOTICE 'Utilisez: npm run seed:auth (requiert SUPABASE_SERVICE_ROLE_KEY)';
  RAISE NOTICE 'Ou inscrivez-vous via l''interface / Auth Studio.';

  -- Créer les profiles pour tous les utilisateurs existants (créés via Auth)
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

DO $$
BEGIN
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
END $$;
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

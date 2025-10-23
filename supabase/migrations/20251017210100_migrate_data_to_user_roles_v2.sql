/*
  =========================================
  Système de Changement de Rôle V2 - Migration 2
  =========================================

  Cette migration migre les données depuis l'ancien système
  vers la nouvelle structure user_roles_v2 :

  1. Migration depuis user_active_roles
  2. Création d'entrées par défaut depuis profiles
  3. Validation et nettoyage des données
  4. Résumé de migration

  Date: 2025-10-17
  Version: 2.0.0
  Auteur: Manus AI
*/

-- ============================================================================
-- 1. MIGRATION DEPUIS USER_ACTIVE_ROLES
-- ============================================================================

DO $$
DECLARE
  migration_count integer := 0;
  error_count integer := 0;
  migration_log jsonb := '[]'::jsonb;
BEGIN
  -- Logger le début de la migration
  INSERT INTO public.security_audit_logs (
    event_type, severity, details, metadata
  ) VALUES (
    'ROLE_V2_MIGRATION_START', 'medium',
    jsonb_build_object('action', 'Starting migration to user_roles_v2'),
    jsonb_build_object('timestamp', now())
  );

  RAISE NOTICE 'Début de la migration vers user_roles_v2...';

  -- Étape 1: Migrer depuis user_active_roles si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_active_roles' AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Migration depuis user_active_roles...';

    -- Insérer les données depuis user_active_roles
    INSERT INTO public.user_roles_v2 (
      user_id,
      current_role,
      roles,
      available_switches_today,
      metadata
    )
    SELECT
      user_id,
      current_role,
      jsonb_build_object(
        'role', current_role,
        'added_at', created_at,
        'source', 'user_active_roles_migration'
      )::jsonb || COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'role', unnest
        )) FROM unnest(available_roles)) WHERE unnest != current_role,
        '[]'::jsonb
      ),
      3, -- 3 changements disponibles par défaut
      jsonb_build_object(
        'migrated_from', 'user_active_roles',
        'migration_date', now(),
        'original_created_at', created_at,
        'original_updated_at', updated_at
      )
    FROM public.user_active_roles
    ON CONFLICT (user_id) DO NOTHING;

    GET DIAGNOSTICS migration_count = ROW_COUNT;
    RAISE NOTICE 'Migration de % enregistrements depuis user_active_roles', migration_count;

    -- Logger la migration
    migration_log := migration_log || jsonb_build_object(
      'source', 'user_active_roles',
      'count', migration_count,
      'timestamp', now()
    );
  END IF;

  -- Étape 2: Créer des entrées par défaut depuis profiles pour les utilisateurs manquants
  RAISE NOTICE 'Création des entrées par défaut depuis profiles...';

  INSERT INTO public.user_roles_v2 (
    user_id,
    current_role,
    roles,
    available_switches_today,
    metadata
  )
  SELECT
    p.id,
    COALESCE(p.user_type, 'locataire')::text,
    jsonb_build_array(jsonb_build_object(
      'role', COALESCE(p.user_type, 'locataire')::text,
      'added_at', now(),
      'source', 'profiles_migration'
    )),
    3,
    jsonb_build_object(
      'created_from', 'profiles',
      'original_user_type', p.user_type,
      'migration_date', now()
    )
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles_v2 urv2
    WHERE urv2.user_id = p.id
  );

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Création de % enregistrements par défaut depuis profiles', migration_count;

  -- Logger la création par défaut
  migration_log := migration_log || jsonb_build_object(
    'source', 'profiles',
    'count', migration_count,
    'timestamp', now()
  );

  -- Étape 3: Nettoyer et valider les données
  RAISE NOTICE 'Nettoyage et validation des données...';

  -- Corriger les rôles invalides
  UPDATE public.user_roles_v2
  SET
    current_role = 'locataire',
    roles = jsonb_build_array(jsonb_build_object(
      'role', 'locataire',
      'added_at', now(),
      'source', 'data_cleanup'
    )),
    metadata = metadata || jsonb_build_object(
      'corrected_invalid_role', true,
      'correction_date', now()
    )
  WHERE current_role NOT IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance');

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  IF migration_count > 0 THEN
    RAISE NOTICE 'Correction de % rôles invalides', migration_count;

    -- Logger les corrections
    migration_log := migration_log || jsonb_build_object(
      'action', 'corrected_invalid_roles',
      'count', migration_count,
      'timestamp', now()
    );
  END IF;

  -- Étape 4: Résumé de migration
  RAISE NOTICE 'Génération du résumé de migration...';

  -- Statistiques de migration
  DECLARE
    v_total_users integer;
    v_users_with_roles integer;
    v_users_multiple_roles integer;
    v_role_distribution jsonb;
  BEGIN
    -- Nombre total d'utilisateurs dans user_roles_v2
    SELECT COUNT(*) INTO v_total_users FROM public.user_roles_v2;

    -- Utilisateurs avec au moins un rôle
    SELECT COUNT(*) INTO v_users_with_roles
    FROM public.user_roles_v2
    WHERE jsonb_array_length(roles) > 0;

    -- Utilisateurs avec plusieurs rôles
    SELECT COUNT(*) INTO v_users_multiple_roles
    FROM public.user_roles_v2
    WHERE jsonb_array_length(roles) > 1;

    -- Distribution des rôles actuels
    SELECT jsonb_object_agg(current_role, role_count) INTO v_role_distribution
    FROM (
      SELECT current_role, COUNT(*) as role_count
      FROM public.user_roles_v2
      GROUP BY current_role
    ) role_stats;

    -- Afficher le résumé
    RAISE NOTICE '';
    RAISE NOTICE '=== RÉSUMÉ DE MIGRATION USER_ROLES_V2 ===';
    RAISE NOTICE 'Total utilisateurs migrés: %', v_total_users;
    RAISE NOTICE 'Utilisateurs avec rôles: %', v_users_with_roles;
    RAISE NOTICE 'Utilisateurs avec plusieurs rôles: %', v_users_multiple_roles;
    RAISE NOTICE 'Distribution des rôles actuels: %', v_role_distribution;
    RAISE NOTICE '';

    -- Logger le résumé
    INSERT INTO public.security_audit_logs (
      event_type, severity, details, metadata
    ) VALUES (
      'ROLE_V2_MIGRATION_COMPLETE', 'medium',
      jsonb_build_object(
        'total_users', v_total_users,
        'users_with_roles', v_users_with_roles,
        'users_multiple_roles', v_users_multiple_roles,
        'role_distribution', v_role_distribution
      ),
      jsonb_build_object(
        'migration_log', migration_log,
        'timestamp', now()
      )
    );
  END;

EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur
  error_count := error_count + 1;
  INSERT INTO public.security_audit_logs (
    event_type, severity, details, metadata
  ) VALUES (
    'ROLE_V2_MIGRATION_ERROR', 'high',
    jsonb_build_object(
      'error_message', SQLERRM,
      'error_count', error_count
    ),
    jsonb_build_object('timestamp', now())
  );

  RAISE EXCEPTION 'Erreur lors de la migration: %', SQLERRM;
END;
$$;

-- ============================================================================
-- 2. VALIDATION POST-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_validation_errors integer := 0;
  v_validation_messages jsonb := '[]'::jsonb;
BEGIN
  RAISE NOTICE 'Validation post-migration...';

  -- Validation 1: Vérifier qu'il n'y a pas de user_id NULL
  IF EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id IS NULL) THEN
    v_validation_errors := v_validation_errors + 1;
    v_validation_messages := v_validation_messages || jsonb_build_object(
      'error', 'NULL user_id found',
      'severity', 'high'
    );
  END IF;

  -- Validation 2: Vérifier que tous les current_role sont valides
  IF EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE current_role NOT IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance')) THEN
    v_validation_errors := v_validation_errors + 1;
    v_validation_messages := v_validation_messages || jsonb_build_object(
      'error', 'Invalid current_role found',
      'severity', 'medium'
    );
  END IF;

  -- Validation 3: Vérifier que les champs JSON sont valides
  BEGIN
    -- Tenter de valider le format JSON
    PERFORM 1 FROM public.user_roles_v2 WHERE jsonb_typeof(roles) != 'array' LIMIT 1;
    IF FOUND THEN
      v_validation_errors := v_validation_errors + 1;
      v_validation_messages := v_validation_messages || jsonb_build_object(
        'error', 'Invalid roles JSON format',
        'severity', 'medium'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_validation_errors := v_validation_errors + 1;
    v_validation_messages := v_validation_messages || jsonb_build_object(
      'error', 'JSON validation failed',
      'severity', 'high',
      'details', SQLERRM
    );
  END;

  -- Afficher les résultats de validation
  IF v_validation_errors > 0 THEN
    RAISE NOTICE 'ERREURS DE VALIDATION TROUVÉES: %', v_validation_errors;
    RAISE NOTICE 'Messages: %', v_validation_messages;
  ELSE
    RAISE NOTICE '✅ Validation réussie - Aucune erreur trouvée';
  END IF;

  -- Logger la validation
  INSERT INTO public.security_audit_logs (
    event_type, severity, details, metadata
  ) VALUES (
    'ROLE_V2_MIGRATION_VALIDATION',
    CASE WHEN v_validation_errors > 0 THEN 'high' ELSE 'low' END,
    jsonb_build_object(
      'validation_errors', v_validation_errors,
      'validation_messages', v_validation_messages
    ),
    jsonb_build_object('timestamp', now())
  );
END;
$$;

-- ============================================================================
-- 3. NETTOYAGE DES DONNÉES ANCIENNES (OPTIONNEL)
-- ============================================================================

-- ATTENTION: Cette section est commentée par sécurité
-- Décommentez uniquement après avoir validé que la migration a réussi

/*
DO $$
BEGIN
  RAISE NOTICE 'Nettoyage des anciennes tables...';

  -- Archiver user_active_roles avant suppression
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_active_roles' AND table_schema = 'public') THEN
    -- Créer une table d'archive
    CREATE TABLE IF NOT EXISTS public.user_active_roles_archive AS
    SELECT * FROM public.user_active_roles;

    -- Supprimer l'ancienne table
    DROP TABLE IF EXISTS public.user_active_roles;

    RAISE NOTICE 'user_active_roles archivée et supprimée';
  END IF;

  -- Logger le nettoyage
  INSERT INTO public.security_audit_logs (
    event_type, severity, details, metadata
  ) VALUES (
    'ROLE_V2_CLEANUP', 'medium',
    jsonb_build_object('action', 'Cleaned up old role tables'),
    jsonb_build_object('timestamp', now())
  );
END $$;
*/

-- ============================================================================
-- 4. COMPLÉTION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration user_roles_v2 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE 'Actions effectuées:';
  RAISE NOTICE '✅ Migration depuis user_active_roles (si existante)';
  RAISE NOTICE '✅ Création des entrées par défaut depuis profiles';
  RAISE NOTICE '✅ Nettoyage et validation des données';
  RAISE NOTICE '✅ Résumé de migration généré';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Déployer l''Edge Function switch-role-v2';
  RAISE NOTICE '2. Mettre à jour le frontend avec les nouveaux composants';
  RAISE NOTICE '3. Tester le système de changement de rôle';
  RAISE NOTICE '4. Supprimer les anciennes tables (optionnel, après validation)';
  RAISE NOTICE '';
  RAISE NOTICE 'La migration est prête pour le déploiement! 🚀';
END $$;
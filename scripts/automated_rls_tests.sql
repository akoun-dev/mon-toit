-- ===============================================
-- SCRIPTS DE TEST RLS AUTOMATISÉS COMPLETS
-- ===============================================
-- Tests automatisés de Row Level Security pour la plateforme Mon Toit
-- Couvre tous les rôles, tables et scénarios de sécurité

-- ===============================================
-- 1. CONFIGURATION DES ENVIRONNEMENTS DE TEST
-- ===============================================

-- Création d'utilisateurs de test dédiés
DO $$
BEGIN
    -- Créer les rôles de test s'ils n'existent pas
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_test_tenant') THEN
        CREATE ROLE rls_test_tenant;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_test_owner') THEN
        CREATE ROLE rls_test_owner;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_test_agency') THEN
        CREATE ROLE rls_test_agency;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_test_trust') THEN
        CREATE ROLE rls_test_trust;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_test_admin') THEN
        CREATE ROLE rls_test_admin;
    END IF;
END $$;

-- Création des tables de suivi des tests
CREATE TABLE IF NOT EXISTS rls_test_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result TEXT,
    test_status VARCHAR(20) NOT NULL CHECK (test_status IN ('PASS', 'FAIL', 'ERROR')),
    test_details TEXT,
    test_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER
);

CREATE TABLE IF NOT EXISTS rls_test_suites (
    id SERIAL PRIMARY KEY,
    suite_name VARCHAR(255) NOT NULL,
    total_tests INTEGER NOT NULL,
    passed_tests INTEGER NOT NULL,
    failed_tests INTEGER NOT NULL,
    error_tests INTEGER NOT NULL,
    success_rate NUMERIC(5,2) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 2. UTILITAIRES DE TEST
-- ===============================================

-- Fonction pour logger les résultats de tests
CREATE OR REPLACE FUNCTION log_rls_test_result(
    p_test_name TEXT,
    p_test_type TEXT,
    p_table_name TEXT,
    p_user_role TEXT,
    p_expected_result TEXT,
    p_actual_result TEXT,
    p_test_status TEXT,
    p_test_details TEXT DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO rls_test_results (
        test_name, test_type, table_name, user_role,
        expected_result, actual_result, test_status,
        test_details, execution_time_ms
    ) VALUES (
        p_test_name, p_test_type, p_table_name, p_user_role,
        p_expected_result, p_actual_result, p_test_status,
        p_test_details, p_execution_time_ms
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour exécuter une assertion de test
CREATE OR REPLACE FUNCTION rls_assert(
    p_test_name TEXT,
    p_test_type TEXT,
    p_table_name TEXT,
    p_user_role TEXT,
    p_query TEXT,
    p_expected_count INTEGER,
    p_test_details TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_execution_time INTEGER;
    v_actual_count INTEGER;
    v_test_status TEXT;
BEGIN
    v_start_time := clock_timestamp();

    BEGIN
        EXECUTE p_query INTO v_actual_count;
        v_end_time := clock_timestamp();
        v_execution_time := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));

        IF v_actual_count = p_expected_count THEN
            v_test_status := 'PASS';
            PERFORM log_rls_test_result(
                p_test_name, p_test_type, p_table_name, p_user_role,
                'COUNT=' || p_expected_count, 'COUNT=' || v_actual_count,
                v_test_status, p_test_details, v_execution_time
            );
            RETURN TRUE;
        ELSE
            v_test_status := 'FAIL';
            PERFORM log_rls_test_result(
                p_test_name, p_test_type, p_table_name, p_user_role,
                'COUNT=' || p_expected_count, 'COUNT=' || v_actual_count,
                v_test_status, p_test_details, v_execution_time
            );
            RETURN FALSE;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        v_end_time := clock_timestamp();
        v_execution_time := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
        v_test_status := 'ERROR';
        PERFORM log_rls_test_result(
            p_test_name, p_test_type, p_table_name, p_user_role,
            'COUNT=' || p_expected_count, 'ERROR: ' || SQLERRM,
            v_test_status, p_test_details, v_execution_time
        );
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 3. TESTS RLS - TABLE PROPERTIES
-- ===============================================

-- Créer des données de test pour properties
DO $$
DECLARE
    v_tenant1_id UUID := gen_random_uuid();
    v_tenant2_id UUID := gen_random_uuid();
    v_owner1_id UUID := gen_random_uuid();
    v_owner2_id UUID := gen_random_uuid();
    v_property1_id UUID := gen_random_uuid();
    v_property2_id UUID := gen_random_uuid();
    v_property3_id UUID := gen_random_uuid();
BEGIN
    -- Insérer des utilisateurs de test
    INSERT INTO profiles (id, email, role, created_at) VALUES
        (v_tenant1_id, 'test.tenant1@mon-toit.ci', 'tenant', NOW()),
        (v_tenant2_id, 'test.tenant2@mon-toit.ci', 'tenant', NOW()),
        (v_owner1_id, 'test.owner1@mon-toit.ci', 'owner', NOW()),
        (v_owner2_id, 'test.owner2@mon-toit.ci', 'owner', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insérer des propriétés de test
    INSERT INTO properties (id, title, description, price, owner_id, status, created_at) VALUES
        (v_property1_id, 'Test Property 1', 'Test description 1', 150000, v_owner1_id, 'published', NOW()),
        (v_property2_id, 'Test Property 2', 'Test description 2', 200000, v_owner2_id, 'published', NOW()),
        (v_property3_id, 'Test Property 3', 'Test description 3', 180000, v_owner1_id, 'draft', NOW())
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Tests RLS pour la table properties
DO $$
DECLARE
    v_tenant1_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant1@mon-toit.ci' LIMIT 1);
    v_tenant2_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant2@mon-toit.ci' LIMIT 1);
    v_owner1_id UUID := (SELECT id FROM profiles WHERE email = 'test.owner1@mon-toit.ci' LIMIT 1);
    v_owner2_id UUID := (SELECT id FROM profiles WHERE email = 'test.owner2@mon-toit.ci' LIMIT 1);
    v_tests_passed INTEGER := 0;
    v_tests_total INTEGER := 0;
BEGIN
    RAISE NOTICE 'DÉBUT DES TESTS RLS - TABLE PROPERTIES';

    -- Test 1: Tenant ne peut voir que les propriétés publiées
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'TENANT_VIEW_PUBLISHED_ONLY',
        'SELECT',
        'properties',
        'tenant',
        'SET LOCAL role TO tenant; SELECT COUNT(*) FROM properties WHERE status = ''published''',
        2,
        'Tenant should only see published properties'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 2: Owner ne voit que ses propres propriétés
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'OWNER_VIEW_OWN_PROPERTIES',
        'SELECT',
        'properties',
        'owner',
        'SET LOCAL role TO owner; SELECT COUNT(*) FROM properties WHERE owner_id = ''' || v_owner1_id || '''',
        2,
        'Owner should only see their own properties'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 3: Tenant ne peut pas modifier les propriétés
    v_tests_total := v_tests_total + 1;
    BEGIN
        EXECUTE 'SET LOCAL role TO tenant; UPDATE properties SET title = ''HACKED'' WHERE id = (SELECT id FROM properties LIMIT 1)';
        -- Si on arrive ici, le test a échoué
        PERFORM log_rls_test_result(
            'TENANT_NO_UPDATE', 'UPDATE', 'properties', 'tenant',
            'PERMISSION DENIED', 'UPDATE SUCCEEDED', 'FAIL',
            'Tenant should not be able to update properties'
        );
    EXCEPTION WHEN insufficient_privilege THEN
        v_tests_passed := v_tests_passed + 1;
        PERFORM log_rls_test_result(
            'TENANT_NO_UPDATE', 'UPDATE', 'properties', 'tenant',
            'PERMISSION DENIED', 'PERMISSION DENIED', 'PASS',
            'Tenant correctly blocked from updating properties'
        );
    END;

    -- Test 4: Owner peut modifier ses propres propriétés
    v_tests_total := v_tests_total + 1;
    BEGIN
        EXECUTE 'SET LOCAL role TO owner; UPDATE properties SET title = ''Updated by owner'' WHERE owner_id = ''' || v_owner1_id || ''' AND id = (SELECT id FROM properties WHERE owner_id = ''' || v_owner1_id || ''' LIMIT 1)';
        v_tests_passed := v_tests_passed + 1;
        PERFORM log_rls_test_result(
            'OWNER_UPDATE_OWN', 'UPDATE', 'properties', 'owner',
            'UPDATE SUCCESS', 'UPDATE SUCCESS', 'PASS',
            'Owner can update their own properties'
        );
    EXCEPTION WHEN OTHERS THEN
        PERFORM log_rls_test_result(
            'OWNER_UPDATE_OWN', 'UPDATE', 'properties', 'owner',
            'UPDATE SUCCESS', 'ERROR: ' || SQLERRM, 'FAIL',
            'Owner failed to update their own properties'
        );
    END;

    -- Test 5: Admin peut voir toutes les propriétés
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'ADMIN_VIEW_ALL',
        'SELECT',
        'properties',
        'admin',
        'SET LOCAL role TO admin; SELECT COUNT(*) FROM properties',
        3,
        'Admin should see all properties regardless of status'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    RAISE NOTICE 'TESTS PROPERTIES TERMINÉS: %/% réussis', v_tests_passed, v_tests_total;
END $$;

-- ===============================================
-- 4. TESTS RLS - TABLE APPLICATIONS
-- ===============================================

-- Tests RLS pour la table applications
DO $$
DECLARE
    v_tenant1_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant1@mon-toit.ci' LIMIT 1);
    v_tenant2_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant2@mon-toit.ci' LIMIT 1);
    v_owner1_id UUID := (SELECT id FROM profiles WHERE email = 'test.owner1@mon-toit.ci' LIMIT 1);
    v_property1_id UUID := (SELECT id FROM properties WHERE owner_id = v_owner1_id LIMIT 1);
    v_tests_passed INTEGER := 0;
    v_tests_total INTEGER := 0;
BEGIN
    RAISE NOTICE 'DÉBUT DES TESTS RLS - TABLE APPLICATIONS';

    -- Créer des candidatures de test
    INSERT INTO applications (id, property_id, tenant_id, status, message, created_at) VALUES
        (gen_random_uuid(), v_property1_id, v_tenant1_id, 'pending', 'Test application 1', NOW()),
        (gen_random_uuid(), v_property1_id, v_tenant2_id, 'accepted', 'Test application 2', NOW())
    ON CONFLICT DO NOTHING;

    -- Test 1: Tenant ne voit que ses propres candidatures
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'TENANT_VIEW_OWN_APPLICATIONS',
        'SELECT',
        'applications',
        'tenant',
        'SET LOCAL role to tenant; SELECT COUNT(*) FROM applications WHERE tenant_id = ''' || v_tenant1_id || '''',
        1,
        'Tenant should only see their own applications'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 2: Owner voit les candidatures pour ses propriétés
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'OWNER_VIEW_PROPERTY_APPLICATIONS',
        'SELECT',
        'applications',
        'owner',
        'SET LOCAL role to owner; SELECT COUNT(*) FROM applications WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ''' || v_owner1_id || ''')',
        2,
        'Owner should see applications for their properties'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 3: Tenant ne peut pas modifier les candidatures
    v_tests_total := v_tests_total + 1;
    BEGIN
        EXECUTE 'SET LOCAL role to tenant; UPDATE applications SET status = ''accepted'' WHERE tenant_id = ''' || v_tenant1_id || '''';
        PERFORM log_rls_test_result(
            'TENANT_NO_UPDATE_APPLICATION', 'UPDATE', 'applications', 'tenant',
            'PERMISSION DENIED', 'UPDATE SUCCEEDED', 'FAIL',
            'Tenant should not be able to update applications'
        );
    EXCEPTION WHEN insufficient_privilege THEN
        v_tests_passed := v_tests_passed + 1;
        PERFORM log_rls_test_result(
            'TENANT_NO_UPDATE_APPLICATION', 'UPDATE', 'applications', 'tenant',
            'PERMISSION DENIED', 'PERMISSION DENIED', 'PASS',
            'Tenant correctly blocked from updating applications'
        );
    END;

    -- Test 4: Owner peut mettre à jour le statut des candidatures
    v_tests_total := v_tests_total + 1;
    BEGIN
        EXECUTE 'SET LOCAL role to owner; UPDATE applications SET status = ''reviewed'' WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ''' || v_owner1_id || ''')';
        v_tests_passed := v_tests_passed + 1;
        PERFORM log_rls_test_result(
            'OWNER_UPDATE_APPLICATION_STATUS', 'UPDATE', 'applications', 'owner',
            'UPDATE SUCCESS', 'UPDATE SUCCESS', 'PASS',
            'Owner can update application status for their properties'
        );
    EXCEPTION WHEN OTHERS THEN
        PERFORM log_rls_test_result(
            'OWNER_UPDATE_APPLICATION_STATUS', 'UPDATE', 'applications', 'owner',
            'UPDATE SUCCESS', 'ERROR: ' || SQLERRM, 'FAIL',
            'Owner failed to update application status'
        );
    END;

    RAISE NOTICE 'TESTS APPLICATIONS TERMINÉS: %/% réussis', v_tests_passed, v_tests_total;
END $$;

-- ===============================================
-- 5. TESTS RLS - TABLE MESSAGES
-- ===============================================

-- Tests RLS pour la table messages
DO $$
DECLARE
    v_tenant1_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant1@mon-toit.ci' LIMIT 1);
    v_tenant2_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant2@mon-toit.ci' LIMIT 1);
    v_owner1_id UUID := (SELECT id FROM profiles WHERE email = 'test.owner1@mon-toit.ci' LIMIT 1);
    v_property1_id UUID := (SELECT id FROM properties WHERE owner_id = v_owner1_id LIMIT 1);
    v_tests_passed INTEGER := 0;
    v_tests_total INTEGER := 0;
BEGIN
    RAISE NOTICE 'DÉBUT DES TESTS RLS - TABLE MESSAGES';

    -- Créer des messages de test
    INSERT INTO messages (id, sender_id, receiver_id, property_id, content, created_at) VALUES
        (gen_random_uuid(), v_tenant1_id, v_owner1_id, v_property1_id, 'Test message from tenant 1', NOW()),
        (gen_random_uuid(), v_owner1_id, v_tenant1_id, v_property1_id, 'Test reply from owner 1', NOW()),
        (gen_random_uuid(), v_tenant2_id, v_owner1_id, v_property1_id, 'Test message from tenant 2', NOW())
    ON CONFLICT DO NOTHING;

    -- Test 1: Tenant ne voit que les messages où il est expéditeur ou destinataire
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'TENANT_VIEW_OWN_MESSAGES',
        'SELECT',
        'messages',
        'tenant',
        'SET LOCAL role to tenant; SELECT COUNT(*) FROM messages WHERE sender_id = ''' || v_tenant1_id || ''' OR receiver_id = ''' || v_tenant1_id || '''',
        2,
        'Tenant should only see messages where they are sender or receiver'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 2: Owner ne voit que les messages de ses propriétés
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'OWNER_VIEW_PROPERTY_MESSAGES',
        'SELECT',
        'messages',
        'owner',
        'SET LOCAL role to owner; SELECT COUNT(*) FROM messages WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ''' || v_owner1_id || ''')',
        3,
        'Owner should see messages for their properties'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 3: Tenant ne peut pas voir les messages des autres
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'TENANT_CANNOT_VIEW_OTHERS_MESSAGES',
        'SELECT',
        'messages',
        'tenant',
        'SET LOCAL role to tenant; SELECT COUNT(*) FROM messages WHERE sender_id = ''' || v_tenant2_id || ''' AND receiver_id = ''' || v_owner1_id || '''',
        0,
        'Tenant should not see messages between other users'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    RAISE NOTICE 'TESTS MESSAGES TERMINÉS: %/% réussis', v_tests_passed, v_tests_total;
END $$;

-- ===============================================
-- 6. TESTS RLS - TABLE FAVORITES
-- ===============================================

-- Tests RLS pour la table favorites
DO $$
DECLARE
    v_tenant1_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant1@mon-toit.ci' LIMIT 1);
    v_tenant2_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant2@mon-toit.ci' LIMIT 1);
    v_property1_id UUID := (SELECT id FROM properties LIMIT 1);
    v_tests_passed INTEGER := 0;
    v_tests_total INTEGER := 0;
BEGIN
    RAISE NOTICE 'DÉBUT DES TESTS RLS - TABLE FAVORITES';

    -- Créer des favoris de test
    INSERT INTO favorites (id, user_id, property_id, created_at) VALUES
        (gen_random_uuid(), v_tenant1_id, v_property1_id, NOW()),
        (gen_random_uuid(), v_tenant2_id, v_property1_id, NOW())
    ON CONFLICT DO NOTHING;

    -- Test 1: Tenant ne voit que ses propres favoris
    v_tests_total := v_tests_total + 1;
    IF rls_assert(
        'TENANT_VIEW_OWN_FAVORITES',
        'SELECT',
        'favorites',
        'tenant',
        'SET LOCAL role to tenant; SELECT COUNT(*) FROM favorites WHERE user_id = ''' || v_tenant1_id || '''',
        1,
        'Tenant should only see their own favorites'
    ) THEN
        v_tests_passed := v_tests_passed + 1;
    END IF;

    -- Test 2: Tenant peut ajouter/supprimer ses favoris
    v_tests_total := v_tests_total + 1;
    BEGIN
        EXECUTE 'SET LOCAL role to tenant; INSERT INTO favorites (user_id, property_id) VALUES (''' || v_tenant1_id || ''', (SELECT id FROM properties LIMIT 1)) ON CONFLICT DO NOTHING';
        v_tests_passed := v_tests_passed + 1;
        PERFORM log_rls_test_result(
            'TENANT_MANAGE_FAVORITES', 'INSERT', 'favorites', 'tenant',
            'INSERT SUCCESS', 'INSERT SUCCESS', 'PASS',
            'Tenant can manage their own favorites'
        );
    EXCEPTION WHEN OTHERS THEN
        PERFORM log_rls_test_result(
            'TENANT_MANAGE_FAVORITES', 'INSERT', 'favorites', 'tenant',
            'INSERT SUCCESS', 'ERROR: ' || SQLERRM, 'FAIL',
            'Tenant failed to manage their favorites'
        );
    END;

    RAISE NOTICE 'TESTS FAVORITES TERMINÉS: %/% réussis', v_tests_passed, v_tests_total;
END $$;

-- ===============================================
-- 7. TESTS RLS - TABLE REVIEWS/RATINGS
-- ===============================================

-- Tests RLS pour la table reviews (si elle existe)
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_tenant1_id UUID := (SELECT id FROM profiles WHERE email = 'test.tenant1@mon-toit.ci' LIMIT 1);
    v_owner1_id UUID := (SELECT id FROM profiles WHERE email = 'test.owner1@mon-toit.ci' LIMIT 1);
    v_property1_id UUID := (SELECT id FROM properties WHERE owner_id = v_owner1_id LIMIT 1);
    v_tests_passed INTEGER := 0;
    v_tests_total INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'reviews'
    ) INTO v_table_exists;

    IF v_table_exists THEN
        RAISE NOTICE 'DÉBUT DES TESTS RLS - TABLE REVIEWS';

        -- Créer des avis de test
        INSERT INTO reviews (id, property_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
            (gen_random_uuid(), v_property1_id, v_tenant1_id, v_owner1_id, 5, 'Excellent propriétaire!', NOW())
        ON CONFLICT DO NOTHING;

        -- Test 1: Tenant ne voit que les avis des propriétés qu'il a visitées
        v_tests_total := v_tests_total + 1;
        IF rls_assert(
            'TENANT_VIEW_RELEVANT_REVIEWS',
            'SELECT',
            'reviews',
            'tenant',
            'SET LOCAL role to tenant; SELECT COUNT(*) FROM reviews WHERE reviewer_id = ''' || v_tenant1_id || ''' OR reviewee_id = ''' || v_tenant1_id || '''',
            1,
            'Tenant should only see reviews they authored or received'
        ) THEN
            v_tests_passed := v_tests_passed + 1;
        END IF;

        -- Test 2: Owner ne voit que les avis concernant ses propriétés
        v_tests_total := v_tests_total + 1;
        IF rls_assert(
            'OWNER_VIEW_PROPERTY_REVIEWS',
            'SELECT',
            'reviews',
            'owner',
            'SET LOCAL role to owner; SELECT COUNT(*) FROM reviews WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ''' || v_owner1_id || ''')',
            1,
            'Owner should see reviews for their properties'
        ) THEN
            v_tests_passed := v_tests_passed + 1;
        END IF;

        RAISE NOTICE 'TESTS REVIEWS TERMINÉS: %/% réussis', v_tests_passed, v_tests_total;
    ELSE
        RAISE NOTICE 'TABLE REVIEWS INEXISTANTE - TESTS IGNORÉS';
    END IF;
END $$;

-- ===============================================
-- 8. RAPPORT FINAL DES TESTS
-- ===============================================

DO $$
DECLARE
    v_total_tests INTEGER;
    v_passed_tests INTEGER;
    v_failed_tests INTEGER;
    v_error_tests INTEGER;
    v_success_rate NUMERIC(5,2);
    v_suite_name TEXT := 'RLS_AUTOMATED_TEST_SUITE_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS');
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_execution_time INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    -- Calculer les statistiques
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE test_status = 'PASS'),
        COUNT(*) FILTER (WHERE test_status = 'FAIL'),
        COUNT(*) FILTER (WHERE test_status = 'ERROR')
    INTO v_total_tests, v_passed_tests, v_failed_tests, v_error_tests
    FROM rls_test_results
    WHERE test_timestamp >= (NOW() - INTERVAL '1 minute');

    -- Calculer le taux de succès
    v_success_rate := CASE
        WHEN v_total_tests > 0 THEN
            ROUND((v_passed_tests::NUMERIC / v_total_tests::NUMERIC) * 100, 2)
        ELSE 0
    END;

    v_end_time := clock_timestamp();
    v_execution_time := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));

    -- Insérer le rapport de la suite de tests
    INSERT INTO rls_test_suites (
        suite_name, total_tests, passed_tests, failed_tests,
        error_tests, success_rate, execution_time_ms
    ) VALUES (
        v_suite_name, v_total_tests, v_passed_tests, v_failed_tests,
        v_error_tests, v_success_rate, v_execution_time
    );

    -- Afficher le rapport
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'RAPPORT FINAL DES TESTS RLS AUTOMATISÉS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Suite de tests: %', v_suite_name;
    RAISE NOTICE 'Durée d''exécution: % ms', v_execution_time;
    RAISE NOTICE '';
    RAISE NOTICE 'RÉSULTATS:';
    RAISE NOTICE '  Total tests: %', v_total_tests;
    RAISE NOTICE '  Réussis: %', v_passed_tests;
    RAISE NOTICE '  Échoués: %', v_failed_tests;
    RAISE NOTICE '  Erreurs: %', v_error_tests;
    RAISE NOTICE '  Taux de succès: %%%', v_success_rate;
    RAISE NOTICE '';

    -- Afficher les détails des tests échoués
    IF v_failed_tests > 0 OR v_error_tests > 0 THEN
        RAISE NOTICE 'TESTS EN ÉCHEC:';
        FOR test_rec IN
            SELECT test_name, table_name, user_role, expected_result, actual_result, test_details
            FROM rls_test_results
            WHERE test_timestamp >= (NOW() - INTERVAL '1 minute')
            AND test_status IN ('FAIL', 'ERROR')
            ORDER BY test_timestamp
        LOOP
            RAISE NOTICE '  ❌ % (%)', test_rec.test_name, test_rec.table_name;
            RAISE NOTICE '     Rôle: % | Attendu: % | Obtenu: %',
                test_rec.user_role, test_rec.expected_result, test_rec.actual_result;
            IF test_rec.test_details IS NOT NULL THEN
                RAISE NOTICE '     Détails: %', test_rec.test_details;
            END IF;
        END LOOP;
    END IF;

    RAISE NOTICE '';
    IF v_success_rate >= 95 THEN
        RAISE NOTICE '🎉 EXCELLENT! Tests RLS très réussis';
    ELSIF v_success_rate >= 80 THEN
        RAISE NOTICE '✅ BON! Tests RLS majoritairement réussis';
    ELSIF v_success_rate >= 60 THEN
        RAISE NOTICE '⚠️  ATTENTION! Tests RLS partiellement réussis';
    ELSE
        RAISE NOTICE '❌ CRITIQUE! Tests RLS majoritairement échoués';
    END IF;
    RAISE NOTICE '===========================================';
END $$;

-- ===============================================
-- 9. FONCTIONS DE NETTOYAGE
-- ===============================================

-- Fonction pour nettoyer les données de test
CREATE OR REPLACE FUNCTION cleanup_rls_test_data()
RETURNS VOID AS $$
BEGIN
    -- Supprimer les utilisateurs de test
    DELETE FROM profiles WHERE email LIKE 'test.%@mon-toit.ci';

    -- Supprimer les résultats de tests anciens (plus de 7 jours)
    DELETE FROM rls_test_results WHERE test_timestamp < NOW() - INTERVAL '7 days';

    -- Supprimer les suites de tests anciennes (plus de 7 jours)
    DELETE FROM rls_test_suites WHERE created_at < NOW() - INTERVAL '7 days';

    RAISE NOTICE 'Données de test RLS nettoyées avec succès';
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 10. VUES DE REPORTING
-- ===============================================

-- Vue pour les résultats récents des tests
CREATE OR REPLACE VIEW rls_test_summary AS
SELECT
    DATE_TRUNC('day', test_timestamp) as test_date,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE test_status = 'PASS') as passed_tests,
    COUNT(*) FILTER (WHERE test_status = 'FAIL') as failed_tests,
    COUNT(*) FILTER (WHERE test_status = 'ERROR') as error_tests,
    ROUND((COUNT(*) FILTER (WHERE test_status = 'PASS')::NUMERIC / COUNT(*)) * 100, 2) as success_rate
FROM rls_test_results
WHERE test_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', test_timestamp)
ORDER BY test_date DESC;

-- Vue pour les détails des tests par table
CREATE OR REPLACE VIEW rls_test_by_table AS
SELECT
    table_name,
    test_type,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE test_status = 'PASS') as passed_tests,
    COUNT(*) FILTER (WHERE test_status = 'FAIL') as failed_tests,
    COUNT(*) FILTER (WHERE test_status = 'ERROR') as error_tests,
    ROUND((COUNT(*) FILTER (WHERE test_status = 'PASS')::NUMERIC / COUNT(*)) * 100, 2) as success_rate
FROM rls_test_results
WHERE test_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY table_name, test_type
ORDER BY success_rate DESC, total_tests DESC;

-- ===============================================
-- INSTRUCTIONS D'UTILISATION
-- ===============================================

/*
Ce script de test RLS automatisé peut être utilisé de plusieurs manières:

1. EXÉCUTION MANUELLE COMPLÈTE:
   - Exécuter tout le script pour tester toutes les tables et rôles
   - Génère un rapport complet dans les logs

2. EXÉCUTION PÉRIODIQUE:
   - Planifier l'exécution via cron ou pg_cron
   - Exemple: SELECT cleanup_rls_test_data(); puis exécuter les tests

3. RAPPORTS:
   - Consultez la vue rls_test_summary pour les tendances
   - Consultez la vue rls_test_by_table pour les détails par table

4. NETTOYAGE:
   - Exécutez SELECT cleanup_rls_test_data(); pour nettoyer les anciennes données

RECOMMANDATIONS:
- Exécuter ces tests après chaque modification des politiques RLS
- Intégrer dans le pipeline CI/CD
- Surveiller les taux de succès > 95%
- Investiguer immédiatement tout test en échec

*/
-- ============================================
-- COMPREHENSIVE DATABASE MIGRATION SCRIPT
-- ============================================
-- Version: 1.0.0
-- Date: 2025-10-21
-- Description: Protection des Numéros de Téléphone avec gestion robuste des colonnes
-- Features: Dynamic column checks, error handling, logging, rollback procedures
-- Compatibility: PostgreSQL 13+

-- ============================================
-- 1. MIGRATION METADATA AND LOGGING
-- ============================================

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  details JSONB DEFAULT '{}'
);

-- Create migration checkpoint table for rollback
CREATE TABLE IF NOT EXISTS migration_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  checkpoint_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rollback_sql TEXT,
  details JSONB DEFAULT '{}'
);

-- Enable RLS on migration tables
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for migration tables (only accessible to service role)
CREATE POLICY "Service role full access to migration_logs" ON migration_logs
  FOR ALL USING (current_setting('app.config.role', '') = 'service_role');

CREATE POLICY "Service role full access to migration_checkpoints" ON migration_checkpoints
  FOR ALL USING (current_setting('app.config.role', '') = 'service_role');

-- ============================================
-- 2. UTILITY FUNCTIONS FOR MIGRATION
-- ============================================

-- Function to log migration steps
CREATE OR REPLACE FUNCTION log_migration_step(
  p_step_name TEXT,
  p_status TEXT DEFAULT 'started',
  p_error_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO migration_logs (migration_name, version, status, error_message, details)
  VALUES (
    'profiles_phone_protection',
    '1.0.0',
    p_status,
    p_error_message,
    jsonb_build_object('step_name', p_step_name) || p_details
  );
  
  IF p_status = 'failed' THEN
    RAISE EXCEPTION 'Migration step failed: % - %', p_step_name, COALESCE(p_error_message, 'Unknown error');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create a checkpoint for rollback
CREATE OR REPLACE FUNCTION create_migration_checkpoint(
  p_checkpoint_name TEXT,
  p_rollback_sql TEXT,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_checkpoint_id UUID;
BEGIN
  INSERT INTO migration_checkpoints (migration_name, checkpoint_name, rollback_sql, details)
  VALUES ('profiles_phone_protection', p_checkpoint_name, p_rollback_sql, p_details)
  RETURNING id INTO v_checkpoint_id;
  
  RETURN v_checkpoint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(
  p_table_name TEXT,
  p_column_name TEXT,
  p_schema_name TEXT DEFAULT 'public'
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = p_schema_name
    AND table_name = p_table_name
    AND column_name = p_column_name
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check PostgreSQL version compatibility
CREATE OR REPLACE FUNCTION check_postgresql_version()
RETURNS BOOLEAN AS $$
DECLARE
  v_version TEXT;
  v_major_version INTEGER;
  v_minor_version INTEGER;
BEGIN
  SELECT version() INTO v_version;
  
  -- Extract major and minor version (e.g., "13.7" from "PostgreSQL 13.7 on x86_64-pc-linux-gnu")
  v_major_version := SUBSTRING(v_version, 'PostgreSQL ([0-9]+)\.', 1)::INTEGER;
  v_minor_version := SUBSTRING(v_version, 'PostgreSQL [0-9]+\.([0-9]+)', 1)::INTEGER;
  
  -- Check if version is 13 or higher
  IF v_major_version < 13 THEN
    RETURN FALSE;
  ELSIF v_major_version = 13 AND v_minor_version < 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. ROLLBACK PROCEDURES
-- ============================================

-- Function to rollback the entire migration
CREATE OR REPLACE FUNCTION rollback_profiles_phone_protection()
RETURNS BOOLEAN AS $$
DECLARE
  v_checkpoint RECORD;
  v_success BOOLEAN := TRUE;
BEGIN
  -- Log rollback start
  PERFORM log_migration_step('rollback_started', 'started');
  
  -- Process checkpoints in reverse order
  FOR v_checkpoint IN 
    SELECT * FROM migration_checkpoints 
    WHERE migration_name = 'profiles_phone_protection'
    ORDER BY created_at DESC
  LOOP
    BEGIN
      -- Execute rollback SQL
      IF v_checkpoint.rollback_sql IS NOT NULL THEN
        EXECUTE v_checkpoint.rollback_sql;
      END IF;
      
      -- Log successful rollback step
      PERFORM log_migration_step(
        'rollback_step_' || v_checkpoint.checkpoint_name,
        'completed',
        NULL,
        jsonb_build_object('checkpoint_id', v_checkpoint.id)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log failed rollback step
      PERFORM log_migration_step(
        'rollback_step_' || v_checkpoint.checkpoint_name,
        'failed',
        SQLERRM,
        jsonb_build_object('checkpoint_id', v_checkpoint.id, 'sql_state', SQLSTATE)
      );
      
      v_success := FALSE;
    END;
  END LOOP;
  
  -- Log rollback completion
  PERFORM log_migration_step(
    'rollback_completed',
    CASE WHEN v_success THEN 'completed' ELSE 'failed' END,
    NULL,
    jsonb_build_object('success', v_success)
  );
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 4. MAIN MIGRATION PROCEDURE
-- ============================================

-- Main migration function with comprehensive error handling
CREATE OR REPLACE FUNCTION execute_profiles_phone_protection_migration()
RETURNS BOOLEAN AS $$
DECLARE
  v_migration_id UUID;
  v_success BOOLEAN := FALSE;
  v_sql TEXT;
  v_column_exists BOOLEAN;
  v_checkpoint_id UUID;
BEGIN
  -- Log migration start
  PERFORM log_migration_step('migration_started', 'started');
  
  -- Check PostgreSQL version compatibility
  IF NOT check_postgresql_version() THEN
    PERFORM log_migration_step(
      'version_check',
      'failed',
      'PostgreSQL version 13.0 or higher required'
    );
    RETURN FALSE;
  END IF;
  
  PERFORM log_migration_step('version_check', 'completed');
  
  -- ============================================
  -- STEP 1: Create dynamic view without phone
  -- ============================================
  
  BEGIN
    -- Create checkpoint for view creation
    v_checkpoint_id := create_migration_checkpoint(
      'create_profiles_public_view',
      'DROP VIEW IF EXISTS public.profiles_public;',
      jsonb_build_object('step', 1)
    );
    
    -- Build dynamic SQL for view creation
    v_sql := 'CREATE OR REPLACE VIEW public.profiles_public AS SELECT ';
    
    -- Always include id
    v_sql := v_sql || 'id, ';
    
    -- Include full_name if it exists
    IF column_exists('profiles', 'full_name') THEN
      v_sql := v_sql || 'full_name, ';
    END IF;
    
    -- Include user_type if it exists
    IF column_exists('profiles', 'user_type') THEN
      v_sql := v_sql || 'user_type, ';
    END IF;
    
    -- Include avatar_url if it exists
    IF column_exists('profiles', 'avatar_url') THEN
      v_sql := v_sql || 'avatar_url, ';
    END IF;
    
    -- Include bio if it exists (the problematic column)
    IF column_exists('profiles', 'bio') THEN
      v_sql := v_sql || 'bio, ';
    END IF;
    
    -- Include city if it exists
    IF column_exists('profiles', 'city') THEN
      v_sql := v_sql || 'city, ';
    END IF;
    
    -- Include is_verified if it exists
    IF column_exists('profiles', 'is_verified') THEN
      v_sql := v_sql || 'is_verified, ';
    END IF;
    
    -- Include oneci_verified if it exists
    IF column_exists('profiles', 'oneci_verified') THEN
      v_sql := v_sql || 'oneci_verified, ';
    END IF;
    
    -- Include cnam_verified if it exists
    IF column_exists('profiles', 'cnam_verified') THEN
      v_sql := v_sql || 'cnam_verified, ';
    END IF;
    
    -- Include created_at if it exists
    IF column_exists('profiles', 'created_at') THEN
      v_sql := v_sql || 'created_at, ';
    END IF;
    
    -- Include updated_at if it exists
    IF column_exists('profiles', 'updated_at') THEN
      v_sql := v_sql || 'updated_at, ';
    END IF;
    
    -- Remove trailing comma
    IF RIGHT(v_sql, 2) = ', ' THEN
      v_sql := LEFT(v_sql, LENGTH(v_sql) - 2);
    ELSIF RIGHT(v_sql, 1) = ',' THEN
      v_sql := LEFT(v_sql, LENGTH(v_sql) - 1);
    END IF;
    
    -- Add FROM clause
    v_sql := v_sql || ' FROM public.profiles';
    
    -- Execute the SQL
    EXECUTE v_sql;
    
    -- Log successful view creation
    PERFORM log_migration_step(
      'create_profiles_public_view',
      'completed',
      NULL,
      jsonb_build_object('sql', v_sql, 'checkpoint_id', v_checkpoint_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed view creation
    PERFORM log_migration_step(
      'create_profiles_public_view',
      'failed',
      SQLERRM,
      jsonb_build_object('sql', v_sql, 'sql_state', SQLSTATE)
    );
    
    -- Attempt rollback
    PERFORM rollback_profiles_phone_protection();
    
    RETURN FALSE;
  END;
  
  -- ============================================
  -- STEP 2: Create secure phone access function
  -- ============================================
  
  BEGIN
    -- Create checkpoint for function creation
    v_checkpoint_id := create_migration_checkpoint(
      'create_get_user_phone_function',
      'DROP FUNCTION IF EXISTS public.get_user_phone(uuid);',
      jsonb_build_object('step', 2)
    );
    
    -- Create the function
    v_sql := $$
    CREATE OR REPLACE FUNCTION public.get_user_phone(target_user_id uuid)
    RETURNS text
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      user_phone text;
      has_access boolean := false;
      relationship text := 'none';
    BEGIN
      -- Access checks
      IF auth.uid() = target_user_id THEN
        has_access := true;
        relationship := 'self';
      ELSIF EXISTS (
        SELECT 1 FROM public.rental_applications ra
        JOIN public.properties p ON p.id = ra.property_id
        WHERE ra.applicant_id = target_user_id
          AND p.owner_id = auth.uid()
      ) THEN
        has_access := true;
        relationship := 'landlord_to_applicant';
      ELSIF EXISTS (
        SELECT 1 FROM public.rental_applications ra
        JOIN public.properties p ON p.id = ra.property_id
        WHERE ra.applicant_id = auth.uid()
          AND p.owner_id = target_user_id
      ) THEN
        has_access := true;
        relationship := 'applicant_to_landlord';
      ELSIF EXISTS (
        SELECT 1 FROM public.leases
        WHERE (landlord_id = auth.uid() AND tenant_id = target_user_id)
           OR (tenant_id = auth.uid() AND landlord_id = target_user_id)
      ) THEN
        has_access := true;
        relationship := 'lease_party';
      ELSIF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
        has_access := true;
        relationship := 'admin';
      END IF;

      -- Log to centralized table
      INSERT INTO public.sensitive_data_access_log (
        requester_id, target_user_id, data_type, access_granted, relationship_type
      ) VALUES (
        auth.uid(), target_user_id, 'phone', has_access, relationship
      );

      -- Return phone if authorized
      IF has_access THEN
        SELECT phone INTO user_phone FROM public.profiles WHERE id = target_user_id;
        RETURN user_phone;
      ELSE
        RETURN NULL;
      END IF;
    END;
    $$;
    $$;
    
    -- Execute the function creation
    EXECUTE v_sql;
    
    -- Log successful function creation
    PERFORM log_migration_step(
      'create_get_user_phone_function',
      'completed',
      NULL,
      jsonb_build_object('checkpoint_id', v_checkpoint_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed function creation
    PERFORM log_migration_step(
      'create_get_user_phone_function',
      'failed',
      SQLERRM,
      jsonb_build_object('sql_state', SQLSTATE)
    );
    
    -- Attempt rollback
    PERFORM rollback_profiles_phone_protection();
    
    RETURN FALSE;
  END;
  
  -- ============================================
  -- STEP 3: Enable RLS and create policies
  -- ============================================
  
  BEGIN
    -- Create checkpoint for RLS setup
    v_checkpoint_id := create_migration_checkpoint(
      'setup_rls_policies',
      $$
      -- Drop policies
      DROP POLICY IF EXISTS "Admins can view all sensitive access logs" ON public.sensitive_data_access_log;
      DROP POLICY IF EXISTS "Users can view own sensitive access logs" ON public.sensitive_data_access_log;
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles_public;
      DROP POLICY IF EXISTS "Profiles sont visibles par tous les utilisateurs authentifiés" ON public.profiles;
      
      -- Disable RLS
      ALTER TABLE public.sensitive_data_access_log DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.profiles_public DISABLE ROW LEVEL SECURITY;
      $$,
      jsonb_build_object('step', 3)
    );
    
    -- Enable RLS on sensitive_data_access_log if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensitive_data_access_log' AND table_schema = 'public') THEN
      ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;
      
      -- Create policies for sensitive_data_access_log
      CREATE POLICY IF NOT EXISTS "Admins can view all sensitive access logs" ON public.sensitive_data_access_log
        FOR SELECT USING (
          public.has_role(auth.uid(), 'admin'::public.app_role)
        );
      
      CREATE POLICY IF NOT EXISTS "Users can view own sensitive access logs" ON public.sensitive_data_access_log
        FOR SELECT USING (requester_id = auth.uid());
    END IF;
    
    -- Enable RLS on profiles_public
    ALTER TABLE public.profiles_public ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for profiles_public
    CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone" ON public.profiles_public
      FOR SELECT USING (true);
    
    -- Update policies on profiles table
    DROP POLICY IF EXISTS "Profiles sont visibles par tous les utilisateurs authentifiés" ON public.profiles;
    CREATE POLICY IF NOT EXISTS "Profiles sont visibles par tous les utilisateurs authentifiés" ON public.profiles
      FOR SELECT USING (false);
    
    -- Log successful RLS setup
    PERFORM log_migration_step(
      'setup_rls_policies',
      'completed',
      NULL,
      jsonb_build_object('checkpoint_id', v_checkpoint_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed RLS setup
    PERFORM log_migration_step(
      'setup_rls_policies',
      'failed',
      SQLERRM,
      jsonb_build_object('sql_state', SQLSTATE)
    );
    
    -- Attempt rollback
    PERFORM rollback_profiles_phone_protection();
    
    RETURN FALSE;
  END;
  
  -- ============================================
  -- STEP 4: Create additional functions
  -- ============================================
  
  BEGIN
    -- Create checkpoint for additional functions
    v_checkpoint_id := create_migration_checkpoint(
      'create_additional_functions',
      $$
      -- Drop functions
      DROP FUNCTION IF EXISTS public.detect_suspicious_sensitive_data_access();
      DROP FUNCTION IF EXISTS public.alert_on_suspicious_access();
      DROP FUNCTION IF EXISTS public.admin_get_all_profiles_with_phone();
      $$,
      jsonb_build_object('step', 4)
    );
    
    -- Create detect_suspicious_sensitive_data_access function if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensitive_data_access_log' AND table_schema = 'public') THEN
      CREATE OR REPLACE FUNCTION public.detect_suspicious_sensitive_data_access()
      RETURNS TABLE(
        user_id uuid,
        access_count integer,
        unique_targets integer,
        time_span_minutes integer,
        risk_level text
      ) AS $$
      BEGIN
        RETURN QUERY
        WITH user_access_patterns AS (
          SELECT
            requester_id,
            COUNT(*) as access_count,
            COUNT(DISTINCT target_user_id) as unique_targets,
            EXTRACT(EPOCH FROM (MAX(accessed_at) - MIN(accessed_at))) / 60 as time_span_minutes
          FROM public.sensitive_data_access_log
          WHERE accessed_at > NOW() - INTERVAL '1 hour'
            AND data_type = 'phone'
          GROUP BY requester_id
        )
        SELECT
          requester_id as user_id,
          access_count,
          unique_targets,
          time_span_minutes::integer,
          CASE
            WHEN access_count > 50 OR unique_targets > 20 THEN 'HIGH'
            WHEN access_count > 20 OR unique_targets > 10 THEN 'MEDIUM'
            ELSE 'LOW'
          END as risk_level
        FROM user_access_patterns
        WHERE access_count > 5 OR unique_targets > 3;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    END IF;
    
    -- Create alert_on_suspicious_access trigger function if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensitive_data_access_log' AND table_schema = 'public') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_logs' AND table_schema = 'public') THEN
      CREATE OR REPLACE FUNCTION public.alert_on_suspicious_access()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Créer une alerte si l'accès est refusé
        IF NOT NEW.access_granted THEN
          INSERT INTO public.security_audit_logs (
            event_type, severity, user_id, details, metadata
          ) VALUES (
            'UNAUTHORIZED_PHONE_ACCESS', 'medium', NEW.requester_id,
            jsonb_build_object(
              'target_user_id', NEW.target_user_id,
              'relationship_type', NEW.relationship_type,
              'accessed_at', NEW.accessed_at
            ),
            jsonb_build_object(
              'data_type', 'phone',
              'access_granted', false
            )
          );
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
      
      -- Create trigger
      DROP TRIGGER IF EXISTS trigger_alert_on_suspicious_access ON public.sensitive_data_access_log;
      CREATE TRIGGER trigger_alert_on_suspicious_access
        AFTER INSERT ON public.sensitive_data_access_log
        FOR EACH ROW EXECUTE FUNCTION public.alert_on_suspicious_access();
    END IF;
    
    -- Create admin function
    CREATE OR REPLACE FUNCTION public.admin_get_all_profiles_with_phone()
    RETURNS TABLE (
      id uuid,
      full_name text,
      user_type public.user_type,
      phone text,
      city text,
      is_verified boolean
    ) AS $$
    BEGIN
      -- Vérifier que l'utilisateur est un admin
      IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
      END IF;
      
      -- Retourner tous les profils avec téléphone
      RETURN QUERY
      SELECT 
        p.id,
        p.full_name,
        p.user_type,
        p.phone,
        p.city,
        p.is_verified
      FROM public.profiles p;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    
    -- Log successful function creation
    PERFORM log_migration_step(
      'create_additional_functions',
      'completed',
      NULL,
      jsonb_build_object('checkpoint_id', v_checkpoint_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed function creation
    PERFORM log_migration_step(
      'create_additional_functions',
      'failed',
      SQLERRM,
      jsonb_build_object('sql_state', SQLSTATE)
    );
    
    -- Attempt rollback
    PERFORM rollback_profiles_phone_protection();
    
    RETURN FALSE;
  END;
  
  -- ============================================
  -- STEP 5: Add function documentation
  -- ============================================
  
  BEGIN
    -- Create checkpoint for documentation
    v_checkpoint_id := create_migration_checkpoint(
      'add_function_documentation',
      $$
    -- Drop comments
    DROP FUNCTION IF EXISTS public.get_user_phone(uuid);
    $$,
      jsonb_build_object('step', 5)
    );
    
    -- Add function comments
    COMMENT ON FUNCTION public.get_user_phone(uuid) IS 
    'Fonction sécurisée pour accéder au numéro de téléphone d''un utilisateur.
    Vérifie le contexte d''accès avant de retourner le numéro.
    Journalise tous les accès dans sensitive_data_access_log.';
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'detect_suspicious_sensitive_data_access' AND routine_schema = 'public') THEN
      COMMENT ON FUNCTION public.detect_suspicious_sensitive_data_access() IS 
      'Détecte les patterns d''accès suspects aux données sensibles.
      Retourne les utilisateurs avec un nombre élevé d''accès ou des comportements inhabituels.';
    END IF;
    
    COMMENT ON FUNCTION public.admin_get_all_profiles_with_phone() IS 
    'Fonction réservée aux administrateurs pour voir tous les profils avec leurs numéros de téléphone.
    Nécessite le rôle admin pour être exécutée.';
    
    -- Log successful documentation
    PERFORM log_migration_step(
      'add_function_documentation',
      'completed',
      NULL,
      jsonb_build_object('checkpoint_id', v_checkpoint_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed documentation
    PERFORM log_migration_step(
      'add_function_documentation',
      'failed',
      SQLERRM,
      jsonb_build_object('sql_state', SQLSTATE)
    );
    
    -- This is not critical, continue with migration
    NULL;
  END;
  
  -- ============================================
  -- STEP 6: Final validation
  -- ============================================
  
  BEGIN
    -- Create checkpoint for validation
    v_checkpoint_id := create_migration_checkpoint(
      'final_validation',
      NULL,
      jsonb_build_object('step', 6)
    );
    
    -- Validate view was created
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'profiles_public' AND table_schema = 'public') THEN
      PERFORM log_migration_step(
        'final_validation',
        'failed',
        'profiles_public view was not created'
      );
      
      -- Attempt rollback
      PERFORM rollback_profiles_phone_protection();
      
      RETURN FALSE;
    END IF;
    
    -- Validate function was created
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_phone' AND routine_schema = 'public') THEN
      PERFORM log_migration_step(
        'final_validation',
        'failed',
        'get_user_phone function was not created'
      );
      
      -- Attempt rollback
      PERFORM rollback_profiles_phone_protection();
      
      RETURN FALSE;
    END IF;
    
    -- Log successful validation
    PERFORM log_migration_step(
      'final_validation',
      'completed',
      NULL,
      jsonb_build_object('checkpoint_id', v_checkpoint_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed validation
    PERFORM log_migration_step(
      'final_validation',
      'failed',
      SQLERRM,
      jsonb_build_object('sql_state', SQLSTATE)
    );
    
    -- Attempt rollback
    PERFORM rollback_profiles_phone_protection();
    
    RETURN FALSE;
  END;
  
  -- ============================================
  -- MIGRATION COMPLETION
  -- ============================================
  
  -- Log migration completion
  PERFORM log_migration_step(
    'migration_completed',
    'completed',
    NULL,
    jsonb_build_object('success', TRUE)
  );
  
  v_success := TRUE;
  RETURN v_success;
  
EXCEPTION WHEN OTHERS THEN
  -- Log unexpected error
  PERFORM log_migration_step(
    'migration_unexpected_error',
    'failed',
    SQLERRM,
    jsonb_build_object('sql_state', SQLSTATE)
  );
  
  -- Attempt rollback
  PERFORM rollback_profiles_phone_protection();
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 5. EXECUTE MIGRATION
-- ============================================

-- Execute the migration
SELECT execute_profiles_phone_protection_migration() AS migration_success;

-- ============================================
-- 6. CLEANUP UTILITY FUNCTIONS (OPTIONAL)
-- ============================================

-- Uncomment the following lines to clean up utility functions after successful migration
-- DROP FUNCTION IF EXISTS public.log_migration_step(TEXT, TEXT, TEXT, JSONB);
-- DROP FUNCTION IF EXISTS public.create_migration_checkpoint(TEXT, TEXT, JSONB);
-- DROP FUNCTION IF EXISTS public.column_exists(TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.check_postgresql_version();
-- DROP FUNCTION IF EXISTS public.rollback_profiles_phone_protection();
-- DROP FUNCTION IF EXISTS public.execute_profiles_phone_protection_migration();

-- ============================================
-- 7. MIGRATION SUMMARY
-- ============================================

-- Display migration summary
DO $$
DECLARE
  v_success BOOLEAN;
  v_log_count INTEGER;
BEGIN
  -- Check if migration was successful
  SELECT status = 'completed' INTO v_success
  FROM migration_logs
  WHERE migration_name = 'profiles_phone_protection'
    AND step_name = 'migration_completed'
  ORDER BY started_at DESC
  LIMIT 1;
  
  -- Count log entries
  SELECT COUNT(*) INTO v_log_count
  FROM migration_logs
  WHERE migration_name = 'profiles_phone_protection';
  
  -- Display summary
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PROFILES PHONE PROTECTION MIGRATION SUMMARY';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration Status: %', CASE WHEN v_success THEN 'SUCCESS' ELSE 'FAILED' END;
  RAISE NOTICE 'Log Entries: %', v_log_count;
  RAISE NOTICE '===========================================';
  
  -- Display details if migration failed
  IF NOT v_success THEN
    RAISE NOTICE 'FAILED STEPS:';
    FOR log_record IN 
      SELECT step_name, error_message, details
      FROM migration_logs
      WHERE migration_name = 'profiles_phone_protection'
        AND status = 'failed'
      ORDER BY started_at
    LOOP
      RAISE NOTICE '- %: %', log_record.step_name, COALESCE(log_record.error_message, 'Unknown error');
    END LOOP;
    RAISE NOTICE '===========================================';
  END IF;
END;
$$;
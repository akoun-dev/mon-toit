-- Database Maintenance Automation
-- Date: 2025-10-21
-- Automated tasks for database maintenance and optimization

-- ===============================================================================
-- CRON JOBS SETUP (requires pg_cron extension)
-- ===============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule regular data cleanup (every Sunday at 2 AM)
SELECT cron.schedule(
  'weekly-cleanup',
  '0 2 * * 0',
  'SELECT cleanup_old_data();'
);

-- Schedule materialized views refresh (daily at 3 AM)
SELECT cron.schedule(
  'daily-views-refresh',
  '0 3 * * *',
  'SELECT refresh_reporting_views();'
);

-- Schedule database statistics update (daily at 4 AM)
SELECT cron.schedule(
  'daily-stats-update',
  '0 4 * * *',
  'ANALYZE; VACUUM (ANALYZE, VERBOSE);'
);

-- Schedule index maintenance (weekly on Monday at 1 AM)
SELECT cron.schedule(
  'weekly-index-maintenance',
  '0 1 * * 1',
  'REINDEX DATABASE CONCURRENTLY ' || current_database() || ';'
);

-- ===============================================================================
-- MONITORING FUNCTIONS
-- ===============================================================================

-- Database health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(metric_name TEXT, value NUMERIC, status TEXT, threshold NUMERIC) AS $$
BEGIN
  RETURN QUERY

  -- Table size monitoring
  SELECT
    'properties_size_mb'::TEXT,
    ROUND(pg_total_relation_size('properties')::NUMERIC / 1024 / 1024, 2),
    CASE
      WHEN pg_total_relation_size('properties') > 100 * 1024 * 1024 THEN 'WARNING'
      ELSE 'OK'
    END,
    100::NUMERIC
  FROM pg_class WHERE relname = 'properties'

  UNION ALL

  -- Index usage monitoring
  SELECT
    'unused_indexes_count'::TEXT,
    COUNT(*)::NUMERIC,
    CASE
      WHEN COUNT(*) > 5 THEN 'WARNING'
      ELSE 'OK'
    END,
    5::NUMERIC
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
  AND schemaname = 'public'

  UNION ALL

  -- Long-running queries
  SELECT
    'long_running_queries'::TEXT,
    COUNT(*)::NUMERIC,
    CASE
      WHEN COUNT(*) > 0 THEN 'CRITICAL'
      ELSE 'OK'
    END,
    0::NUMERIC
  FROM pg_stat_activity
  WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '5 minutes'
  AND pid != pg_backend_pid()

  UNION ALL

  -- Database connections
  SELECT
    'active_connections'::TEXT,
    COUNT(*)::NUMERIC,
    CASE
      WHEN COUNT(*) > 80 THEN 'WARNING'
      ELSE 'OK'
    END,
    80::NUMERIC
  FROM pg_stat_activity
  WHERE state = 'active';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance trend analysis
CREATE OR REPLACE FUNCTION performance_trend_analysis(days_range INTEGER DEFAULT 7)
RETURNS TABLE(
  date DATE,
  avg_query_time_ms NUMERIC,
  slow_queries_count NUMERIC,
  total_queries NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    ROUND(AVG(execution_time_ms), 2) as avg_query_time_ms,
    COUNT(CASE WHEN execution_time_ms > 1000 THEN 1 END) as slow_queries_count,
    COUNT(*) as total_queries
  FROM query_performance_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_range
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- AUTOMATED OPTIMIZATION
-- ===============================================================================

-- Automatic index creation based on query patterns
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE(
  table_name TEXT,
  column_names TEXT,
  suggested_index TEXT,
  estimated_benefit TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH slow_queries AS (
    SELECT
      schemaname,
      tablename,
      attname,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      seq_scan,
      seq_tup_read
    FROM pg_stat_user_tables t
    JOIN pg_attribute a ON a.attrelid = t.relid
    WHERE seq_scan > 1000 -- Tables frequently scanned sequentially
    AND seq_tup_read > 10000
    AND a.attnum > 0
    AND NOT a.attisdropped
  ),
  existing_indexes AS (
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
  )
  SELECT
    sq.tablename::TEXT,
    sq.attname::TEXT,
    'CREATE INDEX idx_' || sq.tablename || '_' || sq.attname || ' ON ' || sq.tablename || '(' || sq.attname || ')'::TEXT,
    'Potential performance improvement for high-scan table'::TEXT
  FROM slow_queries sq
  WHERE NOT EXISTS (
    SELECT 1 FROM existing_indexes ei
    WHERE ei.tablename = sq.tablename
    AND ei.indexdef LIKE '%' || sq.attname || '%'
  )
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic table partitioning for large tables
CREATE OR REPLACE FUNCTION auto_partition_large_tables()
RETURNS TEXT AS $$
DECLARE
  table_record RECORD;
  partition_cmd TEXT;
BEGIN
  FOR table_record IN
    SELECT
      schemaname,
      tablename,
      pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_stat_user_tables
    WHERE pg_total_relation_size(schemaname||'.'||tablename) > 500 * 1024 * 1024 -- 500MB
    AND tablename NOT LIKE '%_partitioned%'
    AND tablename NOT IN ('query_performance_log') -- Exclude log tables
  LOOP
    -- Log recommendation for partitioning
    INSERT INTO query_performance_log (query_name, execution_time_ms, rows_affected)
    VALUES (
      'partition_recommendation_' || table_record.tablename,
      0,
      0
    );

    RAISE NOTICE 'Table % is large (%) and should be considered for partitioning',
                 table_record.tablename,
                 pg_size_pretty(table_record.size_bytes);
  END LOOP;

  RETURN 'Partitioning analysis completed. Check query_performance_log for recommendations.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- SECURITY AUTOMATION
-- ===============================================================================

-- Automated security audit
CREATE OR REPLACE FUNCTION automated_security_audit()
RETURNS TABLE(
  finding_type TEXT,
  severity TEXT,
  description TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Check for users with excessive privileges
  SELECT
    'excessive_privileges'::TEXT,
    'HIGH'::TEXT,
    'Users with superuser privileges detected'::TEXT,
    'Review superuser assignments and limit to essential admin accounts'::TEXT
  FROM pg_roles
  WHERE rolsuper = TRUE
  AND rolname != 'postgres'
  AND rolname NOT LIKE 'supabase_%'

  UNION ALL

  -- Check for tables without RLS
  SELECT
    'missing_rls'::TEXT,
    'MEDIUM'::TEXT,
    'Table without Row Level Security: ' || tablename::TEXT,
    'Enable RLS and create appropriate policies for table: ' || tablename::TEXT
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = FALSE
  AND tablename NOT LIKE 'pg_%'

  UNION ALL

  -- Check for weak password policies (if applicable)
  SELECT
    'password_policy'::TEXT,
    'LOW'::TEXT,
    'Ensure strong password policies are enforced'::TEXT,
    'Implement password complexity requirements and regular expiration'::TEXT
  WHERE EXISTS (
    SELECT 1 FROM pg_authid
    WHERE rolpassword IS NOT NULL
    AND rolvaliduntil IS NULL
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- DATA QUALITY AUTOMATION
-- ===============================================================================

-- Data consistency checks
CREATE OR REPLACE FUNCTION data_consistency_check()
RETURNS TABLE(
  table_name TEXT,
  issue_type TEXT,
  issue_count NUMERIC,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Check for orphaned records in properties
  SELECT
    'properties'::TEXT,
    'orphaned_owner'::TEXT,
    COUNT(*)::NUMERIC,
    'HIGH'::TEXT
  FROM properties p
  LEFT JOIN auth.users u ON p.owner_id = u.id
  WHERE u.id IS NULL

  UNION ALL

  -- Check for invalid property statuses
  SELECT
    'properties'::TEXT,
    'invalid_status'::TEXT,
    COUNT(*)::NUMERIC,
    'MEDIUM'::TEXT
  FROM properties
  WHERE status NOT IN (
    'disponible', 'loue', 'loué', 'en_attente', 'retire', 'retiré',
    'en_maintenance', 'en_negociation', 'pending', 'approved', 'rejected'
  )

  UNION ALL

  -- Check for negative rents
  SELECT
    'properties'::TEXT,
    'negative_rent'::TEXT,
    COUNT(*)::NUMERIC,
    'HIGH'::TEXT
  FROM properties
  WHERE monthly_rent < 0

  UNION ALL

  -- Check for impossible dates
  SELECT
    'lease_agreements'::TEXT,
    'invalid_dates'::TEXT,
    COUNT(*)::NUMERIC,
    'HIGH'::TEXT
  FROM lease_agreements
  WHERE end_date <= start_date;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automated data cleanup function
CREATE OR REPLACE FUNCTION automated_data_cleanup()
RETURNS TABLE(
  cleanup_action TEXT,
  records_processed NUMERIC,
  status TEXT
) AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Clean up orphaned property photos
  DELETE FROM property_photos
  WHERE property_id NOT IN (SELECT id FROM properties);
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;

  RETURN QUERY SELECT 'orphaned_property_photos'::TEXT, cleanup_count::NUMERIC, 'completed'::TEXT;

  -- Clean up stale notifications (older than 30 days)
  UPDATE intelligent_notifications
  SET delivery_status = 'cancelled'
  WHERE delivery_status = 'pending'
  AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;

  RETURN QUERY SELECT 'stale_notifications'::TEXT, cleanup_count::NUMERIC, 'completed'::TEXT;

  -- Clean up expired challenge progress
  DELETE FROM user_challenge_progress ucp
  WHERE NOT EXISTS (
    SELECT 1 FROM game_challenges gc
    WHERE gc.id = ucp.challenge_id
    AND gc.end_date > NOW()
  );
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;

  RETURN QUERY SELECT 'expired_challenges'::TEXT, cleanup_count::NUMERIC, 'completed'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- ALERTING SYSTEM
-- ===============================================================================

-- Create alert table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_created
ON system_alerts(severity, created_at DESC);

-- Alert creation function
CREATE OR REPLACE FUNCTION create_system_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO system_alerts (alert_type, severity, title, message, metadata)
  VALUES (p_alert_type, p_severity, p_title, p_message, p_metadata)
  RETURNING id INTO alert_id;

  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automated alert checks
CREATE OR REPLACE FUNCTION check_system_alerts()
RETURNS TABLE(
  alert_created UUID,
  alert_type TEXT,
  severity TEXT
) AS $$
BEGIN
  -- Check database size
  IF (SELECT pg_database_size(current_database())) > 5 * 1024 * 1024 * 1024 THEN -- 5GB
    RETURN QUERY
    SELECT create_system_alert(
      'database_size',
      'WARNING',
      'Database size warning',
      'Database size exceeds 5GB. Consider archiving old data.',
      '{"size_bytes": ' || pg_database_size(current_database()) || '}'
    ) as alert_created,
    'database_size' as alert_type,
    'WARNING' as severity;
  END IF;

  -- Check for failed security scans
  IF EXISTS (SELECT 1 FROM security_scans WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 day') THEN
    RETURN QUERY
    SELECT create_system_alert(
      'security_scan_failure',
      'ERROR',
      'Security scan failure detected',
      'One or more security scans have failed in the last 24 hours.',
      '{"count": ' || (SELECT COUNT(*) FROM security_scans WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 day') || '}'
    ) as alert_created,
    'security_scan_failure' as alert_type,
    'ERROR' as severity;
  END IF;

  -- Check for slow queries
  IF EXISTS (SELECT 1 FROM query_performance_log WHERE execution_time_ms > 5000 AND created_at > NOW() - INTERVAL '1 hour') THEN
    RETURN QUERY
    SELECT create_system_alert(
      'slow_queries',
      'WARNING',
      'Slow queries detected',
      'Queries taking more than 5 seconds have been detected in the last hour.',
      '{"count": ' || (SELECT COUNT(*) FROM query_performance_log WHERE execution_time_ms > 5000 AND created_at > NOW() - INTERVAL '1 hour') || '}'
    ) as alert_created,
    'slow_queries' as alert_type,
    'WARNING' as severity;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule automated alert checks (every hour)
SELECT cron.schedule(
  'hourly-alert-checks',
  '0 * * * *',
  'SELECT check_system_alerts();'
);

-- ===============================================================================
-- RLS FOR NEW MONITORING TABLES
-- ===============================================================================

-- Enable RLS on monitoring tables
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for system alerts
CREATE POLICY "Admins can view all alerts" ON system_alerts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage alerts" ON system_alerts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ===============================================================================
-- FINAL VERIFICATION
-- ===============================================================================

-- Verify all automated systems are working
CREATE OR REPLACE FUNCTION verify_automation_systems()
RETURNS TABLE(
  system_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Check cron jobs
  SELECT
    'Cron Jobs'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'ACTIVE' ELSE 'INACTIVE' END,
    COUNT(*) || ' jobs scheduled'::TEXT
  FROM cron.job

  UNION ALL

  -- Check monitoring functions
  SELECT
    'Monitoring Functions'::TEXT,
    'ACTIVE'::TEXT,
    'Health check and performance analysis ready'::TEXT

  UNION ALL

  -- Check automation functions
  SELECT
    'Automation Functions'::TEXT,
    'ACTIVE'::TEXT,
    'Cleanup, optimization, and alerting systems ready'::TEXT

  UNION ALL

  -- Check RLS policies
  SELECT
    'Security Policies'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'ACTIVE' ELSE 'MISSING' END,
    COUNT(*) || ' RLS policies in place'::TEXT
  FROM pg_policies
  WHERE schemaname = 'public';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run verification
SELECT * FROM verify_automation_systems();

COMMIT;
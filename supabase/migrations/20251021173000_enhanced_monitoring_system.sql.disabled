-- Enhanced Monitoring System
-- Date: 2025-10-21
-- Implement comprehensive performance monitoring and alerting

-- ===============================================================================
-- 1) QUERY PERFORMANCE LOGGING
-- ===============================================================================

-- Query performance log table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  query_hash TEXT, -- Hash of the query for grouping similar queries
  parameters JSONB DEFAULT '{}', -- Query parameters for analysis
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance log
CREATE INDEX IF NOT EXISTS idx_query_performance_log_created_at
ON query_performance_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_log_query_name
ON query_performance_log(query_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_log_execution_time
ON query_performance_log(execution_time_ms DESC)
WHERE execution_time_ms > 1000; -- Partial index for slow queries

CREATE INDEX IF NOT EXISTS idx_query_performance_log_query_hash
ON query_performance_log(query_hash, created_at DESC);

-- ===============================================================================
-- 2) SYSTEM HEALTH METRICS
-- ===============================================================================

-- System health metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_name_recorded
ON system_health_metrics(metric_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_status
ON system_health_metrics(status, recorded_at DESC)
WHERE status != 'normal';

-- ===============================================================================
-- 3) PERFORMANCE MONITORING FUNCTIONS
-- ===============================================================================

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance(
  p_query_name TEXT,
  p_execution_time_ms INTEGER,
  p_rows_affected INTEGER DEFAULT NULL,
  p_parameters JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_query_id UUID;
  v_query_hash TEXT;
BEGIN
  -- Generate query hash (simple version - in production use more sophisticated hashing)
  v_query_hash := md5(p_query_name || COALESCE(p_user_id::TEXT, '') || COALESCE(p_parameters::TEXT, ''));
  
  -- Insert performance record
  INSERT INTO query_performance_log (
    query_name, execution_time_ms, rows_affected, query_hash, parameters, user_id
  ) VALUES (
    p_query_name, p_execution_time_ms, p_rows_affected, v_query_hash, p_parameters, p_user_id
  ) RETURNING id INTO v_query_id;
  
  -- Log slow queries to security audit
  IF p_execution_time_ms > 1000 THEN
    INSERT INTO security_audit_logs (
      event_type, severity, user_id, details, metadata
    ) VALUES (
      'SLOW_QUERY', 'medium', p_user_id,
      jsonb_build_object(
        'query_name', p_query_name,
        'execution_time_ms', p_execution_time_ms,
        'rows_affected', p_rows_affected
      ),
      jsonb_build_object(
        'query_hash', v_query_hash,
        'parameters', p_parameters
      )
    );
  END IF;
  
  RETURN v_query_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to collect system health metrics
CREATE OR REPLACE FUNCTION collect_system_health_metrics()
RETURNS void AS $$
DECLARE
  v_database_size BIGINT;
  v_active_connections INTEGER;
  v_slow_queries_count INTEGER;
  v_index_usage_ratio NUMERIC;
  v_table_bloat_ratio NUMERIC;
BEGIN
  -- Get database size
  SELECT pg_database_size(current_database()) INTO v_database_size;
  
  -- Get active connections
  SELECT COUNT(*) INTO v_active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Get slow queries count (last hour)
  SELECT COUNT(*) INTO v_slow_queries_count
  FROM query_performance_log
  WHERE execution_time_ms > 1000
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Calculate index usage ratio
  SELECT 
    CASE 
      WHEN SUM(idx_scan) > 0 THEN 
        ROUND(SUM(idx_scan)::NUMERIC / (SUM(seq_scan) + SUM(idx_scan)) * 100, 2)
      ELSE 0 
    END INTO v_index_usage_ratio
  FROM pg_stat_user_tables;
  
  -- Insert metrics
  INSERT INTO system_health_metrics (metric_name, metric_value, metric_unit, threshold_warning, threshold_critical) VALUES
    ('database_size_mb', ROUND(v_database_size / 1024 / 1024, 2), 'MB', 5000, 10000),
    ('active_connections', v_active_connections, 'count', 80, 100),
    ('slow_queries_hourly', v_slow_queries_count, 'count', 10, 50),
    ('index_usage_ratio', v_index_usage_ratio, '%', 70, 50);
  
  -- Update status based on thresholds
  UPDATE system_health_metrics
  SET status = CASE
    WHEN metric_value >= threshold_critical THEN 'critical'
    WHEN metric_value >= threshold_warning THEN 'warning'
    ELSE 'normal'
  END
  WHERE recorded_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(p_timeframe_hours INTEGER DEFAULT 24)
RETURNS TABLE(
  metric_name TEXT,
  value NUMERIC,
  status TEXT,
  trend TEXT,
  details TEXT
) AS $$
DECLARE
  v_timeframe TIMESTAMPTZ := NOW() - INTERVAL '1 hour' * p_timeframe_hours;
BEGIN
  -- Query performance metrics
  RETURN QUERY
  SELECT
    'avg_query_time_ms'::TEXT,
    ROUND(AVG(execution_time_ms), 2)::NUMERIC,
    CASE 
      WHEN AVG(execution_time_ms) > 1000 THEN 'critical'
      WHEN AVG(execution_time_ms) > 500 THEN 'warning'
      ELSE 'normal'
    END::TEXT,
    CASE 
      WHEN LAG(AVG(execution_time_ms)) OVER (ORDER BY DATE_TRUNC('hour', created_at)) < AVG(execution_time_ms) THEN 'increasing'
      WHEN LAG(AVG(execution_time_ms)) OVER (ORDER BY DATE_TRUNC('hour', created_at)) > AVG(execution_time_ms) THEN 'decreasing'
      ELSE 'stable'
    END::TEXT,
    'Average query execution time in milliseconds'::TEXT
  FROM query_performance_log
  WHERE created_at > v_timeframe
  
  UNION ALL
  
  -- Slow queries count
  SELECT
    'slow_queries_count'::TEXT,
    COUNT(*)::NUMERIC,
    CASE 
      WHEN COUNT(*) > 50 THEN 'critical'
      WHEN COUNT(*) > 10 THEN 'warning'
      ELSE 'normal'
    END::TEXT,
    'N/A'::TEXT,
    'Number of queries taking more than 1 second'::TEXT
  FROM query_performance_log
  WHERE execution_time_ms > 1000
    AND created_at > v_timeframe
  
  UNION ALL
  
  -- Most frequent slow queries
  SELECT
    'top_slow_query'::TEXT,
    MAX(execution_time_ms)::NUMERIC,
    'critical'::TEXT,
    'N/A'::TEXT,
    'Slowest query: ' || query_name::TEXT
  FROM query_performance_log
  WHERE execution_time_ms > 1000
    AND created_at > v_timeframe
  GROUP BY query_name
  ORDER BY MAX(execution_time_ms) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- 4) AUTOMATED ALERTING
-- ===============================================================================

-- Alert table
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_name TEXT,
  current_value NUMERIC,
  threshold_value NUMERIC,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity_created
ON performance_alerts(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_unresolved
ON performance_alerts(resolved, created_at DESC)
WHERE resolved = FALSE;

-- Function to check for performance alerts
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE(
  alert_created UUID,
  alert_type TEXT,
  severity TEXT
) AS $$
DECLARE
  v_avg_query_time NUMERIC;
  v_slow_queries_count INTEGER;
  v_database_size BIGINT;
  v_active_connections INTEGER;
BEGIN
  -- Get current metrics
  SELECT AVG(execution_time_ms) INTO v_avg_query_time
  FROM query_performance_log
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  SELECT COUNT(*) INTO v_slow_queries_count
  FROM query_performance_log
  WHERE execution_time_ms > 1000
    AND created_at > NOW() - INTERVAL '1 hour';
  
  SELECT pg_database_size(current_database()) INTO v_database_size;
  
  SELECT COUNT(*) INTO v_active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Check for slow query alert
  IF v_avg_query_time > 1000 THEN
    RETURN QUERY
    SELECT create_performance_alert(
      'slow_queries',
      'critical',
      'Critical: Average query time exceeded threshold',
      format('Average query time is %s ms (threshold: 1000 ms)', v_avg_query_time),
      'avg_query_time_ms',
      v_avg_query_time,
      1000
    ) as alert_created,
    'slow_queries' as alert_type,
    'critical' as severity;
  END IF;
  
  -- Check for database size alert
  IF v_database_size > 10 * 1024 * 1024 * 1024 THEN -- 10GB
    RETURN QUERY
    SELECT create_performance_alert(
      'database_size',
      'warning',
      'Database size approaching limit',
      format('Database size is %s GB (threshold: 10 GB)', ROUND(v_database_size / 1024 / 1024 / 1024, 2)),
      'database_size_gb',
      ROUND(v_database_size / 1024 / 1024 / 1024, 2),
      10
    ) as alert_created,
    'database_size' as alert_type,
    'warning' as severity;
  END IF;
  
  -- Check for connection count alert
  IF v_active_connections > 80 THEN
    RETURN QUERY
    SELECT create_performance_alert(
      'connection_count',
      'warning',
      'High number of active connections',
      format('Active connections: %s (threshold: 80)', v_active_connections),
      'active_connections',
      v_active_connections,
      80
    ) as alert_created,
    'connection_count' as alert_type,
    'warning' as severity;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create performance alert
CREATE OR REPLACE FUNCTION create_performance_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metric_name TEXT DEFAULT NULL,
  p_current_value NUMERIC DEFAULT NULL,
  p_threshold_value NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO performance_alerts (
    alert_type, severity, title, message, metric_name, 
    current_value, threshold_value, metadata
  ) VALUES (
    p_alert_type, p_severity, p_title, p_message, p_metric_name,
    p_current_value, p_threshold_value, p_metadata
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- 5) TRIGGER FOR AUTOMATIC QUERY LOGGING
-- ===============================================================================

-- Trigger function to automatically log slow queries
CREATE OR REPLACE FUNCTION auto_log_slow_queries()
RETURNS TRIGGER AS $$
BEGIN
  -- This would typically be called from application code
  -- with actual query execution time
  -- For demonstration, we'll log queries that take more than 500ms
  IF NEW.execution_time_ms > 500 THEN
    PERFORM log_query_performance(
      TG_NAME,
      NEW.execution_time_ms,
      NEW.rows_affected,
      NEW.parameters,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be created on application-specific query log tables
-- CREATE TRIGGER trigger_auto_log_slow_queries
--   AFTER INSERT ON application_query_logs
--   FOR EACH ROW EXECUTE FUNCTION auto_log_slow_queries();

-- ===============================================================================
-- 6) SCHEDULED MONITORING TASKS
-- ===============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule health metrics collection (every 5 minutes)
SELECT cron.schedule(
  'collect-health-metrics',
  '*/5 * * * *',
  'SELECT collect_system_health_metrics();'
);

-- Schedule performance alert checks (every 10 minutes)
SELECT cron.schedule(
  'check-performance-alerts',
  '*/10 * * * *',
  'SELECT check_performance_alerts();'
);

-- Schedule cleanup of old performance logs (daily at 2 AM)
SELECT cron.schedule(
  'cleanup-performance-logs',
  '0 2 * * *',
  $$
    DELETE FROM query_performance_log 
    WHERE created_at < NOW() - INTERVAL '30 days';
  $$
);

-- ===============================================================================
-- 7) VALIDATION FUNCTIONS
-- ===============================================================================

-- Function to validate monitoring system
CREATE OR REPLACE FUNCTION validate_monitoring_system()
RETURNS TABLE(
  component_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Check performance log table
  SELECT
    'query_performance_log'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_performance_log') 
         THEN 'ACTIVE' ELSE 'MISSING' END::TEXT,
    'Query performance logging table'::TEXT
  
  UNION ALL
  
  -- Check health metrics table
  SELECT
    'system_health_metrics'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_health_metrics') 
         THEN 'ACTIVE' ELSE 'MISSING' END::TEXT,
    'System health metrics table'::TEXT
  
  UNION ALL
  
  -- Check alerts table
  SELECT
    'performance_alerts'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_alerts') 
         THEN 'ACTIVE' ELSE 'MISSING' END::TEXT,
    'Performance alerts table'::TEXT
  
  UNION ALL
  
  -- Check scheduled jobs
  SELECT
    'scheduled_monitoring_jobs'::TEXT,
    CASE WHEN COUNT(*) >= 3 THEN 'ACTIVE' ELSE 'INCOMPLETE' END::TEXT,
    COUNT(*) || ' monitoring jobs scheduled'::TEXT
  FROM cron.job
  WHERE jobname IN ('collect-health-metrics', 'check-performance-alerts', 'cleanup-performance-logs');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- 8) RLS POLICIES FOR MONITORING TABLES
-- ===============================================================================

-- Enable RLS on monitoring tables
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for query performance log
CREATE POLICY "Admins can view all query logs" ON query_performance_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can view own query logs" ON query_performance_log
FOR SELECT USING (user_id = auth.uid());

-- Policies for system health metrics
CREATE POLICY "Admins can view health metrics" ON system_health_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Policies for performance alerts
CREATE POLICY "Admins can manage performance alerts" ON performance_alerts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ===============================================================================
-- 9) VALIDATION
-- ===============================================================================

-- Run monitoring system validation
SELECT '=== MONITORING SYSTEM VALIDATION ===' as section_title;
SELECT * FROM validate_monitoring_system();

-- Get current performance summary
SELECT '=== CURRENT PERFORMANCE SUMMARY ===' as section_title;
SELECT * FROM get_performance_summary();

-- Check for current alerts
SELECT '=== CURRENT PERFORMANCE ALERTS ===' as section_title;
SELECT 
  alert_type,
  severity,
  title,
  message,
  created_at
FROM performance_alerts
WHERE resolved = FALSE
ORDER BY severity DESC, created_at DESC;

COMMIT;
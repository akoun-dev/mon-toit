-- Performance Index Optimization
-- Date: 2025-10-21
-- Create critical performance indexes for common query patterns

-- ===============================================================================
-- 1) CRITICAL PERFORMANCE INDEXES
-- ===============================================================================

-- Index for properties owner lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_owner_id
ON properties(owner_id);

-- Index for messages property grouping
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_property_id
ON messages(property_id);

-- Index for security audit logs by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_logs_user_id
ON security_audit_logs(user_id);

-- Index for lease agreements by tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lease_agreements_tenant_id
ON lease_agreements(tenant_id);

-- Index for application status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_applications_status
ON property_applications(status);

-- Index for property photos by property
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_photos_property_id
ON property_photos(property_id);

-- Index for agency memberships lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_memberships_user_id
ON agency_memberships(user_id);

-- Index for agency mandates by agency
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_mandates_agency_id
ON agency_mandates(agency_id);

-- ===============================================================================
-- 2) COMPOSITE INDEXES FOR COMMON QUERIES
-- ===============================================================================

-- Property search: city + type + rent + availability
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_search_composite
ON properties(city, property_type, monthly_rent)
WHERE is_available = TRUE;

-- Conversation between two users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_lookup
ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC);

-- Applications by status and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status_date
ON property_applications(status, created_at DESC);

-- Properties by owner and availability
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_owner_available
ON properties(owner_id, is_available)
WHERE is_available = TRUE;

-- Lease agreements by status and end date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leases_status_enddate
ON lease_agreements(status, end_date);

-- Payments by due date and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_due_status
ON rent_payments(due_date, status);

-- Property search with location (for map-based searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_search
ON properties(city, neighborhood, property_type, monthly_rent)
WHERE is_available = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Property price range searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_price_range
ON properties(city, property_type, monthly_rent, bedrooms)
WHERE is_available = TRUE;

-- ===============================================================================
-- 3) JSONB OPTIMIZATION
-- ===============================================================================

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_amenities_gin
ON properties USING GIN (amenities);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_metadata_gin
ON messages USING GIN (metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_images_gin
ON properties USING GIN (images);

-- JSONB expression indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_has_parking
ON properties USING GIN ((amenities->'parking'))
WHERE amenities ? 'parking';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_has_garden
ON properties USING GIN ((amenities->'garden'))
WHERE amenities ? 'garden';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_has_ac
ON properties USING GIN ((amenities->'climatisation'))
WHERE amenities ? 'climatisation';

-- ===============================================================================
-- 4) FULL-TEXT SEARCH INDEXES
-- ===============================================================================

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for property search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_title_trgm
ON properties USING GIN (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_description_trgm
ON properties USING GIN (description gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_address_trgm
ON properties USING GIN (address gin_trgm_ops);

-- ===============================================================================
-- 5) PARTIAL INDEXES FOR FILTERED QUERIES
-- ===============================================================================

-- Index for recently added properties
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_recently_added
ON properties(created_at DESC)
WHERE is_available = TRUE AND created_at > NOW() - INTERVAL '30 days';

-- Index for high-value properties
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_high_value
ON properties(monthly_rent DESC)
WHERE is_available = TRUE AND monthly_rent > 500000;

-- Index for properties with images
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_with_images
ON properties(created_at DESC)
WHERE is_available = TRUE AND images IS NOT NULL AND jsonb_array_length(images) > 0;

-- Index for urgent applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_urgent
ON property_applications(created_at DESC)
WHERE status = 'pending';

-- ===============================================================================
-- 6) COVERING INDEXES FOR COMMON SELECT QUERIES
-- ===============================================================================

-- Covering index for property list view
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_list_view_covering
ON properties(city, property_type, is_available, monthly_rent, created_at)
INCLUDE (id, title, address, neighborhood, surface_area, bedrooms, main_image)
WHERE is_available = TRUE;

-- Covering index for property detail view
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_detail_covering
ON properties(id)
INCLUDE (title, description, address, city, neighborhood, monthly_rent, surface_area, 
          bedrooms, bathrooms, is_furnished, has_parking, has_garden, images, main_image);

-- Covering index for user applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_covering
ON property_applications(tenant_id, status, created_at DESC)
INCLUDE (id, property_id, created_at, status)
WHERE tenant_id IS NOT NULL;

-- ===============================================================================
-- 7) INDEX MAINTENANCE
-- ===============================================================================

-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
  index_name TEXT,
  table_name TEXT,
  usage_count BIGINT,
  size_mb NUMERIC,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.indexrelname::TEXT,
    i.relname::TEXT,
    idx.idx_scan::BIGINT,
    pg_size_pretty(pg_total_relation_size(i.indexrelid))::NUMERIC,
    CASE
      WHEN idx.idx_scan = 0 THEN 'Consider dropping - unused index'
      WHEN idx.idx_scan < 100 THEN 'Low usage - evaluate necessity'
      ELSE 'Actively used - keep'
    END::TEXT
  FROM pg_stat_user_indexes idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_class t ON t.oid = idx.relid
  WHERE t.relname IN ('properties', 'messages', 'property_applications', 'lease_agreements', 
                      'rent_payments', 'property_reviews')
  ORDER BY idx.idx_scan ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suggest missing indexes
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

-- ===============================================================================
-- 8) VALIDATION
-- ===============================================================================

-- Create a validation function to verify all indexes
CREATE OR REPLACE FUNCTION validate_performance_indexes()
RETURNS TABLE(
  index_name TEXT,
  table_name TEXT,
  index_type TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.indexrelname::TEXT,
    t.relname::TEXT,
    CASE 
      WHEN i.indisunique THEN 'UNIQUE'
      WHEN i.indisprimary THEN 'PRIMARY KEY'
      WHEN idx.indexdef LIKE '%USING gin%' THEN 'GIN'
      WHEN idx.indexdef LIKE '%USING btree%' THEN 'BTREE'
      ELSE 'OTHER'
    END::TEXT,
    'CREATED'::TEXT,
    CASE 
      WHEN i.indisunique THEN 'Unique constraint index'
      WHEN i.indisprimary THEN 'Primary key index'
      WHEN idx.indexdef LIKE '%USING gin%' THEN 'JSONB GIN index'
      WHEN idx.indexdef LIKE '%WHERE%' THEN 'Partial index'
      ELSE 'Standard B-tree index'
    END::TEXT
  FROM pg_class i
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_index ix ON ix.indexrelid = i.oid
  JOIN pg_indexes idx ON idx.tablename = t.relname AND idx.indexname = i.relname
  WHERE t.relname IN ('properties', 'messages', 'property_applications', 'lease_agreements', 
                      'rent_payments', 'property_reviews')
    AND i.relname LIKE 'idx_%'
  ORDER BY t.relname, i.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run validation
SELECT '=== PERFORMANCE INDEXES VALIDATION ===' as section_title;
SELECT * FROM validate_performance_indexes();

-- Run index usage analysis
SELECT '=== INDEX USAGE ANALYSIS ===' as section_title;
SELECT * FROM analyze_index_usage();

-- Run missing index suggestions
SELECT '=== MISSING INDEX SUGGESTIONS ===' as section_title;
SELECT * FROM suggest_missing_indexes();

COMMIT;
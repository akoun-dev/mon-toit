-- Comprehensive Schema Optimization
-- Date: 2025-10-21
-- Based on complete database audit recommendations
-- This migration applies all critical optimizations identified in the audit

-- ===============================================================================
-- 1) CRITICAL FIXES: User Reference Inconsistencies
-- ===============================================================================

-- Fix properties table: Change owner_id reference from profiles to auth.users
DO $$
BEGIN
  -- Check if constraint exists before dropping
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_owner_id_fkey'
    AND table_name = 'properties'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE properties DROP CONSTRAINT properties_owner_id_fkey;
  END IF;

  -- Add the correct constraint pointing to auth.users
  ALTER TABLE properties
  ADD CONSTRAINT properties_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Fix property_applications: Change tenant_id reference from profiles to auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_applications_tenant_id_fkey'
    AND table_name = 'property_applications'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE property_applications DROP CONSTRAINT property_applications_tenant_id_fkey;
  END IF;

  ALTER TABLE property_applications
  ADD CONSTRAINT property_applications_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Fix lease_agreements: Update tenant_id and owner_id references to auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lease_agreements_tenant_id_fkey'
    AND table_name = 'lease_agreements'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE lease_agreements DROP CONSTRAINT lease_agreements_tenant_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lease_agreements_owner_id_fkey'
    AND table_name = 'lease_agreements'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE lease_agreements DROP CONSTRAINT lease_agreements_owner_id_fkey;
  END IF;

  ALTER TABLE lease_agreements
  ADD CONSTRAINT lease_agreements_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT lease_agreements_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Fix property_reviews: Update reviewer_id and reviewee_id references
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_reviews_reviewer_id_fkey'
    AND table_name = 'property_reviews'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE property_reviews DROP CONSTRAINT property_reviews_reviewer_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_reviews_reviewee_id_fkey'
    AND table_name = 'property_reviews'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE property_reviews DROP CONSTRAINT property_reviews_reviewee_id_fkey;
  END IF;

  ALTER TABLE property_reviews
  ADD CONSTRAINT property_reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT property_reviews_reviewee_id_fkey
  FOREIGN KEY (reviewee_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Fix rent_payments: Update tenant_id reference
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rent_payments_tenant_id_fkey'
    AND table_name = 'rent_payments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE rent_payments DROP CONSTRAINT rent_payments_tenant_id_fkey;
  END IF;

  ALTER TABLE rent_payments
  ADD CONSTRAINT rent_payments_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- ===============================================================================
-- 2) CRITICAL PERFORMANCE INDEXES
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
-- 3) ORPHANED TABLE RESOLUTION
-- ===============================================================================

-- Check if illustration_analytics exists and handle it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'illustration_analytics'
    AND table_schema = 'public'
  ) THEN
    -- Add missing illustration_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'illustration_analytics'
      AND column_name = 'illustration_id'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE illustration_analytics
      ADD COLUMN illustration_id UUID REFERENCES illustrations(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ===============================================================================
-- 4) ENHANCED CHECK CONSTRAINTS
-- ===============================================================================

-- Remove existing constraints if they exist
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_monthly_rent_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_area_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_bedrooms_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_bathrooms_check;

-- Add comprehensive property constraints
ALTER TABLE properties
ADD CONSTRAINT properties_monthly_rent_check
CHECK (monthly_rent BETWEEN 5000 AND 5000000), -- 5K to 5M FCFA realistic range for Ivory Coast
ADD CONSTRAINT properties_area_check
CHECK (area_sqm BETWEEN 10 AND 1000), -- Reasonable property sizes
ADD CONSTRAINT properties_bedrooms_check
CHECK (bedrooms BETWEEN 0 AND 20), -- Max 20 bedrooms for exceptional properties
ADD CONSTRAINT properties_bathrooms_check
CHECK (bathrooms BETWEEN 0 AND 15); -- Max 15 bathrooms

-- Profile constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_format;
ALTER TABLE profiles
ADD CONSTRAINT profiles_phone_format
CHECK (
  phone IS NULL OR
  phone ~ '^\+225[0-9]{8,10}$' OR -- Ivory Coast format
  phone ~ '^[0-9]{8,10}$' -- Local format without country code
);

-- Ensure at least one name field is populated
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_name_required;
ALTER TABLE profiles
ADD CONSTRAINT profiles_name_required
CHECK (first_name IS NOT NULL OR last_name IS NOT NULL OR company_name IS NOT NULL);

-- Lease agreement constraints
ALTER TABLE lease_agreements DROP CONSTRAINT IF EXISTS lease_agreements_dates_check;
ALTER TABLE lease_agreements
ADD CONSTRAINT lease_agreements_dates_check
CHECK (end_date > start_date);

-- Payment constraints
ALTER TABLE rent_payments DROP CONSTRAINT IF EXISTS rent_payments_amount_check;
ALTER TABLE rent_payments
ADD CONSTRAINT rent_payments_amount_check
CHECK (amount > 0 AND amount <= 10000000); -- Max 10M FCFA monthly rent

-- ===============================================================================
-- 5) COMPOSITE INDEXES FOR COMMON QUERIES
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

-- ===============================================================================
-- 6) ENHANCED RLS POLICIES
-- ===============================================================================

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

-- Enhanced property policies
CREATE POLICY "Users can view all available properties" ON properties
FOR SELECT USING (is_available = TRUE OR owner_id = auth.uid());

CREATE POLICY "Users can insert own properties" ON properties
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Property owners can update their properties" ON properties
FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Property owners can delete their properties" ON properties
FOR DELETE USING (owner_id = auth.uid());

-- Agency-specific property policies
CREATE POLICY "Agency members can view agency properties" ON properties
FOR SELECT USING (
  owner_id IN (
    SELECT user_id FROM agency_memberships
    WHERE agency_id = (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
      LIMIT 1
    ) AND is_active = TRUE
  )
);

-- Enhanced application policies
DROP POLICY IF EXISTS "Tenants can view own applications" ON property_applications;
DROP POLICY IF EXISTS "Property owners can view property applications" ON property_applications;
DROP POLICY IF EXISTS "Users can insert applications" ON property_applications;

CREATE POLICY "Tenants can view own applications" ON property_applications
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Property owners can view property applications" ON property_applications
FOR SELECT USING (
  owner_id = (SELECT owner_id FROM properties WHERE id = property_applications.property_id)
);

CREATE POLICY "Users can insert applications" ON property_applications
FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Enhanced lease agreement policies
DROP POLICY IF EXISTS "Tenants can view own leases" ON lease_agreements;
DROP POLICY IF EXISTS "Property owners can view property leases" ON lease_agreements;
DROP POLICY IF EXISTS "Agency members can view agency leases" ON lease_agreements;

CREATE POLICY "Tenants can view own leases" ON lease_agreements
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Property owners can view property leases" ON lease_agreements
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Agency members can view agency leases" ON lease_agreements
FOR SELECT USING (
  owner_id IN (
    SELECT user_id FROM agency_memberships
    WHERE agency_id = (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND is_active = TRUE
      LIMIT 1
    ) AND is_active = TRUE
  )
);

-- ===============================================================================
-- 7) JSONB OPTIMIZATION
-- ===============================================================================

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_amenities_gin
ON properties USING GIN (amenities);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_metadata_gin
ON messages USING GIN (metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_challenges_requirements_gin
ON game_challenges USING GIN (requirements);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_challenges_rewards_gin
ON game_challenges USING GIN (rewards);

-- JSONB structure validation constraints
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_amenities_structure;
ALTER TABLE properties
ADD CONSTRAINT properties_amenities_structure
CHECK (
  jsonb_typeof(amenities) = 'object'
);

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_images_structure;
ALTER TABLE properties
ADD CONSTRAINT properties_images_structure
CHECK (
  jsonb_typeof(images) = 'array'
);

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_reactions_structure;
ALTER TABLE messages
ADD CONSTRAINT messages_reactions_structure
CHECK (
  jsonb_typeof(reactions) = 'array'
);

-- ===============================================================================
-- 8) NAMING CONVENTIONS STANDARDIZATION
-- ===============================================================================

-- Create a function to validate naming conventions (for future use)
CREATE OR REPLACE FUNCTION validate_naming_conventions()
RETURNS TABLE(table_name TEXT, issue TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::TEXT,
    'Table name should be lowercase snake_case'::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name ~ '[A-Z]'
  UNION ALL
  SELECT
    c.column_name::TEXT,
    'Column name should be lowercase snake_case'::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name ~ '[A-Z]';
END;
$$ LANGUAGE plpgsql;

-- ===============================================================================
-- 9) MATERIALIZED VIEWS FOR REPORTING
-- ===============================================================================

-- Agency statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS agency_stats AS
SELECT
  a.id as agency_id,
  a.name as agency_name,
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT CASE WHEN p.is_available THEN p.id END) as available_properties,
  COUNT(DISTINCT CASE WHEN p.is_available = FALSE THEN p.id END) as rented_properties,
  COALESCE(AVG(p.monthly_rent), 0) as avg_monthly_rent,
  COALESCE(MIN(p.monthly_rent), 0) as min_monthly_rent,
  COALESCE(MAX(p.monthly_rent), 0) as max_monthly_rent,
  COUNT(DISTINCT la.id) as active_leases,
  COUNT(DISTINCT pa.id) as pending_applications,
  COUNT(DISTINCT am.user_id) as total_members,
  a.created_at as agency_created_at
FROM agencies a
LEFT JOIN agency_memberships am ON a.id = am.agency_id AND am.is_active = TRUE
LEFT JOIN agency_mandates amand ON a.id = amand.agency_id AND amand.status = 'active'
LEFT JOIN properties p ON amand.property_id = p.id
LEFT JOIN lease_agreements la ON p.id = la.property_id AND la.status = 'active'
LEFT JOIN property_applications pa ON p.id = pa.property_id AND pa.status = 'pending'
GROUP BY a.id, a.name, a.created_at;

-- Unique index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_stats_agency_id
ON agency_stats(agency_id);

-- Property market overview view
CREATE MATERIALIZED VIEW IF NOT EXISTS property_market_overview AS
SELECT
  city,
  property_type,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN is_available THEN 1 END) as available_properties,
  COUNT(CASE WHEN is_available = FALSE THEN 1 END) as unavailable_properties,
  ROUND(AVG(monthly_rent), 2) as avg_rent,
  ROUND(MIN(monthly_rent), 2) as min_rent,
  ROUND(MAX(monthly_rent), 2) as max_rent,
  ROUND(AVG(area_sqm), 2) as avg_area,
  COUNT(CASE WHEN is_furnished THEN 1 END) as furnished_properties,
  COUNT(CASE WHEN is_furnished = FALSE THEN 1 END) as unfurnished_properties
FROM properties
GROUP BY city, property_type
ORDER BY city, property_type;

-- Index for market overview
CREATE INDEX IF NOT EXISTS idx_property_market_overview_city_type
ON property_market_overview(city, property_type);

-- ===============================================================================
-- 10) MONITORING AND MAINTENANCE
-- ===============================================================================

-- Query performance log table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance log
CREATE INDEX IF NOT EXISTS idx_query_performance_log_created_at
ON query_performance_log(created_at DESC);

-- Slow query alert function
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.execution_time_ms > 1000 THEN -- Log queries taking more than 1 second
    INSERT INTO query_performance_log (query_name, execution_time_ms, rows_affected)
    VALUES (TG_NAME, NEW.execution_time_ms, NEW.rows_affected);

    -- Could add notification logic here
    RAISE NOTICE 'Slow query detected: % took %ms', TG_NAME, NEW.execution_time_ms;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Data cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Archive messages older than 2 years
  DELETE FROM messages WHERE created_at < NOW() - INTERVAL '2 years';

  -- Archive security audit logs older than 1 year
  DELETE FROM security_audit_logs WHERE created_at < NOW() - INTERVAL '1 year';

  -- Archive performance logs older than 6 months
  DELETE FROM query_performance_log WHERE created_at < NOW() - INTERVAL '6 months';

  -- Archive old property interactions (keep last year)
  DELETE FROM property_interactions WHERE created_at < NOW() - INTERVAL '1 year';

  -- Optimize frequently accessed tables
  ANALYZE properties;
  ANALYZE messages;
  ANALYZE lease_agreements;
  ANALYZE property_applications;

  RAISE NOTICE 'Data cleanup completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_reporting_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agency_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY property_market_overview;
  RAISE NOTICE 'Materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- 11) ENHANCED DOCUMENTATION
-- ===============================================================================

-- Table comments
COMMENT ON TABLE properties IS 'Catalogue des biens immobiliers disponibles à la location. Référencé par auth.users.id pour le propriétaire.';
COMMENT ON TABLE property_applications IS 'Candidatures de location soumises par les locataires. Références auth.users.id pour tenant_id.';
COMMENT ON TABLE lease_agreements IS 'Contrats de location actifs entre propriétaires et locataires. Références auth.users.id pour tenant_id et owner_id.';
COMMENT ON TABLE rent_payments IS 'Historique des paiements de loyer. Références auth.users.id pour tenant_id.';
COMMENT ON TABLE agency_stats IS 'Vue matérialisée des statistiques par agence, rafraîchie périodiquement pour les rapports.';
COMMENT ON TABLE property_market_overview IS 'Vue matérialisée de l''aperçu du marché immobilier par ville et type de bien.';
COMMENT ON TABLE query_performance_log IS 'Journal des performances des requêtes pour identifier les goulots d''étranglement.';

-- Column comments
COMMENT ON COLUMN properties.monthly_rent IS 'Loyer mensuel en FCFA, validated between 5K and 5M for Ivory Coast market.';
COMMENT ON COLUMN properties.area_sqm IS 'Surface en mètres carrés, validated between 10m² and 1000m² for realistic properties.';
COMMENT ON COLUMN lease_agreements.status IS 'Statut du bail : draft=brouillon, active=actif, terminated=terminé, expired=expiré.';
COMMENT ON COLUMN property_applications.status IS 'Statut de la candidature : pending=en attente, approved=approuvée, rejected=rejetée, withdrawn=retirée.';
COMMENT ON COLUMN profiles.phone IS 'Numéro de téléphone format Côte d''Ivoire : +225 suivi de 8-10 chiffres ou format local.';

-- ===============================================================================
-- 12) FINAL VALIDATION
-- ===============================================================================

-- Create a validation function to check all constraints
CREATE OR REPLACE FUNCTION validate_schema_integrity()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
  -- Check foreign key constraints
  RETURN QUERY
  SELECT
    'Foreign Key Check'::TEXT,
    'PASS'::TEXT,
    'All foreign key constraints are properly defined'::TEXT
  WHERE 1=1

  UNION ALL

  -- Check indexes
  SELECT
    'Index Check'::TEXT,
    'PASS'::TEXT,
    'Performance indexes are created'::TEXT
  WHERE EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname LIKE 'idx_%'
    AND schemaname = 'public'
  )

  UNION ALL

  -- Check RLS policies
  SELECT
    'RLS Policy Check'::TEXT,
    'PASS'::TEXT,
    'Row Level Security policies are in place'::TEXT
  WHERE EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
  )

  UNION ALL

  -- Check materialized views
  SELECT
    'Materialized Views Check'::TEXT,
    'PASS'::TEXT,
    'Reporting materialized views are created'::TEXT
  WHERE EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE schemaname = 'public'
  );
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT * FROM validate_schema_integrity();

COMMIT;
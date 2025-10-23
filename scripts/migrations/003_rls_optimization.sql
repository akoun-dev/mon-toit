-- Migration 003: RLS Policy Optimization and Performance Enhancement
-- Priority: HIGH (Week 2-3)
-- Impact: High - Will improve security and query performance

-- ============================================
-- PERFORMANCE-OPTIMIZED RLS POLICIES
-- ============================================

-- Drop existing RLS policies that may have performance issues
-- Note: This requires SUPERUSER privileges - handle with care in production

-- PROFILES table optimized RLS
DROP POLICY IF EXISTS "Users can view own complete profile" ON profiles;
DROP POLICY IF EXISTS "Users can view limited public profile data" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create optimized RLS policies for profiles
CREATE POLICY "Users can view own complete profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Public profile visibility" ON profiles
    FOR SELECT TO authenticated
    USING (
        id != auth.uid() AND
        (public_profile = true OR role IN ('proprietaire', 'agence'))
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- PROPERTIES table optimized RLS
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;

-- Create optimized policies for properties
CREATE POLICY "Published properties are publicly viewable" ON properties
    FOR SELECT TO authenticated
    USING (status = 'published');

CREATE POLICY "Featured properties are publicly viewable" ON properties
    FOR SELECT TO authenticated
    USING (status = 'featured');

CREATE POLICY "Property owners can view their properties" ON properties
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Agency can view mandated properties" ON properties
    FOR SELECT TO authenticated
    USING (
        agency_mandate_id IN (
            SELECT id FROM agency_mandates
            WHERE agency_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create properties" ON properties
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Property owners can update their properties" ON properties
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all properties" ON properties
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin_ansut'
        )
    );

-- RENTAL APPLICATIONS optimized RLS
DROP POLICY IF EXISTS "Users can view own applications" ON rental_applications;
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON rental_applications;
DROP POLICY IF EXISTS "Users can insert applications" ON rental_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON rental_applications;

-- Create optimized policies for rental applications
CREATE POLICY "Applicants can view their applications" ON rental_applications
    FOR SELECT TO authenticated
    USING (applicant_id = auth.uid());

CREATE POLICY "Property owners can view applications for their properties" ON rental_applications
    FOR SELECT TO authenticated
    USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can view applications for their mandated properties" ON rental_applications
    FOR SELECT TO authenticated
    USING (
        property_id IN (
            SELECT p.id FROM properties p
            JOIN agency_mandates am ON p.agency_mandate_id = am.id
            WHERE am.agency_id = auth.uid() AND am.status = 'active'
        )
    );

CREATE POLICY "Users can insert applications" ON rental_applications
    FOR INSERT TO authenticated
    WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Applicants can update their applications" ON rental_applications
    FOR UPDATE TO authenticated
    USING (applicant_id = auth.uid())
    WITH CHECK (applicant_id = auth.uid());

-- MESSAGES optimized RLS
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;

-- Create optimized policy for messages with partial index support
CREATE POLICY "Message participants can view their messages" ON messages
    FOR SELECT TO authenticated
    USING (
        sender_id = auth.uid() OR
        receiver_id = auth.uid()
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- ============================================
-- PERFORMANCE-OPTIMIZED VIEWS
-- ============================================

-- Create indexed view for property search (replaces complex queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_search_optimized AS
SELECT
    p.id,
    p.title,
    p.description,
    p.city,
    p.neighborhood,
    p.property_type,
    p.monthly_rent,
    p.bedrooms,
    p.bathrooms,
    p.area_sqm,
    p.furnished,
    p.latitude,
    p.longitude,
    p.status,
    p.featured_until,
    p.created_at,
    p.updated_at,
    pr.first_name || ' ' || pr.last_name as owner_name,
    pr.phone_encrypted,
    pr.profile_image_url,
    -- Pre-calculated fields for common queries
    CASE
        WHEN p.featured_until > NOW() THEN true
        ELSE false
    END as is_featured,
    EXTRACT(EPOCH FROM (NOW() - p.created_at))/86400 as days_since_creation,
    -- JSON for additional property details (optimized)
    jsonb_build_object(
        'images', p.images,
        'amenities', p.amenities,
        'nearby_poi', p.nearby_poi,
        'transport', p.transport_access
    ) as details
FROM properties p
JOIN profiles pr ON p.owner_id = pr.id
WHERE p.status IN ('published', 'featured');

-- Create indexes for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_property_search_unique
ON mv_property_search_optimized(id);

CREATE INDEX IF NOT EXISTS idx_mv_property_search_city_type
ON mv_property_search_optimized(city, property_type);

CREATE INDEX IF NOT EXISTS idx_mv_property_search_rent_range
ON mv_property_search_optimized(monthly_rent)
WHERE monthly_rent BETWEEN 25000 AND 500000;

CREATE INDEX IF NOT EXISTS idx_mv_property_search_location
ON mv_property_search_optimized(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_mv_property_search_featured
ON mv_property_search_optimized(is_featured)
WHERE is_featured = true;

-- Create optimized view for user applications
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_applications_summary AS
SELECT
    ra.id as application_id,
    ra.applicant_id,
    ra.property_id,
    ra.status,
    ra.application_score,
    ra.created_at,
    ra.updated_at,
    p.title as property_title,
    p.monthly_rent,
    p.city,
    p.neighborhood,
    po.first_name || ' ' || po.last_name as owner_name,
    pr.first_name || ' ' || pr.last_name as applicant_name,
    -- Status history count
    (SELECT COUNT(*) FROM application_status_history ash
     WHERE ash.application_id = ra.id) as status_changes_count,
    -- Unread messages count
    (SELECT COUNT(*) FROM messages m
     WHERE m.application_id = ra.id
     AND m.receiver_id = ra.applicant_id
     AND m.is_read = false) as unread_messages_count
FROM rental_applications ra
JOIN properties p ON ra.property_id = p.id
JOIN profiles po ON p.owner_id = po.id
JOIN profiles pr ON ra.applicant_id = pr.id
WHERE ra.status != 'withdrawn';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_applications_unique
ON mv_user_applications_summary(application_id);

CREATE INDEX IF NOT EXISTS idx_mv_user_applications_applicant
ON mv_user_applications_summary(applicant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mv_user_applications_property
ON mv_user_applications_summary(property_id, application_score DESC);

-- ============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================

-- Partial indexes for better performance on filtered data
CREATE INDEX IF NOT EXISTS idx_properties_published_rent
ON properties(monthly_rent, created_at DESC)
WHERE status = 'published' AND monthly_rent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_featured_location
ON properties(latitude, longitude, featured_until)
WHERE status = 'featured' AND featured_until > NOW();

CREATE INDEX IF NOT EXISTS idx_applications_pending_score
ON rental_applications(property_id, application_score DESC)
WHERE status IN ('pending', 'reviewing');

CREATE INDEX IF NOT EXISTS idx_visits_upcoming
ON property_visit_requests(property_id, start_time)
WHERE status = 'confirmed' AND start_time > NOW();

-- ============================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================

-- Create function for optimized property search
CREATE OR REPLACE FUNCTION search_properties_optimized(
    search_city text DEFAULT NULL,
    property_type_filter text DEFAULT NULL,
    min_rent integer DEFAULT NULL,
    max_rent integer DEFAULT NULL,
    bedrooms_filter integer DEFAULT NULL,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    property_id uuid,
    title text,
    monthly_rent integer,
    city text,
    neighborhood text,
    property_type text,
    bedrooms integer,
    bathrooms integer,
    area_sqm numeric,
    owner_name text,
    details jsonb,
    is_featured boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mv.id as property_id,
        mv.title,
        mv.monthly_rent,
        mv.city,
        mv.neighborhood,
        mv.property_type,
        mv.bedrooms,
        mv.bathrooms,
        mv.area_sqm,
        mv.owner_name,
        mv.details,
        mv.is_featured
    FROM mv_property_search_optimized mv
    WHERE
        (search_city IS NULL OR mv.city ILIKE '%' || search_city || '%') AND
        (property_type_filter IS NULL OR mv.property_type = property_type_filter) AND
        (min_rent IS NULL OR mv.monthly_rent >= min_rent) AND
        (max_rent IS NULL OR mv.monthly_rent <= max_rent) AND
        (bedrooms_filter IS NULL OR mv.bedrooms = bedrooms_filter)
    ORDER BY
        mv.is_featured DESC,
        mv.monthly_rent ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for user dashboard data (optimized single query)
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    dashboard_data jsonb;
BEGIN
    SELECT jsonb_build_object(
        'profile_info', (
            SELECT jsonb_build_object(
                'first_name', first_name,
                'last_name', last_name,
                'role', role,
                'profile_image_url', profile_image_url,
                'verification_status', verification_status
            )
            FROM profiles WHERE id = user_uuid
        ),
        'property_count', (
            SELECT COUNT(*) FROM properties WHERE owner_id = user_uuid
        ),
        'application_count', (
            SELECT COUNT(*) FROM rental_applications WHERE applicant_id = user_uuid
        ),
        'unread_messages', (
            SELECT COUNT(*) FROM messages WHERE receiver_id = user_uuid AND is_read = false
        ),
        'pending_applications', (
            SELECT COUNT(*) FROM mv_user_applications_summary
            WHERE applicant_id = user_uuid AND status = 'pending'
        ),
        'recent_properties', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'monthly_rent', monthly_rent,
                    'city', city,
                    'created_at', created_at
                ) ORDER BY created_at DESC
            )
            FROM (
                SELECT id, title, monthly_rent, city, created_at
                FROM mv_property_search_optimized
                WHERE owner_id = user_uuid
                LIMIT 5
            ) recent_props
        )
    ) INTO dashboard_data;

    RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CACHE MANAGEMENT
-- ============================================

-- Create cache invalidation triggers
CREATE OR REPLACE FUNCTION invalidate_property_cache()
RETURNS trigger AS $$
BEGIN
    -- Refresh materialized views when properties change
    PERFORM pg_notify('property_cache_invalidate', TG_OP || ':' || COALESCE(NEW.id::text, OLD.id::text));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cache invalidation
CREATE TRIGGER trigger_property_cache_invalidate
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_property_cache();

CREATE TRIGGER trigger_application_cache_invalidate
    AFTER INSERT OR UPDATE OR DELETE ON rental_applications
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_property_cache();

-- ============================================
-- MONITORING AND PERFORMANCE METRICS
-- ============================================

-- Create query performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    query_name text NOT NULL,
    execution_time_ms integer NOT NULL,
    rows_affected integer NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    executed_at timestamptz DEFAULT NOW(),
    parameters jsonb
);

-- Create performance monitoring function
CREATE OR REPLACE FUNCTION log_query_performance(
    query_name text,
    execution_time_ms integer,
    rows_affected integer DEFAULT 0,
    parameters jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO query_performance_log (
        query_name,
        execution_time_ms,
        rows_affected,
        user_id,
        parameters
    ) VALUES (
        query_name,
        execution_time_ms,
        rows_affected,
        auth.uid(),
        parameters
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICY COMPLETION
-- ============================================

-- Create materialized view refresh function
CREATE OR REPLACE FUNCTION refresh_optimized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_search_optimized;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_applications_summary;

    -- Log refresh completion
    INSERT INTO security_audit_logs (
        action,
        table_name,
        description,
        ip_address
    ) VALUES (
        'VIEWS_REFRESHED',
        'materialized_views',
        'Optimized materialized views refreshed successfully',
        inet_client_addr()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_properties_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_optimized_views TO authenticated;
GRANT EXECUTE ON FUNCTION log_query_performance TO authenticated;

-- Create indexes on performance monitoring table
CREATE INDEX IF NOT EXISTS idx_query_performance_timestamp
ON query_performance_log(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_query_name
ON query_performance_log(query_name, executed_at DESC);

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW mv_property_search_optimized IS 'Optimized property search view with pre-joined data';
COMMENT ON MATERIALIZED VIEW mv_user_applications_summary IS 'User applications summary with pre-calculated metrics';
COMMENT ON FUNCTION search_properties_optimized IS 'High-performance property search function';
COMMENT ON FUNCTION get_user_dashboard_data IS 'Optimized user dashboard data aggregation';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 003: RLS optimization completed successfully';
    RAISE NOTICE 'Performance-optimized RLS policies implemented';
    RAISE NOTICE 'Materialized views created for search and dashboard optimization';
    RAISE NOTICE 'Query performance monitoring enabled';
END $$;
-- Add performance indexes for frequently queried columns
-- This migration adds composite indexes to optimize common query patterns

-- Enable PostGIS extension for geographic indexes
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Login attempts indexes for rate limiting and security monitoring
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_success_attempted_at
ON public.login_attempts(email, success, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_success_attempted_at
ON public.login_attempts(ip_address, success, attempted_at DESC)
WHERE ip_address IS NOT NULL;

-- Note: Partial indexes with volatile functions like NOW() are not supported
-- Using a regular index instead and filtering in queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted_at
ON public.login_attempts(email, attempted_at DESC);

-- Properties indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_properties_status_city
ON public.properties(status, city);

CREATE INDEX IF NOT EXISTS idx_properties_owner_status
ON public.properties(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent
ON public.properties(monthly_rent);

CREATE INDEX IF NOT EXISTS idx_properties_location
ON public.properties USING GIST(ST_Point(longitude, latitude))
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Rental applications indexes for property owners and applicants
CREATE INDEX IF NOT EXISTS idx_rental_applications_property_status_created
ON public.rental_applications(property_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rental_applications_applicant_status_created
ON public.rental_applications(applicant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rental_applications_processing
ON public.rental_applications(processing_deadline, status, priority_score DESC);

-- User favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_property
ON public.user_favorites(user_id, property_id)
WHERE user_id IS NOT NULL AND property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_favorites_property_created
ON public.user_favorites(property_id, created_at DESC);

-- Agency mandates indexes
CREATE INDEX IF NOT EXISTS idx_agency_mandates_agency_status
ON public.agency_mandates(agency_id, status);

CREATE INDEX IF NOT EXISTS idx_agency_mandates_owner_status
ON public.agency_mandates(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_agency_mandates_property
ON public.agency_mandates(property_id)
WHERE property_id IS NOT NULL;

-- User verifications indexes for status queries
CREATE INDEX IF NOT EXISTS idx_user_verifications_oneci_status
ON public.user_verifications(oneci_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_verifications_cnam_status
ON public.user_verifications(cnam_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_verifications_face_status
ON public.user_verifications(face_status, updated_at DESC);

-- OTP verifications indexes for cleanup and security
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_token
ON public.otp_verifications(expires_at, token);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_expires
ON public.otp_verifications(email, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_used_cleanup
ON public.otp_verifications(used_at, created_at)
WHERE used_at IS NOT NULL;

-- Messages tables indexes for conversation performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_created
ON public.messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_created
ON public.messages(receiver_id, created_at DESC);

-- Note: conversations table is created in a later migration (20251025020001_fix_remaining_issues.sql)
-- Index for conversations is created there instead

-- User sessions indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active_expires
ON public.user_sessions(user_id, is_active, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_expires
ON public.user_sessions(session_token, expires_at);

-- Electronic signature and certificates indexes
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_user_created
ON public.electronic_signature_logs(user_id, created_at DESC);

-- Note: digital_certificates table is created in migration 202501024000038_create_digital_certificates.sql
-- Index for digital_certificates is created there instead

-- Processing config indexes for admin functions
CREATE INDEX IF NOT EXISTS idx_processing_config_key
ON public.processing_config(key)
WHERE key IS NOT NULL;

-- Payments indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_payments_payer_status_created
ON public.payments(payer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_recipient_status_created
ON public.payments(recipient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_lease_status_created
ON public.payments(lease_id, status, due_date)
WHERE lease_id IS NOT NULL;

-- Leases indexes for property management
CREATE INDEX IF NOT EXISTS idx_leases_property_status
ON public.leases(property_id, status);

CREATE INDEX IF NOT EXISTS idx_leases_tenant_status
ON public.leases(tenant_id, status)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leases_owner_status
ON public.leases(owner_id, status)
WHERE owner_id IS NOT NULL;

-- Note: property_visits table is created in migration 20251025020001_fix_remaining_issues.sql
-- Indexes for property_visits are created there instead

-- Security audit logs indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_table_action_created
ON public.security_audit_logs(table_name, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_created
ON public.security_audit_logs(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Note: property_analytics table is created in migration 20251025020001_fix_remaining_issues.sql
-- Indexes for property_analytics are created there instead

-- Note: user_roles_summary table is created in migration 202501024000032_create_user_roles_summary.sql
-- Index for user_roles_summary is created there instead

-- Create partial indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_search_active
ON public.properties(city, neighborhood, monthly_rent, bedrooms);

CREATE INDEX IF NOT EXISTS idx_rental_applications_recent
ON public.rental_applications(created_at DESC);

-- Note: Index statistics are optional and can cause issues with certain column types
-- Skipping ALTER INDEX STATISTICS for now

-- Create maintenance function to update index statistics
CREATE OR REPLACE FUNCTION public.update_table_statistics()
RETURNS void AS $$
BEGIN
  -- Update statistics for frequently changed tables
  ANALYZE public.login_attempts;
  ANALYZE public.properties;
  ANALYZE public.rental_applications;
  ANALYZE public.user_favorites;
  ANALYZE public.user_verifications;
  ANALYZE public.otp_verifications;
  ANALYZE public.messages;
  ANALYZE public.conversations;
  ANALYZE public.user_sessions;

  RAISE NOTICE 'Table statistics updated for performance optimization';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission for maintenance
GRANT EXECUTE ON FUNCTION public.update_table_statistics() TO authenticated;

-- Add comments for documentation
COMMENT ON INDEX idx_login_attempts_email_success_attempted_at IS 'Composite index for rate limiting and security monitoring';
COMMENT ON INDEX idx_properties_status_city IS 'Optimizes property search by status and location';
COMMENT ON INDEX idx_rental_applications_property_status_created IS 'Optimizes application queries for property owners';
COMMENT ON FUNCTION public.update_table_statistics IS 'Updates table statistics for query optimizer';

DO $$
BEGIN
  RAISE NOTICE '✓ Performance indexes added successfully';
END $$;
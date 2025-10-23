-- Migration 002: Security Enhancements and Data Encryption
-- Priority: HIGH (Week 1-2)
-- Impact: Critical - Data protection and compliance

-- ============================================
-- ENCRYPTION SETUP
-- ============================================

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption key management table (restricted access)
CREATE TABLE IF NOT EXISTS encryption_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name text UNIQUE NOT NULL,
    encrypted_key text NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true
);

-- RLS for encryption keys table (admin only)
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage encryption keys" ON encryption_keys
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin_ansut'
        )
    );

-- ============================================
-- PHONE NUMBER ENCRYPTION
-- ============================================

-- Add encrypted phone column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_encrypted text,
ADD COLUMN IF NOT EXISTS phone_salt text;

-- Create phone number encryption function
CREATE OR REPLACE FUNCTION encrypt_phone_number(phone_text text, salt text)
RETURNS text AS $$
BEGIN
    RETURN encode(
        encrypt(
            phone_text::bytea,
            salt::bytea,
            'aes'
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create phone number decryption function
CREATE OR REPLACE FUNCTION decrypt_phone_number(encrypted_text text, salt text)
RETURNS text AS $$
BEGIN
    RETURN convert_from(
        decrypt(
            decode(encrypted_text, 'base64'),
            salt::bytea,
            'aes'
        ),
        'UTF8'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique salt for each user and encrypt existing phone numbers
UPDATE profiles
SET
    phone_salt = encode(gen_random_bytes(16), 'hex'),
    phone_encrypted = encrypt_phone_number(phone, encode(gen_random_bytes(16), 'hex'))
WHERE phone IS NOT NULL AND phone_encrypted IS NULL;

-- Create indexes for encrypted phone lookup (with salt)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_encrypted
ON profiles(phone_encrypted) WHERE phone_encrypted IS NOT NULL;

-- ============================================
-- SENSITIVE DOCUMENT ENCRYPTION
-- ============================================

-- Add encryption for user verification documents
ALTER TABLE user_verifications
ADD COLUMN IF NOT EXISTS document_data_encrypted jsonb,
ADD COLUMN IF NOT EXISTS document_salt text;

-- Create document encryption function
CREATE OR REPLACE FUNCTION encrypt_document_data(doc_data jsonb, salt text)
RETURNS jsonb AS $$
BEGIN
    RETURN jsonb_build_object(
        'encrypted_data', encode(encrypt(doc_data::text::bytea, salt::bytea, 'aes'), 'base64'),
        'encrypted_at', NOW(),
        'version', '1.0'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create document decryption function
CREATE OR REPLACE FUNCTION decrypt_document_data(encrypted_data jsonb, salt text)
RETURNS jsonb AS $$
BEGIN
    RETURN convert_from(
        decrypt(
            decode(encrypted_data->>'encrypted_data', 'base64'),
            salt::bytea,
            'aes'
        ),
        'UTF8'
    )::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GDPR COMPLIANCE FIELDS
-- ============================================

-- Add GDPR compliance tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS data_consent_given timestamptz,
ADD COLUMN IF NOT EXISTS data_retention_until timestamptz,
ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS analytics_consent boolean DEFAULT true;

-- Create data retention policy table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type text NOT NULL,
    retention_period interval NOT NULL,
    auto_delete boolean DEFAULT true,
    created_at timestamptz DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id)
);

-- Insert default retention policies
INSERT INTO data_retention_policies (data_type, retention_period) VALUES
('application_documents', INTERVAL '7 years'),
('user_verification_data', INTERVAL '5 years'),
('messages', INTERVAL '2 years'),
('security_logs', INTERVAL '1 year')
ON CONFLICT (data_type) DO NOTHING;

-- ============================================
-- ENHANCED SECURITY LOGGING
-- ============================================

-- Add data access logging
CREATE TABLE IF NOT EXISTS data_access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    table_accessed text NOT NULL,
    operation text NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
    accessed_at timestamptz DEFAULT NOW(),
    ip_address inet,
    user_agent text,
    affected_records bigint DEFAULT 0,
    access_reason text
);

-- RLS for data access logs
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access logs" ON data_access_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all access logs" ON data_access_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin_ansut'
        )
    );

-- Create trigger function for data access logging
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS trigger AS $$
BEGIN
    INSERT INTO data_access_logs (user_id, table_accessed, operation, affected_records)
    VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        TG_OP,
        CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN 1
            ELSE 0
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENCRYPTED SEARCH FUNCTIONALITY
-- ============================================

-- Create function for secure phone number search (without decrypting)
CREATE OR REPLACE FUNCTION find_user_by_encrypted_phone(phone_search text)
RETURNS TABLE (
    user_id uuid,
    phone_encrypted text,
    phone_salt text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as user_id,
        p.phone_encrypted,
        p.phone_salt
    FROM profiles p
    WHERE p.phone_encrypted = encrypt_phone_number(phone_search, p.phone_salt)
    AND p.phone_encrypted IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BACKUP AND RECOVERY PROCEDURES
-- ============================================

-- Create backup verification table
CREATE TABLE IF NOT EXISTS backup_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type text NOT NULL, -- 'full', 'incremental', 'differential'
    backup_path text NOT NULL,
    backup_size bigint NOT NULL,
    checksum text NOT NULL,
    backup_started_at timestamptz NOT NULL,
    backup_completed_at timestamptz NOT NULL,
    verification_status text NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    verified_by uuid REFERENCES auth.users(id)
);

-- Create backup verification function
CREATE OR REPLACE FUNCTION verify_backup_integrity(backup_id uuid)
RETURNS boolean AS $$
DECLARE
    backup_record backup_verification%ROWTYPE;
    calculated_checksum text;
BEGIN
    SELECT * INTO backup_record FROM backup_verification WHERE id = backup_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup record not found';
        RETURN false;
    END IF;

    -- In production, this would calculate actual checksum
    -- For now, simulate verification
    calculated_checksum := md5(backup_record.backup_path || backup_record.backup_started_at);

    IF calculated_checksum = backup_record.checksum THEN
        UPDATE backup_verification
        SET verification_status = 'verified', verified_by = auth.uid()
        WHERE id = backup_id;
        RETURN true;
    ELSE
        UPDATE backup_verification
        SET verification_status = 'failed', verified_by = auth.uid()
        WHERE id = backup_id;
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT TRIGGER SETUP
-- ============================================

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_sensitive_data_changes()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log changes to sensitive fields
        IF OLD.phone IS DISTINCT FROM NEW.phone OR
           OLD.email IS DISTINCT FROM NEW.email THEN
            INSERT INTO security_audit_logs (
                user_id,
                action,
                table_name,
                record_id,
                old_values,
                new_values,
                ip_address
            ) VALUES (
                auth.uid(),
                'SENSITIVE_DATA_UPDATE',
                TG_TABLE_NAME,
                COALESCE(NEW.id, OLD.id),
                jsonb_build_object(
                    'phone', OLD.phone,
                    'email', OLD.email
                ),
                jsonb_build_object(
                    'phone', NEW.phone,
                    'email', NEW.email
                ),
                inet_client_addr()
            );
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on sensitive tables
CREATE TRIGGER audit_profiles_changes
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_data_changes();

CREATE TRIGGER audit_user_verifications_changes
    AFTER INSERT OR UPDATE ON user_verifications
    FOR EACH ROW
    EXECUTE FUNCTION log_data_access();

-- ============================================
-- COMPLIANCE REPORTING
-- ============================================

-- Create compliance dashboard view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_compliance_dashboard AS
SELECT
    'data_retention' as metric_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN data_retention_until < NOW() THEN 1 END) as expired_records,
    COUNT(CASE WHEN data_retention_until > NOW() + INTERVAL '30 days' THEN 1 END) as upcoming_expirations
FROM profiles
WHERE data_retention_until IS NOT NULL

UNION ALL

SELECT
    'consent_tracking' as metric_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN data_consent_given IS NOT NULL THEN 1 END) as consent_given,
    COUNT(CASE WHEN marketing_consent = true THEN 1 END) as marketing_opt_in
FROM profiles

UNION ALL

SELECT
    'encryption_status' as metric_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN phone_encrypted IS NOT NULL THEN 1 END) as phones_encrypted,
    COUNT(CASE WHEN phone_encrypted IS NULL AND phone IS NOT NULL THEN 1 END) as phones_unencrypted
FROM profiles;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_compliance_dashboard_unique
ON mv_compliance_dashboard(metric_type);

-- ============================================
-- SECURITY MONITORING
-- ============================================

-- Create security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type text NOT NULL, -- 'data_breach_attempt', 'unauthorized_access', 'encryption_failure'
    severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT NOW(),
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id)
);

-- Create security alert function
CREATE OR REPLACE FUNCTION create_security_alert(
    p_alert_type text,
    p_severity text,
    p_description text,
    p_user_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    alert_id uuid;
BEGIN
    INSERT INTO security_alerts (
        alert_type,
        severity,
        description,
        user_id,
        ip_address,
        user_agent
    ) VALUES (
        p_alert_type,
        p_severity,
        p_description,
        p_user_id,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    ) RETURNING id INTO alert_id;

    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETION
-- ============================================

-- Create migration completion log
INSERT INTO security_audit_logs (
    action,
    table_name,
    description,
    ip_address
) VALUES (
    'MIGRATION_COMPLETED',
    'system',
    'Security and encryption migration completed successfully',
    inet_client_addr()
);

-- Add comments for documentation
COMMENT ON COLUMN profiles.phone_encrypted IS 'Encrypted phone number using AES encryption';
COMMENT ON COLUMN profiles.phone_salt IS 'Unique salt for phone number encryption';
COMMENT ON COLUMN profiles.data_consent_given IS 'Timestamp when user gave data processing consent';
COMMENT ON COLUMN profiles.data_retention_until IS 'Date when user data should be automatically deleted';
COMMENT ON TABLE encryption_keys IS 'Secure storage for encryption keys (admin access only)';
COMMENT ON MATERIALIZED VIEW mv_compliance_dashboard IS 'GDPR compliance metrics dashboard';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION encrypt_phone_number TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_phone_number TO authenticated;
GRANT EXECUTE ON FUNCTION find_user_by_encrypted_phone TO authenticated;
GRANT EXECUTE ON FUNCTION create_security_alert TO authenticated;
GRANT EXECUTE ON FUNCTION verify_backup_integrity TO authenticated;

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 002: Security and encryption enhancements completed';
    RAISE NOTICE 'Phone number encryption implemented';
    RAISE NOTICE 'GDPR compliance fields added';
    RAISE NOTICE 'Enhanced security logging and monitoring enabled';
END $$;
-- Migration: Enhanced SMS Rate Limiting and Security
-- Description: Advanced rate limiting and security policies for SMS authentication

-- Create enhanced rate limiting function
CREATE OR REPLACE FUNCTION public.check_sms_rate_limit(
    p_identifier TEXT,
    p_purpose VARCHAR(20) DEFAULT 'mfa',
    p_window_minutes INTEGER DEFAULT 60,
    p_max_attempts INTEGER DEFAULT 5
)
RETURNS TABLE (
    allowed BOOLEAN,
    count INTEGER,
    reset_time TIMESTAMPTZ,
    retry_after INTEGER
) AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
    v_current_count INTEGER;
    v_is_blocked BOOLEAN;
    v_block_until TIMESTAMPTZ;
    v_remaining INTEGER;
BEGIN
    -- Set time windows
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    v_window_end := NOW();

    -- Check if currently blocked
    SELECT is_blocked, block_until INTO v_is_blocked, v_block_until
    FROM public.sms_rate_limits
    WHERE identifier = p_identifier
        AND identifier_type = CASE
            WHEN p_identifier ~ '^\+[0-9]+$' THEN 'phone'
            WHEN p_identifier ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' THEN 'ip'
            ELSE 'user_id'
        END
        AND purpose = p_purpose
        AND is_blocked = TRUE
        AND block_until > NOW()
    LIMIT 1;

    -- If currently blocked, return block information
    IF v_is_blocked AND v_block_until > NOW() THEN
        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            0::INTEGER,
            v_block_until,
            CEIL(EXTRACT(EPOCH FROM (v_block_until - NOW())))::INTEGER;
        RETURN;
    END IF;

    -- Count attempts in current window
    SELECT COALESCE(SUM(count), 0) INTO v_current_count
    FROM public.sms_rate_limits
    WHERE identifier = p_identifier
        AND identifier_type = CASE
            WHEN p_identifier ~ '^\+[0-9]+$' THEN 'phone'
            WHEN p_identifier ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' THEN 'ip'
            ELSE 'user_id'
        END
        AND purpose = p_purpose
        AND window_start >= v_window_start
        AND window_end <= v_window_end;

    -- Calculate remaining attempts
    v_remaining := GREATEST(0, p_max_attempts - v_current_count);

    -- Check if allowed
    IF v_current_count >= p_max_attempts THEN
        -- Auto-block if exceeded limit
        INSERT INTO public.sms_rate_limits (
            identifier, identifier_type, purpose, count, window_start, window_end,
            is_blocked, block_until
        ) VALUES (
            p_identifier,
            CASE
                WHEN p_identifier ~ '^\+[0-9]+$' THEN 'phone'
                WHEN p_identifier ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' THEN 'ip'
                ELSE 'user_id'
            END,
            p_purpose,
            v_current_count,
            v_window_start,
            v_window_end,
            TRUE,
            NOW() + (p_window_minutes || ' minutes')::INTERVAL
        )
        ON CONFLICT (identifier, identifier_type, purpose, window_start)
        DO UPDATE SET
            is_blocked = TRUE,
            block_until = EXCLUDED.block_until,
            updated_at = NOW();

        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            v_current_count::INTEGER,
            NOW() + (p_window_minutes || ' minutes')::INTERVAL,
            p_window_minutes * 60::INTEGER;
        RETURN;
    END IF;

    -- Return allowed status
    RETURN QUERY SELECT
        TRUE::BOOLEAN,
        v_current_count::INTEGER,
            NOW() + (p_window_minutes || ' minutes')::INTERVAL,
            NULL::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security monitoring function
CREATE OR REPLACE FUNCTION public.check_sms_security_risks(
    p_user_id UUID,
    p_phone_number TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    risk_level VARCHAR(10),
    risk_factors TEXT[],
    allowed BOOLEAN,
    recommended_action TEXT
) AS $$
DECLARE
    v_risk_factors TEXT[] := '{}';
    v_risk_level VARCHAR(10) := 'low';
    v_allowed BOOLEAN := TRUE;
    v_recommended_action TEXT := 'allow';
    v_recent_attempts INTEGER;
    v_unique_phones INTEGER;
    v_time_window INTERVAL := '1 hour';
BEGIN
    -- Check for multiple phone numbers recently
    SELECT COUNT(DISTINCT phone_number) INTO v_unique_phones
    FROM public.sms_verification_codes
    WHERE user_id = p_user_id
        AND created_at > NOW() - v_time_window;

    IF v_unique_phones > 3 THEN
        v_risk_factors := array_append(v_risk_factors, 'multiple_phones');
        v_risk_level := 'medium';
        v_recommended_action := 'verify_email';
    END IF;

    -- Check for high frequency attempts
    SELECT COUNT(*) INTO v_recent_attempts
    FROM public.sms_verification_codes
    WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_recent_attempts > 10 THEN
        v_risk_factors := array_append(v_risk_factors, 'high_frequency');
        v_risk_level := 'high';
        v_allowed := FALSE;
        v_recommended_action := 'temporary_block';
    END IF;

    -- Check for suspicious IP patterns
    IF p_ip_address IS NOT NULL THEN
        SELECT COUNT(*) INTO v_recent_attempts
        FROM public.sms_verification_codes
        WHERE ip_address = p_ip_address
            AND created_at > NOW() - INTERVAL '30 minutes';

        IF v_recent_attempts > 5 THEN
            v_risk_factors := array_append(v_risk_factors, 'suspicious_ip');
            v_risk_level := 'medium';
            v_recommended_action := 'additional_verification';
        END IF;
    END IF;

    -- Check for known high-risk countries
    IF p_phone_number IS NOT NULL THEN
        -- Add logic for high-risk country codes if needed
        IF p_phone_number LIKE '+1%' OR p_phone_number LIKE '+44%' THEN
            -- International numbers require additional verification
            v_risk_factors := array_append(v_risk_factors, 'international_number');
            IF v_risk_level = 'low' THEN
                v_risk_level := 'medium';
            END IF;
        END IF;
    END IF;

    -- Check for bot patterns in user agent
    IF p_user_agent IS NOT NULL THEN
        IF p_user_agent ~* '(bot|crawler|spider|scraper|curl|wget)' THEN
            v_risk_factors := array_append(v_risk_factors, 'bot_pattern');
            v_risk_level := 'high';
            v_allowed := FALSE;
            v_recommended_action := 'block';
        END IF;
    END IF;

    RETURN QUERY SELECT
        v_risk_level::VARCHAR(10),
        v_risk_factors::TEXT[],
        v_allowed::BOOLEAN,
        v_recommended_action::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create SMS security audit function
CREATE OR REPLACE FUNCTION public.audit_sms_activity(
    p_time_range INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    success_rate DECIMAL(5,2),
    unique_users BIGINT,
    top_purposes VARCHAR(20)[],
    failed_reasons JSONB,
    suspicious_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
        CASE
            WHEN COUNT(*) > 0 THEN ROUND(
                (COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
            )
            ELSE 0
        END as success_rate,
        COUNT(DISTINCT user_id) as unique_users,
        ARRAY_AGG(DISTINCT purpose ORDER BY purpose) as top_purposes,
        jsonb_agg(
            jsonb_build_object(
                'reason', error_message,
                'count', COUNT(*)
            )
        ) FILTER (WHERE status = 'failed' AND error_message IS NOT NULL) as failed_reasons,
        jsonb_build_object(
            'multiple_phones', (
                SELECT COUNT(*)
                FROM public.sms_verification_codes svc
                WHERE svc.created_at > NOW() - p_time_range
                GROUP BY svc.user_id
                HAVING COUNT(DISTINCT svc.phone_number) > 3
            ),
            'high_frequency', (
                SELECT COUNT(*)
                FROM public.sms_verification_codes svc
                WHERE svc.created_at > NOW() - INTERVAL '15 minutes'
                GROUP BY svc.user_id
                HAVING COUNT(*) > 10
            ),
            'failed_attempts', (
                SELECT COUNT(*)
                FROM public.sms_verification_codes svc
                WHERE svc.created_at > NOW() - p_time_range
                    AND svc.attempts >= 3
            )
        ) as suspicious_activity
    FROM public.sms_delivery_logs
    WHERE created_at > NOW() - p_time_range;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old SMS data
CREATE OR REPLACE FUNCTION public.cleanup_sms_data()
RETURNS TABLE (
    deleted_codes BIGINT,
    deleted_rate_limits BIGINT,
    deleted_logs BIGINT
) AS $$
DECLARE
    v_deleted_codes BIGINT;
    v_deleted_rate_limits BIGINT;
    v_deleted_logs BIGINT;
BEGIN
    -- Delete old verification codes (older than 7 days)
    DELETE FROM public.sms_verification_codes
    WHERE created_at < NOW() - INTERVAL '7 days'
        AND (used_at IS NOT NULL OR expires_at < NOW());

    GET DIAGNOSTICS v_deleted_codes = ROW_COUNT;

    -- Delete old rate limits (older than 24 hours and not blocked)
    DELETE FROM public.sms_rate_limits
    WHERE window_end < NOW() - INTERVAL '24 hours'
        AND is_blocked = FALSE;

    GET DIAGNOSTICS v_deleted_rate_limits = ROW_COUNT;

    -- Delete old delivery logs (older than 30 days, keep failures for 90 days)
    DELETE FROM public.sms_delivery_logs
    WHERE created_at < NOW() - INTERVAL '30 days'
        AND status IN ('delivered', 'sent');

    GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;

    -- Log cleanup activity
    INSERT INTO public.sms_delivery_logs (
        user_id, phone_number, purpose, status, provider, created_at
    ) VALUES (
        NULL, 'system', 'cleanup', 'delivered', 'system', NOW()
    );

    RETURN QUERY SELECT
        v_deleted_codes::BIGINT,
        v_deleted_rate_limits::BIGINT,
        v_deleted_logs::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get SMS statistics
CREATE OR REPLACE FUNCTION public.get_sms_statistics(
    p_user_id UUID DEFAULT NULL,
    p_time_range INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    total_sent BIGINT,
    successful_deliveries BIGINT,
    failed_deliveries BIGINT,
    success_rate DECIMAL(5,2),
    average_delivery_time INTERVAL,
    total_cost DECIMAL(10,4),
    unique_recipients BIGINT,
    by_purpose JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        NOW() - p_time_range as period_start,
        NOW() as period_end,
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as successful_deliveries,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_deliveries,
        CASE
            WHEN COUNT(*) > 0 THEN ROUND(
                (COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
            )
            ELSE 0
        END as success_rate,
        AVG(delivered_at - sent_at) as average_delivery_time,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(DISTINCT phone_number) as unique_recipients,
        jsonb_agg(
            jsonb_build_object(
                'purpose', purpose,
                'count', COUNT(*),
                'success_rate', CASE
                    WHEN COUNT(*) > 0 THEN ROUND(
                        (COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
                    )
                    ELSE 0
                END
            )
        ) FILTER (WHERE purpose IS NOT NULL) as by_purpose
    FROM public.sms_delivery_logs
    WHERE created_at > NOW() - p_time_range
        AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for SMS tables
-- Allow authenticated users to see their own data only
DROP POLICY IF EXISTS "Users can view their own SMS verification codes" ON public.sms_verification_codes;
CREATE POLICY "Users can view their own SMS verification codes" ON public.sms_verification_codes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own SMS verification codes" ON public.sms_verification_codes;
CREATE POLICY "Users can insert their own SMS verification codes" ON public.sms_verification_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own SMS verification codes" ON public.sms_verification_codes;
CREATE POLICY "Users can update their own SMS verification codes" ON public.sms_verification_codes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own phone verifications" ON public.phone_verifications;
CREATE POLICY "Users can view their own phone verifications" ON public.phone_verifications
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own SMS delivery logs" ON public.sms_delivery_logs;
CREATE POLICY "Users can view their own SMS delivery logs" ON public.sms_delivery_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for monitoring
DROP POLICY IF EXISTS "Admins can view all SMS verification codes" ON public.sms_verification_codes;
CREATE POLICY "Admins can view all SMS verification codes" ON public.sms_verification_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin_ansut'
        )
    );

CREATE POLICY "Admins can view all phone verifications" ON public.phone_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin_ansut'
        )
    );

CREATE POLICY "Admins can view all SMS delivery logs" ON public.sms_delivery_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin_ansut'
        )
    );

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION public.check_sms_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_sms_security_risks TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_sms_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sms_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_sms_data TO authenticated;

-- Grant admin permissions for audit functions
GRANT EXECUTE ON FUNCTION public.audit_sms_activity TO anon;
GRANT EXECUTE ON FUNCTION public.get_sms_statistics TO anon;

-- Create automated cleanup job (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-sms-data', '0 2 * * *', 'SELECT cleanup_sms_data();');

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sms_verification_codes_user_phone
    ON public.sms_verification_codes(user_id, phone_number);

CREATE INDEX IF NOT EXISTS idx_sms_verification_codes_purpose_created
    ON public.sms_verification_codes(purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_verified
    ON public.phone_verifications(user_id, is_verified);

CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_identifier_blocked
    ON public.sms_rate_limits(identifier, is_blocked, identifier_type);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_status_created
    ON public.sms_delivery_logs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_user_purpose
    ON public.sms_delivery_logs(user_id, purpose, created_at DESC);

-- Add comments for documentation
COMMENT ON FUNCTION public.check_sms_rate_limit IS 'Advanced rate limiting for SMS with auto-blocking';
COMMENT ON FUNCTION public.check_sms_security_risks IS 'Security risk assessment for SMS requests';
COMMENT ON FUNCTION public.audit_sms_activity IS 'Audit SMS activity for security monitoring';
COMMENT ON FUNCTION public.cleanup_sms_data IS 'Cleanup old SMS data to maintain performance';
COMMENT ON FUNCTION public.get_sms_statistics IS 'Get SMS delivery statistics and metrics';
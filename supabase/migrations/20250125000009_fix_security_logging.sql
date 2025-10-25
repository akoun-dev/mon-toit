-- Migration: Fix Security Logging Function
-- Description: Create missing log_security_event RPC function

-- Create the log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_source TEXT DEFAULT 'client',
    p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_events (
        event_type,
        severity,
        source,
        details
    ) VALUES (
        p_event_type,
        p_severity,
        p_source,
        p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;

-- Add comment
COMMENT ON FUNCTION public.log_security_event IS 'Log security events to the security_events table';
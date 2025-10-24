-- Migration: Fix OTP function permissions
-- Description: Add missing permissions for OTP functions

-- Grant permissions to anon users for OTP functions (needed for unauthenticated users)
GRANT EXECUTE ON FUNCTION public.create_otp_code TO anon;
GRANT EXECUTE ON FUNCTION public.verify_otp_code TO anon;
GRANT EXECUTE ON FUNCTION public.send_otp_email TO anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otp_codes TO anon;
GRANT EXECUTE ON FUNCTION public.check_otp_rate_limit TO anon;

-- Add comments
COMMENT ON FUNCTION public.create_otp_code IS 'Generate OTP code - now accessible to all users';
COMMENT ON FUNCTION public.verify_otp_code IS 'Verify OTP code - now accessible to all users';
COMMENT ON FUNCTION public.send_otp_email IS 'Send OTP email - now accessible to all users';
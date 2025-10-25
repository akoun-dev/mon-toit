-- Fix permissions for RPC functions
-- Grant execute permissions to the original check_login_rate_limit function

GRANT EXECUTE ON FUNCTION check_login_rate_limit(TEXT, INET) TO authenticated;

-- Also grant permissions for login_attempts table to authenticated users for INSERT operations
-- This is needed for the login rate limiting to work properly
CREATE POLICY "Users can insert their own login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (
    email = current_setting('app.current_email', true) OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );
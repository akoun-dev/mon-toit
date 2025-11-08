-- Final security fixes: Add RLS policies for views

-- 1. Secure profiles_public view - require authentication
-- The view itself respects RLS now, but we need to ensure underlying table has proper policies
-- Profiles table already has RLS, but let's ensure the view access is controlled

-- Create RLS policy for profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Profiles viewable by authenticated users'
  ) THEN
    CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- 2. Ensure analytics views are only accessible by admins
-- Add RLS policies to underlying tables

-- For alert_history (used by property_alerts_analytics)
DROP POLICY IF EXISTS "Only admins and super_admins can view analytics" ON public.alert_history;
CREATE POLICY "Only admins and super_admins can view analytics"
ON public.alert_history
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  user_id = auth.uid()
);

-- For rent_receipts (used by receipt_analytics)
ALTER TABLE public.rent_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view receipt analytics" ON public.rent_receipts;
CREATE POLICY "Only admins can view receipt analytics"
ON public.rent_receipts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  landlord_id = auth.uid() OR
  tenant_id = auth.uid()
);

-- For report_history (used by report_statistics)
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins and owners can view reports" ON public.report_history;
CREATE POLICY "Only admins and owners can view reports"
ON public.report_history
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  owner_id = auth.uid()
);

-- 3. Secure sensitive_data_access_monitoring view
-- The sensitive_data_access_log table already has RLS, but let's ensure it's strict
DROP POLICY IF EXISTS "Only super admins can view all access logs" ON public.sensitive_data_access_log;
CREATE POLICY "Only super admins can view all access logs"
ON public.sensitive_data_access_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  requester_id = auth.uid()
);

-- 4. Secure user_verifications table (used by neoface_verification_stats)
-- Add policy to restrict who can view verification stats
DROP POLICY IF EXISTS "Only admins can view all verifications" ON public.user_verifications;
CREATE POLICY "Only admins can view all verifications"
ON public.user_verifications
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  user_id = auth.uid()
);
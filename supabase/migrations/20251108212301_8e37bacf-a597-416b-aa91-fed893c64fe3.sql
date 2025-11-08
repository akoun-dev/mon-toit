-- Fix SECURITY DEFINER views by recreating them with security_invoker=on

-- 1. Drop and recreate profiles_public view with security_invoker
DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public
WITH (security_invoker=on)
AS
SELECT 
  id,
  full_name,
  user_type,
  city,
  bio,
  avatar_url,
  cnib_verified AS oneci_verified,
  cnam_verified,
  face_verified,
  is_verified,
  created_at,
  updated_at
FROM profiles;

-- 2. Drop and recreate neoface_verification_stats with security_invoker
DROP VIEW IF EXISTS public.neoface_verification_stats CASCADE;

CREATE VIEW public.neoface_verification_stats
WITH (security_invoker=on)
AS
SELECT 
  date(face_verified_at) AS verification_date,
  count(*) AS total_verifications,
  count(*) FILTER (WHERE (face_verification_status = 'verified')) AS successful,
  count(*) FILTER (WHERE (face_verification_status = 'failed')) AS failed,
  avg(neoface_matching_score) AS avg_score,
  min(neoface_matching_score) AS min_score,
  max(neoface_matching_score) AS max_score
FROM user_verifications
WHERE (face_verified_at IS NOT NULL)
GROUP BY (date(face_verified_at))
ORDER BY (date(face_verified_at)) DESC;

-- 3. Drop and recreate property_alerts_analytics with security_invoker
DROP VIEW IF EXISTS public.property_alerts_analytics CASCADE;

CREATE VIEW public.property_alerts_analytics
WITH (security_invoker=on)
AS
SELECT 
  date_trunc('day', created_at) AS date,
  alert_type,
  delivery_method,
  delivery_status,
  count(*) AS total_sent,
  count(*) FILTER (WHERE (opened_at IS NOT NULL)) AS opened_count,
  count(*) FILTER (WHERE (clicked_at IS NOT NULL)) AS clicked_count,
  round((((count(*) FILTER (WHERE (opened_at IS NOT NULL)))::numeric / (NULLIF(count(*), 0))::numeric) * 100), 2) AS open_rate,
  round((((count(*) FILTER (WHERE (clicked_at IS NOT NULL)))::numeric / (NULLIF(count(*), 0))::numeric) * 100), 2) AS click_rate
FROM alert_history ah
GROUP BY (date_trunc('day', created_at)), alert_type, delivery_method, delivery_status;

-- 4. Drop and recreate receipt_analytics with security_invoker
DROP VIEW IF EXISTS public.receipt_analytics CASCADE;

CREATE VIEW public.receipt_analytics
WITH (security_invoker=on)
AS
SELECT 
  date_trunc('month', period_start::timestamp with time zone) AS month,
  count(*) AS total_receipts,
  sum(total_amount) AS total_amount,
  count(DISTINCT landlord_id) AS unique_landlords,
  count(DISTINCT tenant_id) AS unique_tenants
FROM rent_receipts
GROUP BY (date_trunc('month', period_start::timestamp with time zone))
ORDER BY (date_trunc('month', period_start::timestamp with time zone)) DESC;

-- 5. Drop and recreate report_statistics with security_invoker
DROP VIEW IF EXISTS public.report_statistics CASCADE;

CREATE VIEW public.report_statistics
WITH (security_invoker=on)
AS
SELECT 
  date_trunc('month', generated_at) AS month,
  report_type,
  count(*) AS total_reports,
  count(*) FILTER (WHERE (sent_status = 'sent')) AS sent_count,
  count(*) FILTER (WHERE (sent_status = 'failed')) AS failed_count,
  count(DISTINCT owner_id) AS unique_owners,
  round((((count(*) FILTER (WHERE (sent_status = 'sent')))::numeric / (NULLIF(count(*), 0))::numeric) * 100), 2) AS success_rate
FROM report_history rh
GROUP BY (date_trunc('month', generated_at)), report_type;

-- 6. Drop and recreate sensitive_data_access_monitoring with security_invoker
DROP VIEW IF EXISTS public.sensitive_data_access_monitoring CASCADE;

CREATE VIEW public.sensitive_data_access_monitoring
WITH (security_invoker=on)
AS
SELECT 
  sdal.id,
  sdal.requester_id,
  pr.full_name AS requester_name,
  sdal.target_user_id,
  pt.full_name AS target_name,
  sdal.data_type,
  sdal.access_granted,
  sdal.relationship_type,
  sdal.metadata,
  sdal.accessed_at,
  CASE
    WHEN ((sdal.metadata ->> 'has_2fa') = 'true') THEN '✓ 2FA'
    WHEN ((sdal.metadata ->> 'has_2fa') = 'false') THEN '✗ NO 2FA'
    ELSE 'N/A'
  END AS mfa_status
FROM sensitive_data_access_log sdal
LEFT JOIN profiles pr ON pr.id = sdal.requester_id
LEFT JOIN profiles pt ON pt.id = sdal.target_user_id
ORDER BY sdal.accessed_at DESC;

-- Fix function without search_path - drop with CASCADE then recreate as TRIGGER function
DROP FUNCTION IF EXISTS public.check_alert_limit() CASCADE;

CREATE FUNCTION public.check_alert_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_count INTEGER;
  max_alerts INTEGER := 5;
BEGIN
  SELECT COUNT(*) INTO alert_count
  FROM property_alerts
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF alert_count >= max_alerts THEN
    RAISE EXCEPTION 'Alert limit reached. Maximum % alerts allowed.', max_alerts;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger that was dropped with CASCADE
CREATE TRIGGER enforce_alert_limit
BEFORE INSERT ON geographic_alerts
FOR EACH ROW
EXECUTE FUNCTION check_alert_limit();
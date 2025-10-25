-- Add unique constraint to user_roles_summary table
ALTER TABLE public.user_roles_summary
ADD CONSTRAINT user_roles_summary_user_type_unique UNIQUE (user_type);

-- Initialize summary data if it doesn't exist
INSERT INTO public.user_roles_summary (user_type, total_users, verified_users, unverified_users, created_this_month, last_30_days)
SELECT
  user_type,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
  COUNT(*) FILTER (WHERE is_verified = false) as unverified_users,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as created_this_month,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
FROM public.profiles
GROUP BY user_type
ON CONFLICT (user_type) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  verified_users = EXCLUDED.verified_users,
  unverified_users = EXCLUDED.unverified_users,
  created_this_month = EXCLUDED.created_this_month,
  last_30_days = EXCLUDED.last_30_days,
  updated_at = NOW();
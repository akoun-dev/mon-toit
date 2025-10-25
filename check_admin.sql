-- Check if admin user exists in auth.users and profiles
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.user_type,
  p.is_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@mon-toit.ci';
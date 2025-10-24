-- Migration: Create User Roles Summary
-- Description: Create user_roles_summary table for admin dashboard

CREATE TABLE IF NOT EXISTS public.user_roles_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type user_type NOT NULL,
  total_users INTEGER NOT NULL DEFAULT 0,
  verified_users INTEGER NOT NULL DEFAULT 0,
  unverified_users INTEGER NOT NULL DEFAULT 0,
  created_this_month INTEGER NOT NULL DEFAULT 0,
  last_30_days INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_summary_user_type ON public.user_roles_summary(user_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_summary_updated_at ON public.user_roles_summary(updated_at);

-- Add RLS policies
ALTER TABLE public.user_roles_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read summary
CREATE POLICY "Admins can view user roles summary" ON public.user_roles_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- Create policy for system to manage summary
CREATE POLICY "System can manage user roles summary" ON public.user_roles_summary
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Create function to update user roles summary
CREATE OR REPLACE FUNCTION update_user_roles_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update summary for the specific user type
  INSERT INTO public.user_roles_summary (user_type, total_users, verified_users, unverified_users, created_this_month, last_30_days)
  SELECT
    p.user_type,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE p.is_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE p.is_verified = false) as unverified_users,
    COUNT(*) FILTER (WHERE p.created_at >= date_trunc('month', CURRENT_DATE)) as created_this_month,
    COUNT(*) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
  FROM public.profiles p
  WHERE p.user_type = COALESCE(NEW.user_type, OLD.user_type)
    AND p.id != COALESCE(NEW.id, OLD.id)  -- Exclude the current record if it's an update
  GROUP BY p.user_type
  ON CONFLICT (user_type) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    verified_users = EXCLUDED.verified_users,
    unverified_users = EXCLUDED.unverified_users,
    created_this_month = EXCLUDED.created_this_month,
    last_30_days = EXCLUDED.last_30_days,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update summary when profiles change
CREATE TRIGGER trigger_update_user_roles_summary_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_summary();

CREATE TRIGGER trigger_update_user_roles_summary_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.user_type IS DISTINCT FROM NEW.user_type OR OLD.is_verified IS DISTINCT FROM NEW.is_verified)
  EXECUTE FUNCTION update_user_roles_summary();

CREATE TRIGGER trigger_update_user_roles_summary_delete
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_summary();

-- Initialize summary data
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
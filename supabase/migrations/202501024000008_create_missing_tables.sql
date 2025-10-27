-- Migration: Create missing tables for the application
-- Description: Create all tables that the frontend expects but don't exist yet

-- Table user_roles_summary (vue ou fonction)
CREATE OR REPLACE VIEW public.user_roles_summary AS
SELECT
  uar.user_id,
  uar.active_role,
  uar.available_roles,
  p.full_name,
  p.user_type,
  p.is_verified,
  COUNT(ur.id) as role_history_count
FROM public.user_active_roles uar
LEFT JOIN public.profiles p ON uar.user_id = p.id
LEFT JOIN public.user_roles ur ON uar.user_id = ur.user_id
GROUP BY uar.user_id, uar.active_role, uar.available_roles, p.full_name, p.user_type, p.is_verified;

-- Table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  metadata JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table rental_applications
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status public.application_status DEFAULT 'pending',
  cover_letter TEXT,
  documents JSONB DEFAULT '[]',
  application_score INTEGER,
  proposed_rent INTEGER,
  move_in_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'fr',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  property_alerts BOOLEAN DEFAULT false,
  preferred_areas TEXT[],
  budget_min INTEGER,
  budget_max INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Table user_favorites
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, property_id)
);

-- Table search_history
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  search_filters JSONB,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Function check_login_rate_limit
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE (
  allowed BOOLEAN,
  attempts_count INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  attempts_count INTEGER;
  reset_at TIMESTAMP WITH TIME ZONE;
  allowed BOOLEAN;
BEGIN
  -- Count attempts in the last 15 minutes
  SELECT COUNT(*) INTO attempts_count
  FROM public.login_attempts
  WHERE email = p_email
    AND created_at > now() - interval '15 minutes';

  -- Reset time for rate limit
  SELECT created_at + interval '15 minutes' INTO reset_at
  FROM public.login_attempts
  WHERE email = p_email
  ORDER BY created_at DESC
  LIMIT 1;

  -- Allow up to 5 attempts per 15 minutes
  allowed := attempts_count < 5;

  RETURN QUERY SELECT allowed, attempts_count, COALESCE(reset_at, now()) as reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_expires_at_idx ON public.notifications(expires_at);

CREATE INDEX IF NOT EXISTS rental_applications_property_id_idx ON public.rental_applications(property_id);
CREATE INDEX IF NOT EXISTS rental_applications_applicant_id_idx ON public.rental_applications(applicant_id);
CREATE INDEX IF NOT EXISTS rental_applications_status_idx ON public.rental_applications(status);

CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_property_id_idx ON public.user_favorites(property_id);

CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON public.search_history(created_at);

-- Triggers for updated_at
CREATE TRIGGER handle_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_rental_applications_updated_at
  BEFORE UPDATE ON public.rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- RLS Policies for rental_applications
CREATE POLICY "Users can view own rental applications" ON public.rental_applications
  FOR SELECT USING (auth.uid() IS NOT NULL AND applicant_id = auth.uid());

CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own rental applications" ON public.rental_applications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND applicant_id = auth.uid());

CREATE POLICY "Users can update own rental applications" ON public.rental_applications
  FOR UPDATE USING (auth.uid() IS NOT NULL AND applicant_id = auth.uid());

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- RLS Policies for user_favorites
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- RLS Policies for search_history
CREATE POLICY "Users can manage own search history" ON public.search_history
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Add comments
COMMENT ON VIEW public.user_roles_summary IS 'Vue résumée des rôles utilisateurs';
COMMENT ON TABLE public.notifications IS 'Notifications système pour les utilisateurs';
COMMENT ON TABLE public.rental_applications IS 'Candidatures de location';
COMMENT ON TABLE public.user_preferences IS 'Préférences utilisateur';
COMMENT ON TABLE public.user_favorites IS 'Favoris des utilisateurs';
COMMENT ON TABLE public.search_history IS 'Historique des recherches';

-- Add tenant_score column to user_verifications if it doesn't exist
DO $$
BEGIN
  ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS tenant_score INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
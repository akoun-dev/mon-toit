-- Fix remaining issues identified in the migration analysis
-- This migration addresses problems that were not completely resolved

-- 1. Fix missing enums and inconsistent types in agency_mandates
DO $$ BEGIN
  -- Create mandate_type enum if it doesn't exist (different from the one in base types)
  CREATE TYPE public.mandate_type_enum AS ENUM (
    'exclusive',
    'non_exclusive', 
    'co_mandate'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  -- Create mandate_status enum if it doesn't exist
  CREATE TYPE public.mandate_status AS ENUM (
    'active',
    'expired',
    'terminated',
    'pending',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Fix agency_mandates.mandate_type to use proper enum
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_mandates'
    AND column_name = 'mandate_type'
    AND data_type = 'text'
  ) THEN
    UPDATE public.agency_mandates
    SET mandate_type = 'exclusive'
    WHERE mandate_type NOT IN ('exclusive', 'non_exclusive', 'co_mandate');

    ALTER TABLE public.agency_mandates
    ALTER COLUMN mandate_type TYPE public.mandate_type_enum
    USING mandate_type::public.mandate_type_enum;

    RAISE NOTICE '✓ Fixed agency_mandates.mandate_type to use mandate_type_enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter agency_mandates.mandate_type: %', SQLERRM;
END $$;

-- 2. Fix missing user_active_roles table
CREATE TABLE IF NOT EXISTS public.user_active_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  active_role public.user_type NOT NULL DEFAULT 'locataire',
  available_roles public.user_type[] DEFAULT ARRAY['locataire'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_active_roles
ALTER TABLE public.user_active_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_active_roles
CREATE POLICY "Users can view own active roles" ON public.user_active_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own active roles" ON public.user_active_roles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all active roles" ON public.user_active_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all active roles" ON public.user_active_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_user_active_roles_updated_at
  BEFORE UPDATE ON public.user_active_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Fix missing user_verifications table
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  oneci_status public.verification_status DEFAULT 'not_attempted',
  cnam_status public.verification_status DEFAULT 'not_attempted',
  face_status public.verification_status DEFAULT 'not_attempted',
  oneci_verified_at TIMESTAMPTZ,
  cnam_verified_at TIMESTAMPTZ,
  face_verified_at TIMESTAMPTZ,
  oneci_document_url TEXT,
  cnam_document_url TEXT,
  face_scan_data TEXT,
  verification_score INTEGER DEFAULT 0,
  tenant_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_verifications
CREATE POLICY "Users can view own verifications" ON public.user_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own verifications" ON public.user_verifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all verifications" ON public.user_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all verifications" ON public.user_verifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Fix missing login_attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  failure_reason TEXT
);

-- Create indexes for login_attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_success_attempted_at ON public.login_attempts(email, success, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_success_attempted_at ON public.login_attempts(ip_address, success, attempted_at DESC) WHERE ip_address IS NOT NULL;

-- 5. Fix missing otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for otp_verifications
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for otp_verifications
CREATE POLICY "Users can view own OTP records" ON public.otp_verifications
  FOR SELECT USING (
    email = current_setting('app.current_email', true) OR
    (auth.uid() IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.id = auth.uid() AND p.email = public.otp_verifications.email
     ))
  );

CREATE POLICY "Users can insert own OTP records" ON public.otp_verifications
  FOR INSERT WITH CHECK (
    email = current_setting('app.current_email', true)
  );

-- Trigger for updated_at
CREATE TRIGGER handle_otp_verifications_updated_at
  BEFORE UPDATE ON public.otp_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Fix missing user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Fix missing conversations table for messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user1_id, user2_id, property_id)
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER handle_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_active_roles_user_id ON public.user_active_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_roles_active_role ON public.user_active_roles(active_role);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_oneci_status ON public.user_verifications(oneci_status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_cnam_status ON public.user_verifications(cnam_status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_face_status ON public.user_verifications(face_status);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_expires ON public.otp_verifications(email, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active_expires ON public.user_sessions(user_id, is_active, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(user1_id, user2_id, updated_at DESC);

-- 9. Fix missing property_analytics table
CREATE TABLE IF NOT EXISTS public.property_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  view_date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, view_date)
);

-- Enable RLS for property_analytics
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_analytics
CREATE POLICY "Property owners can view own analytics" ON public.property_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics" ON public.property_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Create indexes for property_analytics
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_date ON public.property_analytics(property_id, view_date DESC);
CREATE INDEX IF NOT EXISTS idx_property_analytics_date_views ON public.property_analytics(view_date, total_views DESC);

-- 10. Fix missing property_visits table
CREATE TABLE IF NOT EXISTS public.property_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for property_visits
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_visits
CREATE POLICY "Property owners can view own property visits" ON public.property_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Visitors can view own visits" ON public.property_visits
  FOR SELECT USING (visitor_id = auth.uid());

CREATE POLICY "Users can schedule visits" ON public.property_visits
  FOR INSERT WITH CHECK (visitor_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER handle_property_visits_updated_at
  BEFORE UPDATE ON public.property_visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for property_visits
CREATE INDEX IF NOT EXISTS idx_property_visits_property_scheduled ON public.property_visits(property_id, scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_property_visits_visitor_scheduled ON public.property_visits(visitor_id, scheduled_date DESC) WHERE visitor_id IS NOT NULL;

-- Add comments for new tables
COMMENT ON TABLE public.user_active_roles IS 'Rôles actifs des utilisateurs avec permutation';
COMMENT ON TABLE public.user_verifications IS 'Vérifications d identité des utilisateurs';
COMMENT ON TABLE public.login_attempts IS 'Journal des tentatives de connexion';
COMMENT ON TABLE public.otp_verifications IS 'Codes OTP à usage unique';
COMMENT ON TABLE public.user_sessions IS 'Sessions utilisateur actives';
COMMENT ON TABLE public.conversations IS 'Conversations entre utilisateurs';
COMMENT ON TABLE public.property_analytics IS 'Analytiques des vues des propriétés';
COMMENT ON TABLE public.property_visits IS 'Visites programmées des propriétés';

RAISE NOTICE '✅ Remaining issues fixed successfully';
RAISE NOTICE '📊 Summary of fixes:';
RAISE NOTICE '  - Fixed agency_mandates.mandate_type enum';
RAISE NOTICE '  - Created missing user_active_roles table';
RAISE NOTICE '  - Created missing user_verifications table';
RAISE NOTICE '  - Created missing login_attempts table';
RAISE NOTICE '  - Created missing otp_verifications table';
RAISE NOTICE '  - Created missing user_sessions table';
RAISE NOTICE '  - Created missing conversations table';
RAISE NOTICE '  - Created missing property_analytics table';
RAISE NOTICE '  - Created missing property_visits table';
RAISE NOTICE '  - Added performance indexes for all new tables';
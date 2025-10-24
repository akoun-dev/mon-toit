-- Migration: Create Processing Config
-- Description: Create processing_config table for system configuration

CREATE TABLE IF NOT EXISTS public.processing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_processing_config_key ON public.processing_config(key);
CREATE INDEX IF NOT EXISTS idx_processing_config_category ON public.processing_config(category);
CREATE INDEX IF NOT EXISTS idx_processing_config_is_active ON public.processing_config(is_active);

-- Enable RLS
ALTER TABLE public.processing_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view processing config" ON public.processing_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage processing config" ON public.processing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Service role can manage processing config" ON public.processing_config
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Create function to get processing config value
CREATE OR REPLACE FUNCTION get_processing_config(p_key TEXT, p_default JSONB DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT value FROM public.processing_config WHERE key = p_key AND is_active = true LIMIT 1),
    p_default
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set processing config value
CREATE OR REPLACE FUNCTION set_processing_config(p_key TEXT, p_value JSONB, p_description TEXT DEFAULT NULL, p_category TEXT DEFAULT 'general')
RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
BEGIN
  INSERT INTO public.processing_config (key, value, description, category, created_by, updated_by)
  VALUES (p_key, p_value, p_description, p_category, auth.uid(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, processing_config.description),
    updated_at = NOW(),
    updated_by = auth.uid()
  RETURNING id INTO v_config_id;

  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default processing configurations
INSERT INTO public.processing_config (key, value, description, category) VALUES
  ('max_login_attempts', '5', 'Maximum failed login attempts before account lockout', 'security'),
  ('login_lockout_duration', '900', 'Duration in seconds for login lockout (15 minutes)', 'security'),
  ('password_min_length', '8', 'Minimum password length requirement', 'security'),
  ('password_require_special_chars', 'true', 'Require special characters in passwords', 'security'),
  ('session_timeout', '3600', 'Session timeout in seconds (1 hour)', 'security'),
  ('mfa_required_for_admin', 'true', 'Require MFA for admin users', 'security'),
  ('max_properties_per_owner', '50', 'Maximum properties a single owner can list', 'business'),
  ('max_photos_per_property', '20', 'Maximum photos allowed per property', 'business'),
  ('rental_application_auto_approve', 'false', 'Auto-approve rental applications that meet criteria', 'business'),
  ('notification_email_enabled', 'true', 'Enable email notifications', 'notifications'),
  ('notification_sms_enabled', 'false', 'Enable SMS notifications', 'notifications'),
  ('property_verification_required', 'true', 'Require property verification before listing', 'business'),
  ('user_registration_enabled', 'true', 'Allow new user registrations', 'general'),
  ('maintenance_mode', 'false', 'Put application in maintenance mode', 'general'),
  ('mapbox_default_zoom', '12', 'Default zoom level for mapbox maps', 'ui'),
  ('mapbox_center_lat', '5.3600', 'Default center latitude for Abidjan maps', 'ui'),
  ('mapbox_center_lng', '-4.0083', 'Default center longitude for Abidjan maps', 'ui')
ON CONFLICT (key) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_processing_config_updated_at
  BEFORE UPDATE ON public.processing_config
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.processing_config TO authenticated;
GRANT EXECUTE ON FUNCTION get_processing_config(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION set_processing_config(TEXT, JSONB, TEXT, TEXT) TO authenticated;
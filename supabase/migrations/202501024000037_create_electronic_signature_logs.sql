-- Migration: Create Electronic Signature Logs
-- Description: Create table for tracking electronic signature activities

CREATE TABLE IF NOT EXISTS public.electronic_signature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_id UUID,
  document_type TEXT,
  document_title TEXT,
  document_url TEXT,
  signature_data JSONB,
  signature_method TEXT DEFAULT 'electronic', -- electronic, digital, biometric
  status TEXT DEFAULT 'pending', -- pending, completed, failed, revoked, expired
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  verification_token TEXT,
  audit_trail JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_user_id ON public.electronic_signature_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_status ON public.electronic_signature_logs(status);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_document_id ON public.electronic_signature_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_created_at ON public.electronic_signature_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_signed_at ON public.electronic_signature_logs(signed_at);
CREATE INDEX IF NOT EXISTS idx_electronic_signature_logs_expires_at ON public.electronic_signature_logs(expires_at);

-- Enable RLS
ALTER TABLE public.electronic_signature_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own signature logs" ON public.electronic_signature_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own signature logs" ON public.electronic_signature_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own signature logs" ON public.electronic_signature_logs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all signature logs" ON public.electronic_signature_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all signature logs" ON public.electronic_signature_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_electronic_signature_logs_updated_at
  BEFORE UPDATE ON public.electronic_signature_logs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Functions for signature management
CREATE OR REPLACE FUNCTION create_signature_request(
  p_user_id UUID,
  p_document_id UUID,
  p_document_title TEXT,
  p_document_url TEXT DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT 72
)
RETURNS UUID AS $$
DECLARE
  v_signature_id UUID;
  v_verification_token TEXT;
BEGIN
  -- Generate verification token
  v_verification_token := encode(gen_random_bytes(32), 'hex');

  -- Insert signature request
  INSERT INTO public.electronic_signature_logs (
    user_id, document_id, document_title, document_url,
    status, verification_token, expires_at
  ) VALUES (
    p_user_id, p_document_id, p_document_title, p_document_url,
    'pending', v_verification_token, NOW() + INTERVAL '1 hour' * p_expires_hours
  )
  RETURNING id INTO v_signature_id;

  RETURN v_signature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_signature(
  p_signature_id UUID,
  p_signature_data JSONB,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id and verify ownership
  SELECT user_id INTO v_user_id
  FROM public.electronic_signature_logs
  WHERE id = p_signature_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update signature record
  UPDATE public.electronic_signature_logs
  SET
    status = 'completed',
    signature_data = p_signature_data,
    ip_address = p_ip_address,
    user_agent = p_user_agent,
    signed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_signature_id
    AND user_id = COALESCE(v_user_id, auth.uid());

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.electronic_signature_logs TO authenticated;
GRANT EXECUTE ON FUNCTION create_signature_request(UUID, UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_signature(UUID, JSONB, INET, TEXT) TO authenticated;

-- Add comments
COMMENT ON TABLE public.electronic_signature_logs IS 'Journal des activités de signature électronique';
COMMENT ON FUNCTION create_signature_request IS 'Créer une demande de signature électronique';
COMMENT ON FUNCTION complete_signature IS 'Compléter une signature électronique';
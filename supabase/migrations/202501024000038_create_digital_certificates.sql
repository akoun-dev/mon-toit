-- Migration: Create Digital Certificates
-- Description: Create table for managing digital certificates and credentials

CREATE TYPE certificate_type AS ENUM ('identity', 'professional', 'academic', 'property', 'other');
CREATE TYPE certificate_status AS ENUM ('active', 'expired', 'revoked', 'pending', 'suspended');

CREATE TABLE IF NOT EXISTS public.digital_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  certificate_number TEXT UNIQUE,
  certificate_type certificate_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  certificate_status certificate_status DEFAULT 'pending',
  certificate_url TEXT,
  thumbnail_url TEXT,
  verification_code TEXT UNIQUE,
  public_key TEXT,
  digital_signature TEXT,
  metadata JSONB DEFAULT '{}',
  verification_history JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_digital_certificates_user_id ON public.digital_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_certificate_type ON public.digital_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_certificate_status ON public.digital_certificates(certificate_status);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_certificate_number ON public.digital_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_verification_code ON public.digital_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_issue_date ON public.digital_certificates(issue_date);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_expiry_date ON public.digital_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_created_at ON public.digital_certificates(created_at);

-- Enable RLS
ALTER TABLE public.digital_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own certificates" ON public.digital_certificates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own certificates" ON public.digital_certificates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own certificates" ON public.digital_certificates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all certificates" ON public.digital_certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all certificates" ON public.digital_certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_digital_certificates_updated_at
  BEFORE UPDATE ON public.digital_certificates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Functions for certificate management
CREATE OR REPLACE FUNCTION generate_certificate_number(p_certificate_type certificate_type)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_sequence_num INTEGER;
  v_year_part TEXT := EXTRACT(year FROM CURRENT_DATE)::TEXT;
BEGIN
  -- Determine prefix based on certificate type
  CASE p_certificate_type
    WHEN 'identity' THEN v_prefix := 'ID-';
    WHEN 'professional' THEN v_prefix := 'PR-';
    WHEN 'academic' THEN v_prefix := 'AC-';
    WHEN 'property' THEN v_prefix := 'PRP-';
    WHEN 'other' THEN v_prefix := 'OTH-';
    ELSE v_prefix := 'GEN-';
  END CASE;

  -- Get next sequence number for this type and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 7) AS INTEGER)), 0) + 1
  INTO v_sequence_num
  FROM public.digital_certificates
  WHERE certificate_number LIKE v_prefix || v_year_part || '%';

  RETURN v_prefix || v_year_part || LPAD(v_sequence_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_certificate(
  p_user_id UUID,
  p_certificate_type certificate_type,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_issuing_authority TEXT DEFAULT NULL,
  p_issue_date DATE DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_certificate_id UUID;
  v_certificate_number TEXT;
  v_verification_code TEXT;
BEGIN
  -- Generate certificate number
  v_certificate_number := generate_certificate_number(p_certificate_type);

  -- Generate verification code
  v_verification_code := upper(encode(gen_random_bytes(6), 'hex'));

  -- Insert certificate
  INSERT INTO public.digital_certificates (
    user_id, certificate_number, certificate_type, title, description,
    issuing_authority, issue_date, expiry_date, verification_code
  ) VALUES (
    p_user_id, v_certificate_number, p_certificate_type, p_title, p_description,
    p_issuing_authority, p_issue_date, p_expiry_date, v_verification_code
  )
  RETURNING id INTO v_certificate_id;

  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_certificate(
  p_verification_code TEXT,
  p_verified_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_certificate_id UUID;
  v_current_status certificate_status;
BEGIN
  -- Get certificate and current status
  SELECT id, certificate_status
  INTO v_certificate_id, v_current_status
  FROM public.digital_certificates
  WHERE verification_code = p_verification_code;

  IF NOT FOUND OR v_current_status != 'pending' THEN
    RETURN false;
  END IF;

  -- Update certificate as verified
  UPDATE public.digital_certificates
  SET
    certificate_status = 'active',
    is_verified = true,
    verified_by = COALESCE(p_verified_by, auth.uid()),
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = v_certificate_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_certificate(
  p_certificate_id UUID,
  p_revoked_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.digital_certificates
  SET
    certificate_status = 'revoked',
    revoked_reason = p_revoked_reason,
    revoked_at = NOW(),
    updated_at = NOW()
  WHERE id = p_certificate_id
    AND certificate_status IN ('active', 'pending');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for expiring certificates
CREATE OR REPLACE FUNCTION get_expiring_certificates(p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  certificate_id UUID,
  user_id UUID,
  certificate_number TEXT,
  title TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER,
  user_email TEXT,
  user_full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id as certificate_id,
    dc.user_id,
    dc.certificate_number,
    dc.title,
    dc.expiry_date,
    (dc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    u.email as user_email,
    p.full_name as user_full_name
  FROM public.digital_certificates dc
  INNER JOIN auth.users u ON u.id = dc.user_id
  INNER JOIN public.profiles p ON p.id = dc.user_id
  WHERE dc.certificate_status = 'active'
    AND dc.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '1 day' * p_days_ahead)
  ORDER BY dc.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.digital_certificates TO authenticated;
GRANT EXECUTE ON FUNCTION generate_certificate_number(certificate_type) TO authenticated;
GRANT EXECUTE ON FUNCTION create_certificate(UUID, certificate_type, TEXT, TEXT, TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_certificate(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_certificate(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_certificates(INTEGER) TO authenticated;

-- Add comments
COMMENT ON TABLE public.digital_certificates IS 'Certificats numériques et attestations';
COMMENT ON FUNCTION create_certificate IS 'Créer un nouveau certificat numérique';
COMMENT ON FUNCTION verify_certificate IS 'Vérifier un certificat avec code de vérification';
COMMENT ON FUNCTION revoke_certificate IS 'Révoquer un certificat';
COMMENT ON FUNCTION get_expiring_certificates IS 'Obtenir les certificats qui expirent bientôt';
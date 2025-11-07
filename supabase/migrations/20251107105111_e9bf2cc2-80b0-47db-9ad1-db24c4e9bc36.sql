-- Fix security warnings for MZAKA-BF functions

-- Recréer update_updated_at_column avec search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recréer generate_fa_reference avec search_path
CREATE OR REPLACE FUNCTION generate_fa_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FAZ-MZAKA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recréer generate_verify_id avec search_path  
CREATE OR REPLACE FUNCTION generate_verify_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'VRF-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
END;
$$ LANGUAGE plpgsql SET search_path = public;
-- Migration: Create agency_mandates table and fix rental_applications columns
-- Description: Add missing agency_mandates table and missing rental_applications columns

-- Create agency_mandates table
CREATE TABLE IF NOT EXISTS public.agency_mandates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mandate_number TEXT UNIQUE,
  mandate_type TEXT DEFAULT 'exclusive', -- exclusive, non_exclusive, co_mandate
  status TEXT DEFAULT 'active', -- active, expired, terminated, pending
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_terms TEXT,
  commission_rate DECIMAL(5,2), -- Percentage
  fixed_fee INTEGER,
  exclusive_period INTEGER, -- Days
  territory TEXT,
  marketing_budget INTEGER,
  responsibilities JSONB DEFAULT '{}',
  restrictions TEXT[],
  signed_document_url TEXT,
  owner_signature_url TEXT,
  agency_signature_url TEXT,
  notes TEXT,
  termination_reason TEXT,
  termination_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add missing columns to rental_applications
DO $$
BEGIN
  -- Add missing columns if they don't exist
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS processing_deadline TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS guarantor_info JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS employment_info JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'pending';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS credit_score INTEGER;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS income_verification_status TEXT DEFAULT 'pending';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS reference_contacts JSONB DEFAULT '[]';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS previous_landlord_info JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS special_requests TEXT;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS viewing_dates DATE[];
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS pet_ownership_info JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS smoking_policy_acknowledged BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS additional_occupants JSONB DEFAULT '[]';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create indexes for agency_mandates
CREATE INDEX IF NOT EXISTS agency_mandates_agency_id_idx ON public.agency_mandates(agency_id);
CREATE INDEX IF NOT EXISTS agency_mandates_owner_id_idx ON public.agency_mandates(owner_id);
CREATE INDEX IF NOT EXISTS agency_mandates_property_id_idx ON public.agency_mandates(property_id);
CREATE INDEX IF NOT EXISTS agency_mandates_status_idx ON public.agency_mandates(status);
CREATE INDEX IF NOT EXISTS agency_mandates_mandate_number_idx ON public.agency_mandates(mandate_number);

-- Create additional indexes for rental_applications
CREATE INDEX IF NOT EXISTS rental_applications_processing_deadline_idx ON public.rental_applications(processing_deadline);
CREATE INDEX IF NOT EXISTS rental_applications_background_check_status_idx ON public.rental_applications(background_check_status);

-- Triggers for updated_at
CREATE TRIGGER handle_agency_mandates_updated_at
  BEFORE UPDATE ON public.agency_mandates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for agency_mandates
ALTER TABLE public.agency_mandates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_mandates
CREATE POLICY "Agency users can view own mandates" ON public.agency_mandates
  FOR SELECT USING (agency_id = auth.uid());

CREATE POLICY "Property owners can view own property mandates" ON public.agency_mandates
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Agency users can insert mandates" ON public.agency_mandates
  FOR INSERT WITH CHECK (agency_id = auth.uid());

CREATE POLICY "Agency users can update own mandates" ON public.agency_mandates
  FOR UPDATE USING (agency_id = auth.uid());

CREATE POLICY "Property owners can update own property mandates" ON public.agency_mandates
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Agency users can delete own mandates" ON public.agency_mandates
  FOR DELETE USING (agency_id = auth.uid());

CREATE POLICY "Admins can view all mandates" ON public.agency_mandates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all mandates" ON public.agency_mandates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- RPC Functions for agency mandates
CREATE OR REPLACE FUNCTION public.get_agency_mandates(
  p_agency_id UUID DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_mandate_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  agency_id UUID,
  owner_id UUID,
  mandate_number TEXT,
  mandate_type TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  commission_rate DECIMAL(5,2),
  fixed_fee INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  property_title TEXT,
  agency_name TEXT,
  owner_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.property_id,
    am.agency_id,
    am.owner_id,
    am.mandate_number,
    am.mandate_type,
    am.status,
    am.start_date,
    am.end_date,
    am.commission_rate,
    am.fixed_fee,
    am.created_at,
    am.updated_at,
    p.title as property_title,
    ag.full_name as agency_name,
    ow.full_name as owner_name
  FROM public.agency_mandates am
  LEFT JOIN public.properties p ON am.property_id = p.id
  LEFT JOIN public.profiles ag ON am.agency_id = ag.id
  LEFT JOIN public.profiles ow ON am.owner_id = ow.id
  WHERE
    (p_agency_id IS NULL OR am.agency_id = p_agency_id)
    AND (p_owner_id IS NULL OR am.owner_id = p_owner_id)
    AND (p_status IS NULL OR am.status = p_status)
    AND (p_mandate_type IS NULL OR am.mandate_type = p_mandate_type)
  ORDER BY am.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create mandate number
CREATE OR REPLACE FUNCTION public.generate_mandate_number()
RETURNS TEXT AS $$
DECLARE
  mandate_number TEXT;
  year_part TEXT := EXTRACT(year FROM CURRENT_DATE)::TEXT;
  sequence_num INTEGER;
BEGIN
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(mandate_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.agency_mandates
  WHERE mandate_number LIKE 'MAND-' || year_part || '%';

  mandate_number := 'MAND-' || year_part || LPAD(sequence_num::TEXT, 4, '0');

  RETURN mandate_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.agency_mandates IS 'Mandats de gestion immobilière pour les agences';
COMMENT ON COLUMN public.agency_mandates.mandate_type IS 'Type de mandat: exclusive, non_exclusive, co_mandate';
COMMENT ON COLUMN public.agency_mandates.commission_rate IS 'Taux de commission en pourcentage';
COMMENT ON COLUMN public.agency_mandates.fixed_fee IS 'Frais fixes en FCFA';
COMMENT ON FUNCTION public.get_agency_mandates IS 'Récupérer les mandats agence avec filtres';
COMMENT ON FUNCTION public.generate_mandate_number IS 'Générer un numéro de mandat automatique';

-- Grant permissions for RPC functions
GRANT EXECUTE ON FUNCTION public.get_agency_mandates TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_mandate_number TO authenticated;
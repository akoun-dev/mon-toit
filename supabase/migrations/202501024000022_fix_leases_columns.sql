-- Migration: Fix leases table column names
-- Description: Add landlord_id and tenant_id columns or map them to existing columns

-- Add missing columns to leases table if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leases') THEN
    -- Add landlord_id as alias for owner_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'landlord_id') THEN
      ALTER TABLE public.leases ADD COLUMN landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- tenant_id should already exist but check anyway
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'tenant_id') THEN
      ALTER TABLE public.leases ADD COLUMN tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Copy existing values if landlord_id is new and owner_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'landlord_id') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'owner_id') THEN
      UPDATE public.leases
      SET landlord_id = owner_id
      WHERE landlord_id IS NULL AND owner_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS leases_landlord_id_idx ON public.leases(landlord_id);
CREATE INDEX IF NOT EXISTS leases_tenant_id_idx ON public.leases(tenant_id);

-- Add sample data for testing
DO $$
BEGIN
  -- Add sample leases if table is empty and columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'landlord_id') THEN
    IF (SELECT COUNT(*) FROM public.leases) = 0 THEN
      INSERT INTO public.leases (id, property_id, tenant_id, owner_id, landlord_id, status, start_date, end_date, monthly_rent, created_at, updated_at) VALUES
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000101', '0ecda2a5-0479-483c-98af-c502607f459f', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 350000, now(), now()),
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000102', '0ecda2a5-0479-483c-98af-c502607f459f', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'draft', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '13 months', 80000, now(), now());
    END IF;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.leases IS 'Table des contrats de location (bails)';
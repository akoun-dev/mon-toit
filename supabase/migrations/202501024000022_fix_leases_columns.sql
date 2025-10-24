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

-- Note: Sample data is now handled in seed.sql to avoid UUID conflicts

-- Add comment
COMMENT ON TABLE public.leases IS 'Table des contrats de location (bails)';
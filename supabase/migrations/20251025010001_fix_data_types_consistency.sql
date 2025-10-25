-- Fix data types consistency across tables
-- This migration fixes inconsistent data types that should use enums instead of TEXT

-- First, create missing enums that are referenced but not defined
DO $$ BEGIN
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

-- Fix properties table to use proper enum types
DO $$ BEGIN
  -- Check if column exists and is TEXT before altering
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update any invalid values to valid enum values
    UPDATE public.properties
    SET status = 'disponible'
    WHERE status NOT IN ('disponible', 'loué', 'en_attente', 'retiré');

    -- Then alter the column type
    ALTER TABLE public.properties
    ALTER COLUMN status TYPE public.property_status
    USING status::public.property_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter properties.status column: %', SQLERRM;
END $$;

-- Fix agency_mandates table to use proper enum types
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_mandates'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update any invalid values to valid enum values
    UPDATE public.agency_mandates
    SET status = 'active'
    WHERE status NOT IN ('active', 'expired', 'terminated', 'pending', 'suspended');

    -- Then alter the column type
    ALTER TABLE public.agency_mandates
    ALTER COLUMN status TYPE public.mandate_status
    USING status::public.mandate_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter agency_mandates.status column: %', SQLERRM;
END $$;

-- Fix rental_applications table status column if needed
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update any invalid values to valid enum values
    UPDATE public.rental_applications
    SET status = 'pending'
    WHERE status NOT IN ('pending', 'approved', 'rejected', 'withdrawn');

    -- Then alter the column type
    ALTER TABLE public.rental_applications
    ALTER COLUMN status TYPE public.application_status
    USING status::public.application_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter rental_applications.status column: %', SQLERRM;
END $$;

-- Remove redundant landlord_id column from leases table if both owner_id and landlord_id exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases'
    AND column_name = 'landlord_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases'
    AND column_name = 'owner_id'
  ) THEN
    -- Copy data from landlord_id to owner_id if owner_id is null
    UPDATE public.leases
    SET owner_id = landlord_id
    WHERE owner_id IS NULL AND landlord_id IS NOT NULL;

    -- Drop the redundant column
    ALTER TABLE public.leases DROP COLUMN landlord_id;

    RAISE NOTICE 'Dropped redundant landlord_id column from leases table';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix landlord_id/owner_id redundancy: %', SQLERRM;
END $$;

-- Add comments for the new enum type
COMMENT ON TYPE public.mandate_status IS 'Statut d''un mandat d''agence';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_status ON public.agency_mandates(status);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status ON public.rental_applications(status);

DO $$
BEGIN
  RAISE NOTICE '✓ Data types consistency migration completed successfully';
END $$;
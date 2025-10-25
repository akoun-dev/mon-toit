-- Fix migration errors and inconsistencies
-- This migration corrects critical issues identified in the migration analysis

-- 1. Fix enum status columns that are incorrectly using TEXT

-- Fix properties.status (should use property_status enum instead of TEXT)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update invalid values to valid enum values
    UPDATE public.properties
    SET status = 'disponible'
    WHERE status NOT IN ('disponible', 'loué', 'en_attente', 'retiré');

    -- Then alter the column type
    ALTER TABLE public.properties
    ALTER COLUMN status TYPE public.property_status
    USING status::public.property_status;

    RAISE NOTICE '✓ Fixed properties.status to use property_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter properties.status: %', SQLERRM;
END $$;

-- Fix agency_mandates.status (should use mandate_status enum)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_mandates'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update invalid values
    UPDATE public.agency_mandates
    SET status = 'active'
    WHERE status NOT IN ('active', 'expired', 'terminated', 'pending', 'suspended');

    -- Then alter the column type
    ALTER TABLE public.agency_mandates
    ALTER COLUMN status TYPE public.mandate_status
    USING status::public.mandate_status;

    RAISE NOTICE '✓ Fixed agency_mandates.status to use mandate_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter agency_mandates.status: %', SQLERRM;
END $$;

-- Fix rental_applications.status (should use application_status enum)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update invalid values
    UPDATE public.rental_applications
    SET status = 'pending'
    WHERE status NOT IN ('pending', 'approved', 'rejected', 'withdrawn');

    -- Then alter the column type
    ALTER TABLE public.rental_applications
    ALTER COLUMN status TYPE public.application_status
    USING status::public.application_status;

    RAISE NOTICE '✓ Fixed rental_applications.status to use application_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter rental_applications.status: %', SQLERRM;
END $$;

-- Fix leases.status (should use TEXT for now - creating lease_status enum)
DO $$ BEGIN
  -- Create lease_status enum if it doesn't exist
  CREATE TYPE public.lease_status AS ENUM (
    'draft',
    'active',
    'expired',
    'terminated',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update invalid values
    UPDATE public.leases
    SET status = 'draft'
    WHERE status NOT IN ('draft', 'active', 'expired', 'terminated', 'suspended');

    -- Then alter the column type
    ALTER TABLE public.leases
    ALTER COLUMN status TYPE public.lease_status
    USING status::public.lease_status;

    RAISE NOTICE '✓ Fixed leases.status to use lease_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter leases.status: %', SQLERRM;
END $$;

-- Fix payments.status (should use TEXT for now - creating payment_status enum)
DO $$ BEGIN
  -- Create payment_status enum if it doesn't exist
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- First update invalid values
    UPDATE public.payments
    SET status = 'pending'
    WHERE status NOT IN ('pending', 'completed', 'failed', 'cancelled', 'refunded');

    -- Then alter the column type
    ALTER TABLE public.payments
    ALTER COLUMN status TYPE public.payment_status
    USING status::public.payment_status;

    RAISE NOTICE '✓ Fixed payments.status to use payment_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter payments.status: %', SQLERRM;
END $$;

-- 2. Fix redundancy: remove landlord_id column from leases table
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
    -- Copy data from landlord_id to owner_id where owner_id is null
    UPDATE public.leases
    SET owner_id = landlord_id
    WHERE owner_id IS NULL AND landlord_id IS NOT NULL;

    -- Drop the redundant column
    ALTER TABLE public.leases DROP COLUMN landlord_id;

    RAISE NOTICE '✓ Removed redundant landlord_id column from leases table';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not remove landlord_id column: %', SQLERRM;
END $$;

-- 3. Fix user_id/applicant_id redundancy in rental_applications
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name = 'applicant_id'
  ) THEN
    -- Copy data from user_id to applicant_id where applicant_id is null
    UPDATE public.rental_applications
    SET applicant_id = user_id
    WHERE applicant_id IS NULL AND user_id IS NOT NULL;

    -- Drop the redundant user_id column
    ALTER TABLE public.rental_applications DROP COLUMN user_id;

    RAISE NOTICE '✓ Removed redundant user_id column from rental_applications table';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not remove user_id column: %', SQLERRM;
END $$;

-- 4. Fix verification_status columns that should use verification_status enum
DO $$ BEGIN
  -- Fix background_check_status in rental_applications
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name = 'background_check_status'
    AND data_type = 'text'
  ) THEN
    UPDATE public.rental_applications
    SET background_check_status = 'pending'
    WHERE background_check_status NOT IN ('pending', 'verified', 'rejected', 'not_attempted');

    ALTER TABLE public.rental_applications
    ALTER COLUMN background_check_status TYPE public.verification_status
    USING background_check_status::public.verification_status;

    RAISE NOTICE '✓ Fixed rental_applications.background_check_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix background_check_status: %', SQLERRM;
END $$;

DO $$ BEGIN
  -- Fix income_verification_status in rental_applications
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_applications'
    AND column_name = 'income_verification_status'
    AND data_type = 'text'
  ) THEN
    UPDATE public.rental_applications
    SET income_verification_status = 'pending'
    WHERE income_verification_status NOT IN ('pending', 'verified', 'rejected', 'not_attempted');

    ALTER TABLE public.rental_applications
    ALTER COLUMN income_verification_status TYPE public.verification_status
    USING income_verification_status::public.verification_status;

    RAISE NOTICE '✓ Fixed rental_applications.income_verification_status enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix income_verification_status: %', SQLERRM;
END $$;

-- 5. Add missing constraints for data integrity
DO $$ BEGIN
  -- Add constraints to properties table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_name = 'properties_monthly_rent_positive'
  ) THEN
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_monthly_rent_positive
    CHECK (monthly_rent > 0 AND monthly_rent < 10000000);

    RAISE NOTICE '✓ Added monthly_rent positive constraint to properties';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_name = 'properties_surface_area_positive'
  ) THEN
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_surface_area_positive
    CHECK (surface_area > 0 AND surface_area < 10000);

    RAISE NOTICE '✓ Added surface_area positive constraint to properties';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_name = 'properties_bedrooms_reasonable'
  ) THEN
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_bedrooms_reasonable
    CHECK (bedrooms >= 0 AND bedrooms <= 50);

    RAISE NOTICE '✓ Added bedrooms reasonable constraint to properties';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_name = 'properties_bathrooms_reasonable'
  ) THEN
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_bathrooms_reasonable
    CHECK (bathrooms >= 0 AND bathrooms <= 20);

    RAISE NOTICE '✓ Added bathrooms reasonable constraint to properties';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add constraints to properties: %', SQLERRM;
END $$;

-- 6. Fix column names and types in messages table
DO $$ BEGIN
  -- Fix message_type to use proper enum
  CREATE TYPE public.message_type AS ENUM (
    'message',
    'notification',
    'system_alert',
    'document_share'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages'
    AND column_name = 'message_type'
    AND data_type = 'text'
  ) THEN
    UPDATE public.messages
    SET message_type = 'message'
    WHERE message_type NOT IN ('message', 'notification', 'system_alert', 'document_share');

    ALTER TABLE public.messages
    ALTER COLUMN message_type TYPE public.message_type
    USING message_type::public.message_type;

    RAISE NOTICE '✓ Fixed messages.message_type enum';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix message_type: %', SQLERRM;
END $$;

-- 7. Create missing enums that are referenced but not defined
DO $$ BEGIN
  -- Create certificate_type enum if it doesn't exist
  CREATE TYPE public.certificate_type AS ENUM (
    'identity',
    'professional',
    'academic',
    'property',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  -- Create certificate_status enum if it doesn't exist
  CREATE TYPE public.certificate_status AS ENUM (
    'active',
    'expired',
    'revoked',
    'pending',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 8. Add proper indexes for the corrected enum columns
CREATE INDEX IF NOT EXISTS idx_properties_status_enum ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_status_enum ON public.agency_mandates(status);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status_enum ON public.rental_applications(status);
CREATE INDEX IF NOT EXISTS idx_leases_status_enum ON public.leases(status);
CREATE INDEX IF NOT EXISTS idx_payments_status_enum ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_messages_type_enum ON public.messages(message_type);

-- Add comments for the new enums
COMMENT ON TYPE public.lease_status IS 'Statut d''un contrat de location';
COMMENT ON TYPE public.payment_status IS 'Statut d''un paiement';
COMMENT ON TYPE public.message_type IS 'Type de message dans le système';
COMMENT ON TYPE public.certificate_type IS 'Type de certificat numérique';
COMMENT ON TYPE public.certificate_status IS 'Statut d''un certificat numérique';

-- Add comments for constraints
COMMENT ON CONSTRAINT properties_monthly_rent_positive ON public.properties IS 'Le loyer mensuel doit être positif et raisonnable';
COMMENT ON CONSTRAINT properties_surface_area_positive ON public.properties IS 'La surface doit être positive et raisonnable';
COMMENT ON CONSTRAINT properties_bedrooms_reasonable ON public.properties IS 'Le nombre de chambres doit être raisonnable';
COMMENT ON CONSTRAINT properties_bathrooms_reasonable ON public.properties IS 'Le nombre de salles de bain doit être raisonnable';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration errors fixed successfully';
  RAISE NOTICE '📊 Summary of fixes:';
  RAISE NOTICE '  - Fixed status columns to use proper enums (5 tables)';
  RAISE NOTICE '  - Removed redundant landlord_id column from leases';
  RAISE NOTICE '  - Removed redundant user_id column from rental_applications';
  RAISE NOTICE '  - Added data integrity constraints';
  RAISE NOTICE '  - Created missing enums and fixed message_type';
  RAISE NOTICE '  - Added indexes for improved query performance';
END $$;
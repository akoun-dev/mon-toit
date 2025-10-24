-- Migration: Add missing auto_action columns
-- Description: Add only the columns that are actually missing

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_applications') THEN
    -- Add only auto_action_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'auto_action_type') THEN
      ALTER TABLE public.rental_applications ADD COLUMN auto_action_type TEXT DEFAULT 'none';
    END IF;

    -- Add auto_action_reason if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'auto_action_reason') THEN
      ALTER TABLE public.rental_applications ADD COLUMN auto_action_reason TEXT;
    END IF;

    -- Add auto_action_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'auto_action_at') THEN
      ALTER TABLE public.rental_applications ADD COLUMN auto_action_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Ensure user_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'user_id') THEN
      ALTER TABLE public.rental_applications ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Copy applicant_id to user_id for existing records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'applicant_id') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'user_id') THEN
    UPDATE public.rental_applications
    SET user_id = applicant_id
    WHERE user_id IS NULL AND applicant_id IS NOT NULL;
  END IF;
END $$;
-- Migration: Simple column fix for rental_applications
-- Description: Add missing columns without data insertion

-- Add missing columns to rental_applications if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_applications') THEN
    BEGIN
      ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END;
  END IF;
END $$;

-- Copy existing applicant_id to user_id if user_id is null
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_applications' AND column_name = 'user_id') THEN
    UPDATE public.rental_applications
    SET user_id = applicant_id
    WHERE user_id IS NULL AND applicant_id IS NOT NULL;
  END IF;
END $$;

-- Add missing columns to user_favorites if table doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
    CREATE TABLE public.user_favorites (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      UNIQUE(user_id, property_id)
    );

    -- Enable RLS
    ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY "Users can view own favorites" ON public.user_favorites
      FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    CREATE POLICY "Users can insert own favorites" ON public.user_favorites
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    CREATE POLICY "Users can delete own favorites" ON public.user_favorites
      FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    -- Trigger
    CREATE TRIGGER handle_user_favorites_updated_at
      BEFORE UPDATE ON public.user_favorites
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
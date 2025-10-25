-- Add missing columns to rental_applications table

ALTER TABLE public.rental_applications
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_deadline TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_rental_applications_reviewed_at ON public.rental_applications(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_rental_applications_processing_deadline ON public.rental_applications(processing_deadline);

-- Add comments
COMMENT ON COLUMN public.rental_applications.reviewed_at IS 'Date when the application was reviewed';
COMMENT ON COLUMN public.rental_applications.processing_deadline IS 'Deadline for processing the application';
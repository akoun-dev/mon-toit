-- Migration: Add missing columns to rental_applications
-- Description: Add auto_processed and other missing columns

DO $$
BEGIN
  -- Add missing columns if they don't exist
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS auto_processed BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS processing_stage TEXT DEFAULT 'initial';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS ai_score INTEGER;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS matched_properties UUID[];
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS automated_recommendations JSONB DEFAULT '[]';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS budget_range JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS location_preferences TEXT[];
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS amenity_preferences TEXT[];
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS accessibility_requirements TEXT[];
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS timeline_requirement TEXT;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS move_in_flexibility BOOLEAN DEFAULT true;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS viewing_history JSONB DEFAULT '[]';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS application_notes TEXT;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS internal_notes TEXT;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS document_status JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS verification_status JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS compliance_checks JSONB DEFAULT '{}';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS background_check_completed BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS credit_check_completed BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS reference_check_completed BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS employment_verification_completed BOOLEAN DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS rental_applications_auto_processed_idx ON public.rental_applications(auto_processed);
CREATE INDEX IF NOT EXISTS rental_applications_processing_stage_idx ON public.rental_applications(processing_stage);
CREATE INDEX IF NOT EXISTS rental_applications_ai_score_idx ON public.rental_applications(ai_score);
CREATE INDEX IF NOT EXISTS rental_applications_risk_level_idx ON public.rental_applications(risk_level);
CREATE INDEX IF NOT EXISTS rental_applications_priority_score_idx ON public.rental_applications(priority_score);
CREATE INDEX IF NOT EXISTS rental_applications_last_activity_idx ON public.rental_applications(last_activity);
CREATE INDEX IF NOT EXISTS rental_applications_follow_up_date_idx ON public.rental_applications(follow_up_date);
CREATE INDEX IF NOT EXISTS rental_applications_background_check_completed_idx ON public.rental_applications(background_check_completed);
CREATE INDEX IF NOT EXISTS rental_applications_credit_check_completed_idx ON public.rental_applications(credit_check_completed);

-- Add comments for new columns
COMMENT ON COLUMN public.rental_applications.auto_processed IS 'Indicates if the application was processed automatically by the system';
COMMENT ON COLUMN public.rental_applications.processing_stage IS 'Current stage of application processing';
COMMENT ON COLUMN public.rental_applications.ai_score IS 'AI-generated score for the application';
COMMENT ON COLUMN public.rental_applications.risk_level IS 'Risk assessment level';
COMMENT ON COLUMN public.rental_applications.priority_score IS 'Priority score for processing';
COMMENT ON COLUMN public.rental_applications.matched_properties IS 'Array of matched property IDs';
COMMENT ON COLUMN public.rental_applications.automated_recommendations IS 'AI-generated recommendations';
COMMENT ON COLUMN public.rental_applications.last_activity IS 'Timestamp of last activity on application';
COMMENT ON COLUMN public.rental_applications.follow_up_required IS 'Indicates if follow-up is required';
COMMENT ON COLUMN public.rental_applications.follow_up_date IS 'Date when follow-up is scheduled';
COMMENT ON COLUMN public.rental_applications.communication_preferences IS 'User communication preferences';
COMMENT ON COLUMN public.rental_applications.budget_range IS 'Preferred budget range';
COMMENT ON COLUMN public.rental_applications.location_preferences IS 'Preferred locations';
COMMENT ON COLUMN public.rental_applications.amenity_preferences IS 'Required amenities';
COMMENT ON COLUMN public.rental_applications.accessibility_requirements IS 'Accessibility requirements';
COMMENT ON COLUMN public.rental_applications.timeline_requirement IS 'Required move-in timeline';
COMMENT ON COLUMN public.rental_applications.move_in_flexibility IS 'Flexibility in move-in date';
COMMENT ON COLUMN public.rental_applications.viewing_history IS 'History of property viewings';
COMMENT ON COLUMN public.rental_applications.application_notes IS 'Notes provided by applicant';
COMMENT ON COLUMN public.rental_applications.internal_notes IS 'Internal notes for staff';
COMMENT ON COLUMN public.rental_applications.document_status IS 'Status of required documents';
COMMENT ON COLUMN public.rental_applications.verification_status IS 'Verification status of information';
COMMENT ON COLUMN public.rental_applications.compliance_checks IS 'Compliance check results';
COMMENT ON COLUMN public.rental_applications.background_check_completed IS 'Background check completion status';
COMMENT ON COLUMN public.rental_applications.credit_check_completed IS 'Credit check completion status';
COMMENT ON COLUMN public.rental_applications.reference_check_completed IS 'Reference check completion status';
COMMENT ON COLUMN public.rental_applications.employment_verification_completed IS 'Employment verification completion status';
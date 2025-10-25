-- Add verification timestamp columns to user_verifications table

ALTER TABLE public.user_verifications
ADD COLUMN IF NOT EXISTS oneci_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cnam_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS face_verified_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_user_verifications_oneci_verified_at ON public.user_verifications(oneci_verified_at);
CREATE INDEX IF NOT EXISTS idx_user_verifications_cnam_verified_at ON public.user_verifications(cnam_verified_at);
CREATE INDEX IF NOT EXISTS idx_user_verifications_face_verified_at ON public.user_verifications(face_verified_at);

-- Add comments
COMMENT ON COLUMN public.user_verifications.oneci_verified_at IS 'Timestamp when ONECI verification was completed';
COMMENT ON COLUMN public.user_verifications.cnam_verified_at IS 'Timestamp when CNAM verification was completed';
COMMENT ON COLUMN public.user_verifications.face_verified_at IS 'Timestamp when face verification was completed';

-- Create function to automatically update verified_at columns when status changes
CREATE OR REPLACE FUNCTION update_verification_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ONECI verified_at when status changes to 'verified'
  IF OLD.oneci_status IS DISTINCT FROM NEW.oneci_status THEN
    IF NEW.oneci_status = 'verified' AND OLD.oneci_status != 'verified' THEN
      NEW.oneci_verified_at = NOW();
    ELSIF NEW.oneci_status != 'verified' THEN
      NEW.oneci_verified_at = NULL;
    END IF;
  END IF;

  -- Update CNAM verified_at when status changes to 'verified'
  IF OLD.cnam_status IS DISTINCT FROM NEW.cnam_status THEN
    IF NEW.cnam_status = 'verified' AND OLD.cnam_status != 'verified' THEN
      NEW.cnam_verified_at = NOW();
    ELSIF NEW.cnam_status != 'verified' THEN
      NEW.cnam_verified_at = NULL;
    END IF;
  END IF;

  -- Update face verified_at when status changes to 'verified'
  IF OLD.face_status IS DISTINCT FROM NEW.face_status THEN
    IF NEW.face_status = 'verified' AND OLD.face_status != 'verified' THEN
      NEW.face_verified_at = NOW();
    ELSIF NEW.face_status != 'verified' THEN
      NEW.face_verified_at = NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_verification_timestamps ON public.user_verifications;
CREATE TRIGGER trigger_update_verification_timestamps
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_timestamps();
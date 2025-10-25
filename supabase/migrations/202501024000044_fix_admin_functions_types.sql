-- Fix return types for admin functions

-- Drop and recreate get_verifications_for_admin_review with correct types
DROP FUNCTION IF EXISTS get_verifications_for_admin_review();

CREATE OR REPLACE FUNCTION get_verifications_for_admin_review()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_full_name VARCHAR(255),
  user_email VARCHAR(255),
  verification_type VARCHAR(50),
  status VARCHAR(50),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID,
  reviewer_name VARCHAR(255),
  data JSONB,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uv.id,
    uv.user_id,
    p.full_name::VARCHAR(255) as user_full_name,
    u.email::VARCHAR(255) as user_email,
    CASE
      WHEN uv.oneci_status IS NOT NULL THEN 'oneci'::VARCHAR(50)
      WHEN uv.cnam_status IS NOT NULL THEN 'cnam'::VARCHAR(50)
      WHEN uv.face_status IS NOT NULL THEN 'face'::VARCHAR(50)
    END as verification_type,
    CASE
      WHEN uv.oneci_status = 'pending' THEN uv.oneci_status::VARCHAR(50)
      WHEN uv.cnam_status = 'pending' THEN uv.cnam_status::VARCHAR(50)
      WHEN uv.face_status = 'pending' THEN uv.face_status::VARCHAR(50)
    END as status,
    uv.created_at as submitted_at,
    uv.updated_at as reviewed_at,
    NULL::UUID as reviewer_id,
    NULL::VARCHAR(255) as reviewer_name,
    jsonb_build_object(
      'oneci_data', uv.oneci_data,
      'cnam_data', uv.cnam_data,
      'face_data', uv.face_data
    ) as data,
    CASE
      WHEN uv.oneci_status = 'pending' THEN 1
      WHEN uv.cnam_status = 'pending' THEN 2
      WHEN uv.face_status = 'pending' THEN 3
      ELSE 4
    END as priority
  FROM public.user_verifications uv
  JOIN public.profiles p ON uv.user_id = p.id
  JOIN auth.users u ON uv.user_id = u.id
  WHERE uv.oneci_status = 'pending' OR uv.cnam_status = 'pending' OR uv.face_status = 'pending'
  ORDER BY priority ASC, uv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions again
GRANT EXECUTE ON FUNCTION get_verifications_for_admin_review() TO authenticated;
-- Fix get_my_verification_status to use correct column name
DROP FUNCTION IF EXISTS public.get_my_verification_status();

CREATE OR REPLACE FUNCTION public.get_my_verification_status()
 RETURNS TABLE(
   cnib_verified boolean,
   cnam_verified boolean,
   face_verified boolean,
   oneci_status text,
   cnam_status text,
   face_verification_status text,
   tenant_score integer,
   admin_review_notes text,
   admin_reviewed_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the access attempt
  INSERT INTO public.sensitive_data_access_log (
    requester_id,
    target_user_id,
    data_type,
    access_granted,
    relationship_type,
    metadata
  ) VALUES (
    auth.uid(),
    auth.uid(),
    'verification_status',
    true,
    'self',
    jsonb_build_object(
      'action', 'view_own_status',
      'timestamp', now()
    )
  );

  -- Return status fields using correct column names
  RETURN QUERY
  SELECT 
    p.cnib_verified,
    p.cnam_verified,
    p.face_verified,
    uv.oneci_status,
    uv.cnam_status,
    uv.face_verification_status,
    uv.tenant_score,
    uv.admin_review_notes,
    uv.admin_reviewed_at
  FROM public.user_verifications uv
  JOIN public.profiles p ON p.id = uv.user_id
  WHERE uv.user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_verification_status() TO authenticated;
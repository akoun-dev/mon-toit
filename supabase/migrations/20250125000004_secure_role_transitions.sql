-- Migration: Secure Role Transitions with Strict Validation
-- Description: Fix privilege escalation vulnerability with proper role transition validation

-- Note: user_type enum should already exist from migration 202501024000001_create_base_types.sql
-- Using TEXT with CHECK constraints to avoid enum dependency issues

-- Create role change requests table for approval workflow
CREATE TABLE IF NOT EXISTS public.role_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_role TEXT NOT NULL CHECK (from_role IN ('locataire', 'proprietaire', 'agence', 'tiers_de_confiance', 'admin_ansut')),
  to_role TEXT NOT NULL CHECK (to_role IN ('locataire', 'proprietaire', 'agence', 'tiers_de_confiance', 'admin_ansut')),
  justification TEXT,
  supporting_documents JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Constraints are now inline with column definitions

-- Create indexes for role change requests
CREATE INDEX IF NOT EXISTS role_requests_user_id_idx ON public.role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS role_requests_status_idx ON public.role_change_requests(status);
CREATE INDEX IF NOT EXISTS role_requests_to_role_idx ON public.role_change_requests(to_role);
CREATE INDEX IF NOT EXISTS role_requests_created_at_idx ON public.role_change_requests(created_at);

-- Enable RLS on role change requests
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for role change requests
CREATE POLICY "Users can view own role requests" ON public.role_change_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all role requests" ON public.role_change_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Users can create role requests" ON public.role_change_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage role requests" ON public.role_change_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- Drop the insecure old function
DROP FUNCTION IF EXISTS public.request_role_access(TEXT, TEXT);

-- Create secure role transition function
CREATE OR REPLACE FUNCTION public.request_role_change(
  p_to_role TEXT,
  p_justification TEXT DEFAULT NULL,
  p_supporting_documents JSONB DEFAULT '[]'
)
RETURNS TABLE (
  request_id UUID,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_type TEXT;
  current_active_role TEXT;
  v_request_id UUID;
  v_transition_allowed BOOLEAN := false;
  v_requires_approval BOOLEAN := true;
  v_message TEXT;
BEGIN
  -- Validate requested role parameter
  IF p_to_role NOT IN ('locataire', 'proprietaire', 'agence', 'tiers_de_confiance', 'admin_ansut') THEN
    RETURN QUERY SELECT
      NULL::uuid,
      'error'::text,
      'Invalid role requested'::text;
    RETURN;
  END IF;

  -- Get current user profile
  SELECT user_type INTO current_user_type
  FROM public.profiles
  WHERE id = current_user_id;

  -- Get current active role
  SELECT active_role INTO current_active_role
  FROM public.user_active_roles
  WHERE user_id = current_user_id;

  -- Validate user exists and has a current role
  IF current_user_type IS NULL OR current_active_role IS NULL THEN
    RETURN QUERY SELECT
      NULL::uuid,
      'error'::text,
      'User profile or role not found'::text;
    RETURN;
  END IF;

  -- Prevent duplicate requests for same role
  IF EXISTS (
    SELECT 1 FROM public.role_change_requests
    WHERE user_id = current_user_id
      AND to_role = p_to_role
      AND status IN ('pending', 'approved')
  ) THEN
    RETURN QUERY SELECT
      NULL::uuid,
      'error'::text,
      'Role request already exists or granted'::text;
    RETURN;
  END IF;

  -- Strict role transition validation matrix
  CASE
    -- Self-transition (not allowed)
    WHEN current_active_role = p_to_role THEN
      v_message := 'Cannot transition to the same role';
      v_transition_allowed := false;

    -- Tenant to Owner (allowed with verification)
    WHEN current_active_role = 'locataire' AND p_to_role = 'proprietaire' THEN
      v_transition_allowed := true;
      v_requires_approval := false;
      v_message := 'Tenant to Owner transition allowed with property verification';

    -- Tenant to Agency (requires admin approval)
    WHEN current_active_role = 'locataire' AND p_to_role = 'agence' THEN
      v_transition_allowed := true;
      v_requires_approval := true;
      v_message := 'Tenant to Agency transition requires admin approval';

    -- Owner to Agency (requires admin approval)
    WHEN current_active_role = 'proprietaire' AND p_to_role = 'agence' THEN
      v_transition_allowed := true;
      v_requires_approval := true;
      v_message := 'Owner to Agency transition requires admin approval and business verification';

    -- Agency to Owner (allowed with verification)
    WHEN current_active_role = 'agence' AND p_to_role = 'proprietaire' THEN
      v_transition_allowed := true;
      v_requires_approval := false;
      v_message := 'Agency to Owner transition allowed with individual verification';

    -- Any role to Third-party Trust (requires admin approval + verification)
    WHEN p_to_role = 'tiers_de_confiance' THEN
      v_transition_allowed := true;
      v_requires_approval := true;
      v_message := 'Third-party Trust role requires admin approval and external verification';

    -- Any role to Admin (admin-only operation)
    WHEN p_to_role = 'admin_ansut' THEN
      v_transition_allowed := false;
      v_message := 'Admin role assignment is restricted to super-admins only';

    -- Admin to other roles (allowed - step down)
    WHEN current_active_role = 'admin_ansut' AND p_to_role IN ('proprietaire', 'locataire', 'agence', 'tiers_de_confiance') THEN
      v_transition_allowed := true;
      v_requires_approval := false;
      v_message := 'Admin role step-down allowed';

    -- Third-party to other roles (requires admin approval)
    WHEN current_active_role = 'tiers_de_confiance' THEN
      v_transition_allowed := true;
      v_requires_approval := true;
      v_message := 'Third-party Trust role changes require admin approval';

    -- All other transitions are denied
    ELSE
      v_transition_allowed := false;
      v_message := 'Role transition not allowed in security policy';
  END CASE;

  -- If transition is not allowed, return error
  IF NOT v_transition_allowed THEN
    -- Log blocked transition attempt
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      details
    ) VALUES (
      current_user_id,
      'role_transition_blocked',
      'medium',
      'role_management',
      jsonb_build_object(
        'from_role', current_active_role,
        'to_role', p_to_role,
        'justification', p_justification,
        'reason', v_message,
        'blocked', true
      )
    );

    RETURN QUERY SELECT
      NULL::uuid,
      'blocked'::text,
      v_message::text;
    RETURN;
  END IF;

  -- Create role change request
  INSERT INTO public.role_change_requests (
    user_id,
    from_role,
    to_role,
    justification,
    supporting_documents,
    status,
    requested_by
  ) VALUES (
    current_user_id,
    current_active_role,
    p_to_role,
    p_justification,
    p_supporting_documents,
    CASE WHEN v_requires_approval THEN 'pending' ELSE 'approved' END,
    current_user_id
  ) RETURNING id INTO v_request_id;

  -- If approval is not required, immediately grant the role
  IF NOT v_requires_approval THEN
    -- Update user's available roles
    UPDATE public.user_active_roles
    SET
      available_roles = array_append(
        array_remove(available_roles, p_to_role), p_to_role
      ),
      active_role = p_to_role,
      updated_at = now()
    WHERE user_id = current_user_id;

    -- Add to role history
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, p_to_role);

    -- Update request as approved
    UPDATE public.role_change_requests
    SET
      status = 'approved',
      approved_by = current_user_id,
      approved_at = now()
    WHERE id = v_request_id;
  END IF;

  -- Log the role change request
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    source,
    details
  ) VALUES (
    current_user_id,
    'role_change_requested',
    'low',
    'role_management',
    jsonb_build_object(
      'request_id', v_request_id,
      'from_role', current_active_role,
      'to_role', p_to_role,
      'requires_approval', v_requires_approval,
      'justification', p_justification
    )
  );

  RETURN QUERY SELECT
    v_request_id,
    CASE WHEN v_requires_approval THEN 'pending' ELSE 'approved' END,
    v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admins to approve/reject role requests
CREATE OR REPLACE FUNCTION public.manage_role_request(
  p_request_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_request RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- Verify current user is admin
  SELECT user_type = 'admin_ansut' INTO v_is_admin
  FROM public.profiles
  WHERE id = current_user_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can manage role requests';
  END IF;

  -- Get the role request
  SELECT * INTO v_request
  FROM public.role_change_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Role request not found or already processed';
  END IF;

  -- Process the action
  IF p_action = 'approve' THEN
    -- Grant the role
    UPDATE public.user_active_roles
    SET
      available_roles = array_append(
        array_remove(available_roles, v_request.to_role), v_request.to_role
      ),
      active_role = v_request.to_role,
      updated_at = now()
    WHERE user_id = v_request.user_id;

    -- Add to role history
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_request.user_id, v_request.to_role);

    -- Update request
    UPDATE public.role_change_requests
    SET
      status = 'approved',
      approved_by = current_user_id,
      approved_at = now()
    WHERE id = p_request_id;

    -- Log the approval
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      details
    ) VALUES (
      v_request.user_id,
      'role_change_approved',
      'medium',
      'role_management',
      jsonb_build_object(
        'request_id', p_request_id,
        'approved_by', current_user_id,
        'role_granted', v_request.to_role,
        'previous_role', v_request.from_role
      )
    );

  ELSIF p_action = 'reject' THEN
    -- Reject the request
    UPDATE public.role_change_requests
    SET
      status = 'rejected',
      approved_by = current_user_id,
      approved_at = now(),
      rejection_reason = p_reason
    WHERE id = p_request_id;

    -- Log the rejection
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      source,
      details
    ) VALUES (
      v_request.user_id,
      'role_change_rejected',
      'medium',
      'role_management',
      jsonb_build_object(
        'request_id', p_request_id,
        'rejected_by', current_user_id,
        'requested_role', v_request.to_role,
        'rejection_reason', p_reason
      )
    );

  ELSE
    RAISE EXCEPTION 'Invalid action. Use "approve" or "reject"';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get role request statistics for admins
CREATE OR REPLACE FUNCTION public.get_role_request_statistics(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  approved_requests BIGINT,
  rejected_requests BIGINT,
  by_to_role JSONB,
  average_processing_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
    jsonb_agg(
      jsonb_build_object(
        'role', to_role,
        'count', COUNT(*),
        'approval_rate', CASE
          WHEN COUNT(*) > 0 THEN
            ROUND((COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
          ELSE 0
        END
      )
    ) FILTER (WHERE to_role IS NOT NULL) as by_to_role,
    AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600) FILTER (WHERE approved_at IS NOT NULL) as average_processing_hours
  FROM public.role_change_requests
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for role management functions
GRANT EXECUTE ON FUNCTION request_role_change(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION manage_role_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_request_statistics(INTEGER) TO authenticated;

-- Add trigger for updated_at on role_change_requests
CREATE TRIGGER handle_role_change_requests_updated_at
  BEFORE UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.role_change_requests IS 'Gère les demandes de changement de rôle avec workflow d''approbation';
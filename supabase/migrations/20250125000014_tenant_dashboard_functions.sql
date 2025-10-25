-- Migration: Tenant Dashboard Functions
-- Description: Complete CRUD functions for tenant interface

-- Function 1: Get tenant dashboard summary
CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_summary(p_tenant_id UUID)
RETURNS TABLE (
  section TEXT,
  metric_type TEXT,
  metric_value NUMERIC,
  details JSONB
) AS $$
BEGIN
  -- Applications section
  RETURN QUERY
  SELECT
    'applications' as section,
    'total' as metric_type,
    COUNT(*)::numeric as metric_value,
    jsonb_build_object('total', COUNT(*)) as details
  FROM public.property_applications
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'applications' as section,
    'pending' as metric_type,
    COUNT(*) FILTER (WHERE status = 'pending')::numeric as metric_value,
    jsonb_build_object('pending', COUNT(*) FILTER (WHERE status = 'pending')) as details
  FROM public.property_applications
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'applications' as section,
    'approved' as metric_type,
    COUNT(*) FILTER (WHERE status = 'approved')::numeric as metric_value,
    jsonb_build_object('approved', COUNT(*) FILTER (WHERE status = 'approved')) as details
  FROM public.property_applications
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'applications' as section,
    'rejected' as metric_type,
    COUNT(*) FILTER (WHERE status = 'rejected')::numeric as metric_value,
    jsonb_build_object('rejected', COUNT(*) FILTER (WHERE status = 'rejected')) as details
  FROM public.property_applications
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'leases' as section,
    'active' as metric_type,
    COUNT(*)::numeric as metric_value,
    jsonb_build_object('active', COUNT(*)) as details
  FROM public.leases
  WHERE tenant_id = p_tenant_id
    AND start_date <= NOW()
    AND end_date >= NOW()
    AND status = 'active'

  UNION ALL

  SELECT
    'leases' as section,
    'total' as metric_type,
    COUNT(*)::numeric as metric_value,
    jsonb_build_object('total', COUNT(*)) as details
  FROM public.leases
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'payments' as section,
    'total_paid' as metric_type,
    COALESCE(SUM(amount), 0)::numeric as metric_value,
    jsonb_build_object('total_paid', COALESCE(SUM(amount), 0)) as details
  FROM public.rent_payments
  WHERE tenant_id = p_tenant_id
    AND status = 'paid'

  UNION ALL

  SELECT
    'payments' as section,
    'pending' as metric_type,
    COUNT(*)::numeric as metric_value,
    jsonb_build_object('pending', COUNT(*)) as details
  FROM public.rent_payments
  WHERE tenant_id = p_tenant_id
    AND status = 'pending'

  UNION ALL

  SELECT
    'maintenance' as section,
    'total' as metric_type,
    COUNT(*)::numeric as metric_value,
    jsonb_build_object('total', COUNT(*)) as details
  FROM public.maintenance_requests
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'maintenance' as section,
    'pending' as metric_type,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress'))::numeric as metric_value,
    jsonb_build_object('pending', COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress'))) as details
  FROM public.maintenance_requests
  WHERE tenant_id = p_tenant_id

  UNION ALL

  SELECT
    'maintenance' as section,
    'completed' as metric_type,
    COUNT(*) FILTER (WHERE status = 'completed')::numeric as metric_value,
    jsonb_build_object('completed', COUNT(*) FILTER (WHERE status = 'completed')) as details
  FROM public.maintenance_requests
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Get tenant applications with property details
CREATE OR REPLACE FUNCTION public.get_tenant_applications(p_tenant_id UUID, p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  property_title TEXT,
  property_address TEXT,
  property_city TEXT,
  property_rent NUMERIC,
  status TEXT,
  application_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  property_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.property_id,
    p.title as property_title,
    CONCAT(p.address, ', ', p.city, ' ', p.country) as property_address,
    p.rent_amount as property_rent,
    pa.status,
    pa.application_score,
    pa.created_at,
    pa.updated_at,
    p.image_url as property_image_url
  FROM public.property_applications pa
  JOIN public.properties p ON pa.property_id = p.id
  WHERE pa.tenant_id = p_tenant_id
  ORDER BY pa.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Get tenant active lease
CREATE OR REPLACE FUNCTION public.get_tenant_active_lease(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  property_title TEXT,
  property_address TEXT,
  start_date DATE,
  end_date DATE,
  monthly_rent NUMERIC,
  status TEXT,
  landlord_name TEXT,
  landlord_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.property_id,
    p.title as property_title,
    CONCAT(p.address, ', ', p.city) as property_address,
    l.start_date::date,
    l.end_date::date,
    l.monthly_rent,
    l.status,
    pr.full_name as landlord_name,
    pr.email as landlord_email
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  JOIN public.profiles pr ON l.landlord_id = pr.id
  WHERE l.tenant_id = p_tenant_id
    AND l.status = 'active'
    AND l.start_date <= NOW()
    AND l.end_date >= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Get tenant payment history
CREATE OR REPLACE FUNCTION public.get_tenant_payment_history(p_tenant_id UUID, p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  lease_id UUID,
  property_title TEXT,
  amount NUMERIC,
  payment_date DATE,
  status TEXT,
  payment_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rp.id,
    rp.lease_id,
    p.title as property_title,
    rp.amount,
    rp.payment_date::date,
    rp.status,
    rp.payment_method
  FROM public.rent_payments rp
  JOIN public.leases l ON rp.lease_id = l.id
  JOIN public.properties p ON l.property_id = p.id
  WHERE l.tenant_id = p_tenant_id
  ORDER BY rp.payment_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Get tenant maintenance requests
CREATE OR REPLACE FUNCTION public.get_tenant_maintenance_requests(p_tenant_id UUID, p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  property_title TEXT,
  request_type TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.property_id,
    p.title as property_title,
    mr.request_type,
    mr.description,
    mr.status,
    mr.priority,
    mr.created_at,
    mr.updated_at
  FROM public.maintenance_requests mr
  JOIN public.properties p ON mr.property_id = p.id
  WHERE mr.tenant_id = p_tenant_id
  ORDER BY mr.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 6: Create property application
CREATE OR REPLACE FUNCTION public.create_property_application(
  p_tenant_id UUID,
  p_property_id UUID,
  p_message TEXT DEFAULT NULL,
  p_proposed_rent NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  application_id UUID,
  message TEXT
) AS $$
DECLARE
  v_property_id UUID;
  v_application_id UUID;
  v_existing_application RECORD;
BEGIN
  -- Check if property exists and is available
  SELECT id INTO v_property_id
  FROM public.properties
  WHERE id = p_property_id
    AND status = 'available'
    AND id IS NOT NULL;

  IF v_property_id IS NULL THEN
    RETURN QUERY
    SELECT false as success,
           NULL as application_id,
           'Property not available or does not exist' as message;
  END IF;

  -- Check if tenant already applied
  SELECT * INTO v_existing_application
  FROM public.property_applications
  WHERE tenant_id = p_tenant_id
    AND property_id = p_property_id
    AND status IN ('pending', 'under_review', 'approved')
    AND id IS NOT NULL;

  IF v_existing_application IS NOT NULL THEN
    RETURN QUERY
    SELECT false as success,
           v_existing_application.id as application_id,
           'You have already applied to this property' as message;
  END IF;

  -- Create the application
  INSERT INTO public.property_applications (
    tenant_id, property_id, message, proposed_rent, status, application_score
  ) VALUES (
    p_tenant_id, p_property_id, p_message, p_proposed_rent, 'pending', 0
  )
  RETURNING id INTO v_application_id;

  -- Update property status to 'under_review'
  UPDATE public.properties
  SET status = 'under_review',
      updated_at = NOW()
  WHERE id = v_property_id;

  -- Log the application creation
  INSERT INTO public.security_events (
    event_type, severity, source, details
  ) VALUES (
    'property_application_created',
    'low',
    'tenant_interface',
    jsonb_build_object(
      'tenant_id', p_tenant_id,
      'property_id', p_property_id,
      'application_id', v_application_id
    )
  );

  RETURN QUERY
  SELECT true as success,
         v_application_id as application_id,
         'Application submitted successfully' as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 7: Update application status
CREATE OR REPLACE FUNCTION public.update_application_status(
  p_application_id UUID,
  p_new_status TEXT,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_current_status TEXT;
  v_tenant_id UUID;
BEGIN
  -- Get current status and tenant_id
  SELECT status, tenant_id INTO v_current_status, v_tenant_id
  FROM public.property_applications
  WHERE id = p_application_id;

  IF v_current_status IS NULL THEN
    RETURN QUERY
    SELECT false as success, 'Application not found' as message;
  END IF;

  -- Authorization check (only tenant can update their own application)
  IF p_tenant_id IS NOT NULL AND v_tenant_id != p_tenant_id THEN
    RETURN QUERY
    SELECT false as success, 'Unauthorized' as message;
  END IF;

  -- Update status
  UPDATE public.property_applications
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_application_id;

  -- Log the status update
  INSERT INTO public.security_events (
    event_type, severity, source, details
  ) VALUES (
    'application_status_updated',
    'medium',
    'tenant_interface',
    jsonb_build_object(
      'application_id', p_application_id,
      'old_status', v_current_status,
      'new_status', p_new_status,
      'tenant_id', v_tenant_id
    )
  );

  RETURN QUERY
  SELECT true as success, 'Application status updated successfully' as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_applications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_active_lease TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_payment_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_maintenance_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_application_status TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_tenant_dashboard_summary IS 'Récupère le résumé du tableau de bord locataire';
COMMENT ON FUNCTION public.get_tenant_applications IS 'Récupère les candidatures de logement du locataire';
COMMENT ON FUNCTION public.get_tenant_active_lease IS 'Récupère le bail actif du locataire';
COMMENT ON FUNCTION public.get_tenant_payment_history IS 'Récupère l''historique des paiements du locataire';
COMMENT ON FUNCTION public.get_tenant_maintenance_requests IS 'Récupère les demandes de maintenance du locataire';
COMMENT ON FUNCTION public.create_property_application IS 'Crée une nouvelle demande de logement';
COMMENT ON FUNCTION public.update_application_status IS 'Met à jour le statut d''une demande de logement';
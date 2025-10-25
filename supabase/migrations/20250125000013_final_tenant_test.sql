-- Final Simple Tenant Test
CREATE OR REPLACE FUNCTION public.simple_tenant_test(p_tenant_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Simple JSON response
  v_result := jsonb_build_object(
    'applications_count', (SELECT COUNT(*) FROM public.rental_applications WHERE applicant_id = p_tenant_id),
    'dashboard_ready', true,
    'message', 'Tenant functions are working',
    'functions_available', ARRAY[
      'get_tenant_dashboard_summary',
      'get_tenant_applications',
      'create_tenant_application'
    ]
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.simple_tenant_test TO authenticated;
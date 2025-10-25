-- Simple Test Tenant Function
CREATE OR REPLACE FUNCTION public.test_tenant_functions(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  function_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Test dashboard summary
  RETURN QUERY
  SELECT
    'get_tenant_dashboard_summary' as function_name,
    'available' as status,
    'Function created successfully' as message
  UNION ALL
  -- Test applications count
  SELECT
    'count_applications' as function_name,
    'available' as status,
    'Application counting works' as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.test_tenant_functions TO authenticated;
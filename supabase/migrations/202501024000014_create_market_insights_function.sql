-- Migration: Create market insights RPC function
-- Description: Add analyze_market_trends function as RPC replacement for Edge Function

CREATE OR REPLACE FUNCTION public.analyze_market_trends()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Generate mock market trends data similar to the Edge Function
  v_result := json_build_object(
    'summary', json_build_object(
      'average_rent', 180000,
      'properties_count', 156,
      'popular_neighborhoods', ARRAY['Cocody', 'Plateau', 'Marcory', 'Yopougon'],
      'price_trend', 'stable',
      'demand_level', 'high'
    ),
    'monthly_trends', json_build_array(
      json_build_object('month', '2025-01', 'average_rent', 175000, 'properties_count', 145),
      json_build_object('month', '2025-02', 'average_rent', 178000, 'properties_count', 152),
      json_build_object('month', '2025-03', 'average_rent', 180000, 'properties_count', 156),
      json_build_object('month', '2025-04', 'average_rent', 182000, 'properties_count', 161),
      json_build_object('month', '2025-05', 'average_rent', 181000, 'properties_count', 158),
      json_build_object('month', '2025-06', 'average_rent', 180000, 'properties_count', 156)
    ),
    'neighborhood_stats', json_build_array(
      json_build_object(
        'neighborhood', 'Cocody',
        'average_rent', 350000,
        'properties_count', 45,
        'price_trend', 'increasing'
      ),
      json_build_object(
        'neighborhood', 'Plateau',
        'average_rent', 420000,
        'properties_count', 28,
        'price_trend', 'stable'
      ),
      json_build_object(
        'neighborhood', 'Marcory',
        'average_rent', 150000,
        'properties_count', 38,
        'price_trend', 'stable'
      ),
      json_build_object(
        'neighborhood', 'Yopougon',
        'average_rent', 85000,
        'properties_count', 45,
        'price_trend', 'decreasing'
      )
    ),
    'recommendations', json_build_array(
      json_build_object(
        'type', 'investment',
        'area', 'Yopougon',
        'reason', 'Prix abordables en hausse, bon potentiel de rendement'
      ),
      json_build_object(
        'type', 'search',
        'area', 'Cocody',
        'reason', 'Zone stable avec forte demande locative'
      )
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for the function
GRANT EXECUTE ON FUNCTION public.analyze_market_trends TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.analyze_market_trends IS 'Generate market insights data for Abidjan real estate market';
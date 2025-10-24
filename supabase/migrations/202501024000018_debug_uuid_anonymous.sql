-- Migration: Debug and fix anonymous UUIDs
-- Description: Create function to find and fix anonymous UUIDs

CREATE OR REPLACE FUNCTION public.find_anonymous_uuids()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  anonymous_count BIGINT
) AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Create temporary table to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_results (
    table_name TEXT,
    column_name TEXT,
    anonymous_count BIGINT
  );

  -- Check all UUID columns in all tables
  FOR v_record IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE data_type = 'uuid'
    AND table_schema = 'public'
    AND table_name NOT IN ('pg_stat_statements')
  LOOP
    BEGIN
      -- Dynamic SQL to count anonymous UUIDs
      EXECUTE format(
        'INSERT INTO temp_results SELECT %L, %L, COUNT(*) FROM %I WHERE %I = ''anonymous''',
        v_record.table_name, v_record.column_name, v_record.table_name, v_record.column_name
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore errors for tables that don't exist or can't be accessed
        NULL;
    END;
  END LOOP;

  -- Return results
  RETURN QUERY SELECT * FROM temp_results WHERE anonymous_count > 0;

  -- Clean up
  DROP TABLE IF EXISTS temp_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fix_anonymous_uuids()
RETURNS TEXT AS $$
DECLARE
  v_table_name TEXT;
  v_column_name TEXT;
  v_count INTEGER := 0;
  v_total_fixed INTEGER := 0;
  v_result TEXT;
BEGIN
  -- Fix properties table
  UPDATE public.properties
  SET owner_id = gen_random_uuid()
  WHERE owner_id = 'anonymous' OR owner_id IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_fixed := v_total_fixed + v_count;

  -- Fix profiles table
  UPDATE public.profiles
  SET id = gen_random_uuid()
  WHERE id = 'anonymous';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_fixed := v_total_fixed + v_count;

  -- Fix any other tables that might have UUID columns
  FOR v_table_name, v_column_name IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE data_type = 'uuid'
    AND table_schema = 'public'
    AND table_name NOT IN ('properties', 'profiles')
  LOOP
    BEGIN
      EXECUTE format(
        'UPDATE %I SET %I = gen_random_uuid() WHERE %I = ''anonymous''',
        v_table_name, v_column_name, v_column_name
      );
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_total_fixed := v_total_fixed + v_count;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END LOOP;

  v_result := format('Fixed %s anonymous UUID records', v_total_fixed);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.find_anonymous_uuids TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_anonymous_uuids TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.find_anonymous_uuids IS 'Find all anonymous UUID values in the database';
COMMENT ON FUNCTION public.fix_anonymous_uuids IS 'Fix all anonymous UUID values in the database';
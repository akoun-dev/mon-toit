-- Fix remaining functions without search_path

-- 1. Fix increment_page_visit function
CREATE OR REPLACE FUNCTION public.increment_page_visit(p_route text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO navigation_preferences (user_id, page_route, visit_count)
  VALUES (auth.uid(), p_route, 1)
  ON CONFLICT (user_id, page_route)
  DO UPDATE SET 
    visit_count = navigation_preferences.visit_count + 1,
    updated_at = now();
END;
$$;

-- 2. Fix update_navigation_preferences_timestamp function
CREATE OR REPLACE FUNCTION public.update_navigation_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
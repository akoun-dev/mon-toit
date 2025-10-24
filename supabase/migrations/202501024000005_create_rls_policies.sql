-- Migration: Create RLS policies for authentication tables
-- Description: Define Row Level Security policies for all auth-related tables

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are publicly viewable" ON public.profiles
  FOR SELECT USING (
    -- Allow viewing basic info for all profiles
    true
  );

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

CREATE POLICY "System can manage user roles" ON public.user_roles
  FOR ALL USING (
    -- This would typically be handled by service role
    false
  );

-- User active roles policies
CREATE POLICY "Users can view own active roles" ON public.user_active_roles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

CREATE POLICY "Users can update own active roles" ON public.user_active_roles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

CREATE POLICY "Users can insert own active roles" ON public.user_active_roles
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

-- Login attempts policies (restricted access)
CREATE POLICY "Users can view own login attempts" ON public.login_attempts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

-- OTP verifications policies
CREATE POLICY "Users can view own OTP verifications" ON public.otp_verifications
  FOR SELECT USING (
    -- Users can only see their own OTP verifications by email
    auth.jwt() ->> 'email' = email
  );

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

-- User verifications policies
CREATE POLICY "Users can view own verifications" ON public.user_verifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

CREATE POLICY "Users can update own verifications" ON public.user_verifications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

CREATE POLICY "Users can insert own verifications" ON public.user_verifications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND auth.uid() = id
  ));

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'user_type'::public.user_type, 'locataire')
  );

  -- Initialize user active roles
  INSERT INTO public.user_active_roles (user_id, active_role, available_roles)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type'::public.user_type, 'locataire'),
    ARRAY[COALESCE(NEW.raw_user_meta_data->>'user_type'::public.user_type, 'locataire')]
  );

  -- Initialize user verifications
  INSERT INTO public.user_verifications (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get current user profile with role info
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  user_type public.user_type,
  active_role public.user_type,
  available_roles public.user_type[],
  is_verified BOOLEAN,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.user_type,
    uar.active_role,
    uar.available_roles,
    p.is_verified,
    p.avatar_url
  FROM public.profiles p
  LEFT JOIN public.user_active_roles uar ON p.id = uar.user_id
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to switch user role
CREATE OR REPLACE FUNCTION public.switch_user_role(new_role public.user_type)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  role_available BOOLEAN;
BEGIN
  -- Check if role is available for user
  SELECT (new_role = ANY(available_roles)) INTO role_available
  FROM public.user_active_roles
  WHERE user_id = current_user_id;

  IF NOT FOUND OR NOT role_available THEN
    RAISE EXCEPTION 'Role not available for user';
  END IF;

  -- Update active role
  UPDATE public.user_active_roles
  SET active_role = new_role,
      updated_at = now()
  WHERE user_id = current_user_id;

  -- Log role change in user_roles history
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, new_role);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
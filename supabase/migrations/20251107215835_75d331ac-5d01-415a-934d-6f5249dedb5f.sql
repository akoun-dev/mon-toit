-- Create functions for role management (only super_admin can manage roles)

-- Function to add a role to a user
CREATE OR REPLACE FUNCTION public.add_role(
  target_user_id UUID,
  new_role app_role
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est super_admin
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can add roles';
  END IF;

  -- Ajouter le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Logger l'action
  INSERT INTO public.admin_audit_logs (
    admin_id, action_type, target_type, target_id, notes
  ) VALUES (
    auth.uid(), 'role_added', 'user', target_user_id,
    'Role added: ' || new_role::text
  );
END;
$$;

-- Function to remove a role from a user
CREATE OR REPLACE FUNCTION public.remove_role(
  target_user_id UUID,
  old_role app_role
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  -- Vérifier que l'appelant est super_admin
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can remove roles';
  END IF;

  -- Empêcher de retirer le dernier super_admin
  IF old_role = 'super_admin'::app_role THEN
    SELECT COUNT(*) INTO super_admin_count
    FROM public.user_roles
    WHERE role = 'super_admin'::app_role;
    
    IF super_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last super admin';
    END IF;
  END IF;

  -- Retirer le rôle
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = old_role;

  -- Logger l'action
  INSERT INTO public.admin_audit_logs (
    admin_id, action_type, target_type, target_id, notes
  ) VALUES (
    auth.uid(), 'role_removed', 'user', target_user_id,
    'Role removed: ' || old_role::text
  );
END;
$$;

-- Function to get all roles of a user
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id UUID)
RETURNS TABLE(role app_role, granted_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, created_at
  FROM public.user_roles
  WHERE user_id = target_user_id
  ORDER BY created_at DESC;
$$;
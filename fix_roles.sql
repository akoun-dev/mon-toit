-- Corriger les rôles des utilisateurs pour qu'ils correspondent à leur user_type
-- À exécuter avec SERVICE ROLE

-- Mettre à jour les rôles basés sur le user_type des profils
UPDATE public.user_roles ur
SET role = 'locataire'::public.app_role
FROM public.profiles p
WHERE ur.user_id = p.id AND p.user_type = 'locataire';

UPDATE public.user_roles ur
SET role = 'proprietaire'::public.app_role
FROM public.profiles p
WHERE ur.user_id = p.id AND p.user_type = 'proprietaire';

UPDATE public.user_roles ur
SET role = 'agence'::public.app_role
FROM public.profiles p
WHERE ur.user_id = p.id AND p.user_type = 'agence';

UPDATE public.user_roles ur
SET role = 'admin'::public.app_role
FROM public.profiles p
WHERE ur.user_id = p.id AND p.user_type = 'admin';

UPDATE public.user_roles ur
SET role = 'super_admin'::public.app_role
FROM public.profiles p
WHERE ur.user_id = p.id AND p.user_type = 'super_admin';

-- Vérification
SELECT u.email, p.user_type, ur.role as assigned_role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.email;
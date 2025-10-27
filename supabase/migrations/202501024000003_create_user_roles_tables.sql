-- Migration: Create user roles management tables
-- Description: Create tables for managing user roles and role switching

-- Create user_roles table (for historical tracking)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.user_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_active_roles table (for current active role management)
CREATE TABLE IF NOT EXISTS public.user_active_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  active_role public.user_type NOT NULL,
  available_roles public.user_type[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS user_active_roles_active_role_idx ON public.user_active_roles(active_role);

-- Create trigger for updated_at
CREATE TRIGGER handle_user_active_roles_updated_at
  BEFORE UPDATE ON public.user_active_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_roles ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.user_roles IS 'Historique des rôles attribués aux utilisateurs';
COMMENT ON TABLE public.user_active_roles IS 'Gestion des rôles actifs et disponibles pour chaque utilisateur';
COMMENT ON COLUMN public.user_active_roles.active_role IS 'Rôle actuellement actif pour l''utilisateur';
COMMENT ON COLUMN public.user_active_roles.available_roles IS 'Liste des rôles disponibles pour l''utilisateur';
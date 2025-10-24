-- ============================================================
-- Mon Toit — Migration: Tables manquantes et corrections RLS
-- Date: 2025-10-24
-- ============================================================

-- 1) Table notifications (manquante)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'booking', 'application', 'message', 'review', 'system')),
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at pour notifications
DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2) Table user_favorites (manquante)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at pour user_favorites
DROP TRIGGER IF EXISTS trg_user_favorites_updated_at ON public.user_favorites;
CREATE TRIGGER trg_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3) Table agency_mandates (manquante)
CREATE TABLE IF NOT EXISTS public.agency_mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mandate_type text NOT NULL CHECK (mandate_type IN ('simple', 'exclusive', 'search')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  commission_rate numeric(5,2) CHECK (commission_rate >= 0 AND commission_rate <= 100),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at pour agency_mandates
DROP TRIGGER IF EXISTS trg_agency_mandates_updated_at ON public.agency_mandates;
CREATE TRIGGER trg_agency_mandates_updated_at
  BEFORE UPDATE ON public.agency_mandates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4) Vue user_roles_summary (manquante)
CREATE OR REPLACE VIEW public.user_roles_summary AS
SELECT
  u.id as user_id,
  u.email,
  p.full_name,
  p.user_type,
  COALESCE(
    json_agg(
      json_build_object('role', ur.role, 'created_at', ur.created_at)
      ORDER BY ur.created_at DESC
    ),
    '[]'::json
  ) as roles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, p.full_name, p.user_type;

-- 5) RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour notifications
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Accès complet pour les admins
DROP POLICY IF EXISTS notifications_admin_full_access ON public.notifications;
CREATE POLICY notifications_admin_full_access ON public.notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- 6) RLS pour user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_favorites
DROP POLICY IF EXISTS user_favorites_select_own ON public.user_favorites;
CREATE POLICY user_favorites_select_own ON public.user_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_favorites_insert_own ON public.user_favorites;
CREATE POLICY user_favorites_insert_own ON public.user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_favorites_delete_own ON public.user_favorites;
CREATE POLICY user_favorites_delete_own ON public.user_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Accès complet pour les admins
DROP POLICY IF EXISTS user_favorites_admin_full_access ON public.user_favorites;
CREATE POLICY user_favorites_admin_full_access ON public.user_favorites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- 7) RLS pour agency_mandates
ALTER TABLE public.agency_mandates ENABLE ROW LEVEL SECURITY;

-- Politiques pour agency_mandates
DROP POLICY IF EXISTS agency_mandates_select_owner ON public.agency_mandates;
CREATE POLICY agency_mandates_select_owner ON public.agency_mandates
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR agency_id = auth.uid());

DROP POLICY IF EXISTS agency_mandates_insert_owner ON public.agency_mandates;
CREATE POLICY agency_mandates_insert_owner ON public.agency_mandates
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR agency_id = auth.uid());

DROP POLICY IF EXISTS agency_mandates_update_owner ON public.agency_mandates;
CREATE POLICY agency_mandates_update_owner ON public.agency_mandates
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR agency_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR agency_id = auth.uid());

-- Accès complet pour les admins
DROP POLICY IF EXISTS agency_mandates_admin_full_access ON public.agency_mandates;
CREATE POLICY agency_mandates_admin_full_access ON public.agency_mandates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- 8) Index de performance pour les nouvelles tables
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_property_id ON public.user_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_property ON public.user_favorites(user_id, property_id);

CREATE INDEX IF NOT EXISTS idx_agency_mandates_property_id ON public.agency_mandates(property_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_owner_id ON public.agency_mandates(owner_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_agency_id ON public.agency_mandates(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_status ON public.agency_mandates(status);

-- 9) Permissions pour la vue
REVOKE ALL ON public.user_roles_summary FROM PUBLIC;
GRANT SELECT ON public.user_roles_summary TO authenticated, anon;

-- 10) Correction des problèmes de RLS existants
-- Améliorer la politique profiles_select_own pour éviter les erreurs récursives
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Simplifier la politique admin pour éviter la récursion complètement
-- Utiliser l'user_metadata directement pour éviter les auto-jointures
DROP POLICY IF EXISTS profiles_admin_full_access ON public.profiles;
CREATE POLICY profiles_admin_full_access ON public.profiles
  FOR ALL TO authenticated
  USING (
    -- Vérifier si l'utilisateur est admin en utilisant user_type de la table courante
    -- pour éviter la récursion, on compare directement avec le champ user_type
    user_type = 'admin_ansut' AND id = auth.uid()
  )
  WITH CHECK (
    -- Pour INSERT/UPDATE, permettre seulement si admin ou si c'est son propre profil
    (user_type = 'admin_ansut' AND auth.uid() IS NOT NULL) OR (id = auth.uid())
  );

-- Fin de migration
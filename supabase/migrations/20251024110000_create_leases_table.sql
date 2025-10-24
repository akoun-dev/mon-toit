-- ============================================================
-- Mon Toit — Migration: Table leases (baux) simplifiée
-- Date: 2025-10-24
-- ============================================================

-- Table pour les baux de location
CREATE TABLE IF NOT EXISTS public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  property_id uuid NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations du bail
  lease_number text UNIQUE NOT NULL,
  lease_type text NOT NULL DEFAULT 'habitation' CHECK (lease_type IN ('habitation', 'commercial', 'mixed')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric(12,2) NOT NULL CHECK (monthly_rent > 0),
  security_deposit numeric(12,2) CHECK (security_deposit >= 0),
  agency_fees numeric(12,2) DEFAULT 0 CHECK (agency_fees >= 0),

  -- Statut
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'expired', 'terminated', 'renewed')),
  certification_status text DEFAULT 'pending' CHECK (certification_status IN ('pending', 'verified', 'rejected', 'expired')),

  -- Conditions et termes
  terms jsonb DEFAULT '{}',
  renewal_options jsonb DEFAULT '{}',
  special_conditions text,

  -- Documents
  lease_document_url text,
  signed_lease_url text,
  inventory_document_url text,

  -- Paiements
  last_payment_date timestamptz,
  next_payment_due_date timestamptz,
  total_paid numeric(12,2) DEFAULT 0,

  -- Métadonnées
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz,
  terminated_at timestamptz,
  termination_reason text,
  notes text,

  -- Contraintes
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT positive_rent CHECK (monthly_rent > 0),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending', 'active', 'expired', 'terminated', 'renewed'))
);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trg_leases_updated_at ON public.leases;
CREATE TRIGGER trg_leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON public.leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_owner_id ON public.leases(owner_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_start_date ON public.leases(start_date);
CREATE INDEX IF NOT EXISTS idx_leases_end_date ON public.leases(end_date);
CREATE INDEX IF NOT EXISTS idx_leases_created_at ON public.leases(created_at);

-- Politiques RLS
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

-- Politique pour les locataires (voir leurs baux)
DROP POLICY IF EXISTS leases_select_tenant ON public.leases;
CREATE POLICY leases_select_tenant ON public.leases
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

-- Politique pour les propriétaires (voir leurs biens loués)
DROP POLICY IF EXISTS leases_select_owner ON public.leases;
CREATE POLICY leases_select_owner ON public.leases
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Politique pour les agences (voir tous les baux de leurs propriétaires)
DROP POLICY IF EXISTS leases_select_agency ON public.leases;
CREATE POLICY leases_select_agency ON public.leases
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'agence'
    )
  );

-- Politique pour insertion par les locataires (créer des demandes de bail)
DROP POLICY IF EXISTS leases_insert_tenant ON public.leases;
CREATE POLICY leases_insert_tenant ON public.leases
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());

-- Politique pour insertion par les propriétaires (créer des baux acceptés)
DROP POLICY IF EXISTS leases_insert_owner ON public.leases;
CREATE POLICY leases_insert_owner ON public.leases
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'proprietaire'
    )
  );

-- Politique pour insertion par les agences (créer des baux pour leurs propriétaires)
DROP POLICY IF EXISTS leases_insert_agency ON public.leases;
CREATE POLICY leases_insert_agency ON public.leases
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'agence'
    )
  );

-- Politique pour mise à jour par les locataires (modifier leur demande)
DROP POLICY IF EXISTS leases_update_tenant ON public.leases;
CREATE POLICY leases_update_tenant ON public.leases
  FOR UPDATE TO authenticated
  USING (
    tenant_id = auth.uid() AND
    status IN ('draft', 'pending')
  );

-- Politique pour mise à jour par les propriétaires
DROP POLICY IF EXISTS leases_update_owner ON public.leases;
CREATE POLICY leases_update_owner ON public.leases
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'proprietaire'
    )
  );

-- Politique pour tous les droits sur les baux de leurs propriétaires (pour les agences)
DROP POLICY IF EXISTS leases_update_agency_full ON public.leases;
CREATE POLICY leases_update_agency_full ON public.leases
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'agence'
    )
  );

-- Politique pour les admins (accès complet)
DROP POLICY IF EXISTS leases_admin_full_access ON public.leases;
CREATE POLICY leases_admin_full_access ON public.leases
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin_ansut'
    )
  );

-- Fin de migration
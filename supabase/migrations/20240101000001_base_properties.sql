-- ============================================================
-- Mon Toit — Migration Base: Tables Fondation
-- Date: 2025-10-24 (création pour résolution ordre)
-- Crée les tables de base avant les fonctionnalités avancées
-- ============================================================

-- Table des profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  user_type text NOT NULL DEFAULT 'locataire'
    CHECK (user_type IN ('proprietaire', 'locataire', 'agence', 'tiers_de_confiance', 'admin_ansut')),
  phone text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'Côte d''Ivoire',
  is_verified boolean DEFAULT false,
  oneci_verified boolean DEFAULT false,
  cnam_verified boolean DEFAULT false,
  bio text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des propriétés
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  monthly_rent numeric(12,2) CHECK (monthly_rent >= 0),
  security_deposit numeric(12,2) DEFAULT 0 CHECK (security_deposit >= 0),
  surface_area numeric(8,2),
  rooms_count integer DEFAULT 1 CHECK (rooms_count > 0),
  bathrooms_count integer DEFAULT 1 CHECK (bathrooms_count >= 0),
  status text DEFAULT 'available'
    CHECK (status IN ('available', 'rented', 'maintenance', 'archived', 'pending')),
  type text NOT NULL
    CHECK (type IN ('house', 'apartment', 'studio', 'commercial', 'office', 'land')),
  furnished boolean DEFAULT false,
  furnished_details text[] DEFAULT '{}',
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  country text DEFAULT 'Côte d''Ivoire',
  latitude numeric(10,8),
  longitude numeric(11,8),
  images text[] DEFAULT '{}',
  amenities jsonb DEFAULT '{}',
  accessibility_features text[] DEFAULT '{}',
  energy_rating text,
  year_built integer,
  last_renovated integer,
  floor_number integer,
  total_floors integer,
  has_parking boolean DEFAULT false,
  parking_spaces integer DEFAULT 0,
  has_elevator boolean DEFAULT false,
  has_balcony boolean DEFAULT false,
  has_terrace boolean DEFAULT false,
  has_garden boolean DEFAULT false,
  has_pool boolean DEFAULT false,
  pets_allowed boolean DEFAULT false,
  smoking_allowed boolean DEFAULT false,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  property_manager_id uuid REFERENCES public.profiles(id),
  listing_reference text UNIQUE,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour tracking des vues des propriétés
CREATE TABLE IF NOT EXISTS property_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    referrer TEXT
);

-- Table pour l'historique des rapports propriétaire
CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    file_url TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);

-- Table pour les notifications utilisateurs
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'lease', 'payment', 'dispute', 'certification')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les vérifications utilisateurs
CREATE TABLE IF NOT EXISTS user_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'address', 'income', 'professional', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    documents TEXT[] DEFAULT '{}',
    verification_data JSONB DEFAULT '{}',
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les demandes de maintenance
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'rejected')),
    category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'structural', 'appliance', 'hvac', 'pest_control', 'cleaning', 'other')),
    estimated_cost NUMERIC(10,2),
    actual_cost NUMERIC(10,2),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    images TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Tables supplémentaires pour les services locatifs
-- ============================================================

-- Table des candidatures de location
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  application_score numeric(3,2) CHECK (application_score >= 0 AND application_score <= 10),
  monthly_income numeric(12,2),
  employment_status text,
  employment_length integer, -- en mois
  current_situation text,
  guarantor_info jsonb,
  background_check jsonb,
  applicant_references jsonb DEFAULT '[]',
  applicant_message text,
  owner_notes text,
  requested_move_in_date date,
  proposed_lease_duration integer, -- en mois
  documents jsonb DEFAULT '[]', -- URLs des documents
  metadata jsonb DEFAULT '{}',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des baux de location
CREATE TABLE IF NOT EXISTS public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rental_application_id uuid REFERENCES public.rental_applications(id),
  lease_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'suspended')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric(12,2) NOT NULL CHECK (monthly_rent >= 0),
  security_deposit numeric(12,2) NOT NULL CHECK (security_deposit >= 0),
  payment_due_day integer DEFAULT 1 CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
  late_fee numeric(10,2) DEFAULT 0 CHECK (late_fee >= 0),
  late_fee_grace_period integer DEFAULT 3 CHECK (late_fee_grace_period >= 0),
  renewal_terms jsonb,
  termination_notice_period integer DEFAULT 90 CHECK (termination_notice_period > 0),
  termination_conditions jsonb,
  utilities_included boolean DEFAULT false,
  utilities_details jsonb,
  maintenance_responsibilities jsonb,
  pet_policy jsonb,
  smoking_policy text DEFAULT 'not_allowed',
  subletting_allowed boolean DEFAULT false,
  terms_conditions text,
  signed_by_tenant_at timestamptz,
  signed_by_owner_at timestamptz,
  tenant_signature_url text,
  owner_signature_url text,
  documents jsonb DEFAULT '[]', -- URLs des documents du bail
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.leases(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  payment_type text NOT NULL
    CHECK (payment_type IN ('rent', 'deposit', 'fees', 'charges', 'maintenance', 'penalty', 'other')),
  payment_method text NOT NULL
    CHECK (payment_method IN ('orange_money', 'mtn_money', 'moov_money', 'wave', 'cash', 'bank_transfer', 'mobile_wallet', 'check')),
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  transaction_id text,
  external_transaction_id text,
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  completed_at timestamptz,
  processing_fee numeric(10,2) DEFAULT 0 CHECK (processing_fee >= 0),
  platform_fee numeric(10,2) DEFAULT 0 CHECK (platform_fee >= 0),
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  description text,
  notes text,
  payment_receipt_url text,
  failure_reason text,
  refund_amount numeric(12,2),
  refund_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des visites de propriétés
CREATE TABLE IF NOT EXISTS public.property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rental_application_id uuid REFERENCES public.rental_applications(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  visit_type text NOT NULL DEFAULT 'individual'
    CHECK (visit_type IN ('individual', 'group', 'open_house', 'virtual')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  visitor_contact text,
  special_instructions text,
  access_code text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  rescheduled_to timestamptz,
  visitor_notes text,
  host_notes text,
  visitor_rating integer CHECK (visitor_rating >= 1 AND visitor_rating <= 5),
  host_rating integer CHECK (host_rating >= 1 AND host_rating <= 5),
  follow_up_required boolean DEFAULT false,
  follow_up_actions jsonb DEFAULT '[]',
  photos_during_visit text[] DEFAULT '{}',
  virtual_meeting_link text,
  virtual_meeting_platform text,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  feedback_requested boolean DEFAULT false,
  feedback_requested_at timestamptz,
  metadata jsonb DEFAULT '{}',
  cancellation_reason text,
  rescheduling_count integer DEFAULT 0 CHECK (rescheduling_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Triggers, index et contraintes pour les tables locatives
-- ============================================================

-- Créer les triggers pour updated_at (en supposant que set_updated_at() existe déjà)
CREATE TRIGGER set_rental_applications_updated_at
  BEFORE UPDATE ON public.rental_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_property_visits_updated_at
  BEFORE UPDATE ON public.property_visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Créer les index pour optimiser les performances
CREATE INDEX idx_rental_applications_property_id ON public.rental_applications(property_id);
CREATE INDEX idx_rental_applications_applicant_id ON public.rental_applications(applicant_id);
CREATE INDEX idx_rental_applications_status ON public.rental_applications(status);

CREATE INDEX idx_leases_property_id ON public.leases(property_id);
CREATE INDEX idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX idx_leases_owner_id ON public.leases(owner_id);
CREATE INDEX idx_leases_status ON public.leases(status);
CREATE INDEX idx_leases_dates ON public.leases(start_date, end_date);

CREATE INDEX idx_payments_payer_id ON public.payments(payer_id);
CREATE INDEX idx_payments_receiver_id ON public.payments(receiver_id);
CREATE INDEX idx_payments_lease_id ON public.payments(lease_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

CREATE INDEX idx_property_visits_property_id ON public.property_visits(property_id);
CREATE INDEX idx_property_visits_visitor_id ON public.property_visits(visitor_id);
CREATE INDEX idx_property_visits_host_id ON public.property_visits(host_id);
CREATE INDEX idx_property_visits_status ON public.property_visits(status);
CREATE INDEX idx_property_visits_date ON public.property_visits(visit_date);

-- Créer les contraintes UNIQUES supplémentaires
ALTER TABLE public.rental_applications
  ADD CONSTRAINT unique_active_application_per_property
  UNIQUE (property_id, applicant_id)
  DEFERRABLE INITIALLY DEFERRED;

-- ============================================================
-- Fonctions pour les services locatifs
-- ============================================================

-- Fonction pour obtenir le résumé du dashboard locataire
CREATE OR REPLACE FUNCTION get_tenant_dashboard_summary(p_tenant_id uuid)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'applications', (
            SELECT json_build_object(
                'total', COUNT(*),
                'pending', COUNT(*) FILTER (WHERE status = 'pending'),
                'approved', COUNT(*) FILTER (WHERE status = 'approved'),
                'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
                'recent', (
                    SELECT json_agg(
                        json_build_object(
                            'id', ra.id,
                            'property_id', ra.property_id,
                            'property_title', p.title,
                            'status', ra.status,
                            'created_at', ra.created_at,
                            'application_score', ra.application_score
                        )
                    )
                    FROM (
                        SELECT *
                        FROM public.rental_applications
                        WHERE applicant_id = p_tenant_id
                        ORDER BY created_at DESC
                        LIMIT 3
                    ) ra
                    JOIN public.properties p ON ra.property_id = p.id
                )
            )
            FROM public.rental_applications
            WHERE applicant_id = p_tenant_id
        ),
        'leases', (
            SELECT json_build_object(
                'active', COUNT(*) FILTER (WHERE status = 'active' AND end_date >= CURRENT_DATE),
                'total', COUNT(*),
                'current', (
                    SELECT json_build_object(
                        'id', l.id,
                        'property_id', l.property_id,
                        'property_title', p.title,
                        'monthly_rent', l.monthly_rent,
                        'start_date', l.start_date,
                        'end_date', l.end_date,
                        'status', l.status
                    )
                    FROM public.leases l
                    JOIN public.properties p ON l.property_id = p.id
                    WHERE l.tenant_id = p_tenant_id AND l.status = 'active' AND l.end_date >= CURRENT_DATE
                    LIMIT 1
                )
            )
            FROM public.leases
            WHERE tenant_id = p_tenant_id
        ),
        'payments', (
            SELECT json_build_object(
                'total_paid', COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0),
                'pending', COALESCE(SUM(total_amount) FILTER (WHERE status = 'pending'), 0),
                'count', COUNT(*),
                'recent', (
                    SELECT json_agg(
                        json_build_object(
                            'id', pay.id,
                            'amount', pay.amount,
                            'payment_type', pay.payment_type,
                            'status', pay.status,
                            'created_at', pay.created_at,
                            'completed_at', pay.completed_at
                        )
                    )
                    FROM (
                        SELECT *
                        FROM public.payments
                        WHERE payer_id = p_tenant_id
                        ORDER BY created_at DESC
                        LIMIT 3
                    ) pay
                )
            )
            FROM public.payments
            WHERE payer_id = p_tenant_id
        ),
        'maintenance', (
            SELECT json_build_object(
                'total', COUNT(*),
                'pending', COUNT(*) FILTER (WHERE status = 'pending' OR status = 'open'),
                'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
                'completed', COUNT(*) FILTER (WHERE status = 'completed'),
                'recent', (
                    SELECT json_agg(
                        json_build_object(
                            'id', mr.id,
                            'property_id', mr.property_id,
                            'title', mr.title,
                            'status', mr.status,
                            'urgency', mr.priority,
                            'created_at', mr.created_at
                        )
                    )
                    FROM (
                        SELECT *
                        FROM public.maintenance_requests
                        WHERE tenant_id = p_tenant_id
                        ORDER BY created_at DESC
                        LIMIT 3
                    ) mr
                )
            )
            FROM public.maintenance_requests
            WHERE tenant_id = p_tenant_id
        )
    ) INTO result;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_tenant_dashboard_summary: %', SQLERRM;
        RETURN json_build_object(
            'applications', json_build_object('total', 0, 'pending', 0, 'approved', 0, 'rejected', 0, 'recent', '[]'::json),
            'leases', json_build_object('active', 0, 'total', 0, 'current', NULL),
            'payments', json_build_object('total_paid', 0, 'pending', 0, 'count', 0, 'recent', '[]'::json),
            'maintenance', json_build_object('total', 0, 'pending', 0, 'in_progress', 0, 'completed', 0, 'recent', '[]'::json)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un locataire peut postuler à une propriété
CREATE OR REPLACE FUNCTION can_apply_to_property(p_tenant_id uuid, p_property_id uuid)
RETURNS TABLE(can_apply boolean, reason text) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            -- Vérifier si une candidature existe déjà
            WHEN EXISTS (
                SELECT 1 FROM public.rental_applications
                WHERE applicant_id = p_tenant_id AND property_id = p_property_id
                AND status NOT IN ('rejected', 'withdrawn')
            ) THEN false

            -- Vérifier si le locataire a déjà un bail actif sur cette propriété
            WHEN EXISTS (
                SELECT 1 FROM public.leases
                WHERE tenant_id = p_tenant_id AND property_id = p_property_id
                AND status = 'active' AND end_date >= CURRENT_DATE
            ) THEN false

            -- Vérifier si la propriété est disponible
            WHEN NOT EXISTS (
                SELECT 1 FROM public.properties
                WHERE id = p_property_id AND status = 'available'
            ) THEN false

            ELSE true
        END,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM public.rental_applications
                WHERE applicant_id = p_tenant_id AND property_id = p_property_id
                AND status NOT IN ('rejected', 'withdrawn')
            ) THEN 'Vous avez déjà une candidature en cours pour cette propriété'

            WHEN EXISTS (
                SELECT 1 FROM public.leases
                WHERE tenant_id = p_tenant_id AND property_id = p_property_id
                AND status = 'active' AND end_date >= CURRENT_DATE
            ) THEN 'Vous avez déjà un bail actif sur cette propriété'

            WHEN NOT EXISTS (
                SELECT 1 FROM public.properties
                WHERE id = p_property_id AND status = 'available'
            ) THEN 'Cette propriété n''est pas disponible à la location'

            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les créneaux de visite disponibles
CREATE OR REPLACE FUNCTION get_available_visit_slots(
    p_property_id uuid,
    p_start_date date,
    p_end_date date,
    p_duration_minutes integer DEFAULT 30
)
RETURNS TABLE(slot_datetime timestamptz, is_available boolean, reason text) AS $$
BEGIN
    RETURN QUERY
    WITH generated_slots AS (
        -- Générer tous les créneaux possibles (de 8h à 18h, tous les jours)
        SELECT
            generate_series(
                p_start_date::timestamptz + interval '8 hours',
                p_end_date::timestamptz + interval '18 hours' - interval '1 minute',
                interval '1 hour'
            ) as slot_datetime
    ),
    existing_visits AS (
        -- Récupérer les visites existantes
        SELECT
            visit_date,
            duration_minutes,
            status
        FROM public.property_visits
        WHERE property_id = p_property_id
        AND visit_date::date BETWEEN p_start_date AND p_end_date
        AND status NOT IN ('cancelled', 'no_show')
    )
    SELECT
        gs.slot_datetime,
        NOT EXISTS (
            SELECT 1 FROM existing_visits ev
            WHERE ev.visit_date <= gs.slot_datetime
            AND (ev.visit_date + (ev.duration_minutes || ' minutes')::interval) > gs.slot_datetime
        ) as is_available,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM existing_visits ev
                WHERE ev.visit_date <= gs.slot_datetime
                AND (ev.visit_date + (ev.duration_minutes || ' minutes')::interval) > gs.slot_datetime
            ) THEN 'Créneau déjà réservé'
            WHEN gs.slot_datetime < NOW() THEN 'Créneau passé'
            ELSE 'Disponible'
        END as reason
    FROM generated_slots gs
    WHERE gs.slot_datetime > NOW() -- Uniquement les créneaux futurs
    ORDER BY gs.slot_datetime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le score d'une candidature
CREATE OR REPLACE FUNCTION calculate_application_score(p_application_id uuid)
RETURNS numeric AS $$
DECLARE
    score numeric := 0;
    application_record RECORD;
BEGIN
    -- Récupérer les données de la candidature
    SELECT * INTO application_record
    FROM public.rental_applications
    WHERE id = p_application_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Score de base : 3/10
    score := 3;

    -- Revenu mensuel (jusqu'à +3 points)
    IF application_record.monthly_income IS NOT NULL THEN
        -- Calculer le ratio revenu/loyer (idéalement > 3)
        DECLARE
            monthly_rent numeric;
            income_ratio numeric;
        BEGIN
            SELECT p.monthly_rent INTO monthly_rent
            FROM public.properties p
            WHERE p.id = application_record.property_id;

            IF monthly_rent > 0 THEN
                income_ratio := application_record.monthly_income / monthly_rent;
                IF income_ratio >= 3 THEN
                    score := score + 3;
                ELSIF income_ratio >= 2.5 THEN
                    score := score + 2;
                ELSIF income_ratio >= 2 THEN
                    score := score + 1;
                END IF;
            END IF;
        END;
    END IF;

    -- Stabilité professionnelle (jusqu'à +2 points)
    IF application_record.employment_length IS NOT NULL THEN
        IF application_record.employment_length >= 24 THEN -- 2+ ans
            score := score + 2;
        ELSIF application_record.employment_length >= 12 THEN -- 1+ an
            score := score + 1;
        END IF;
    END IF;

    -- Documents fournis (jusqu'à +2 points)
    IF application_record.documents IS NOT NULL THEN
        DECLARE
            doc_count integer;
        BEGIN
            doc_count := json_array_length(application_record.documents);
            IF doc_count >= 3 THEN
                score := score + 2;
            ELSIF doc_count >= 1 THEN
                score := score + 1;
            END IF;
        END;
    END IF;

    -- Limiter le score entre 0 et 10
    score := LEAST(GREATEST(score, 0), 10);

    -- Mettre à jour le score dans la candidature
    UPDATE public.rental_applications
    SET application_score = score
    WHERE id = p_application_id;

    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS Policies pour les tables locatives
-- ============================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- Policies pour rental_applications
CREATE POLICY "Users can view their own applications" ON public.rental_applications
    FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = rental_applications.property_id
            AND p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own applications" ON public.rental_applications
    FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- Policies pour leases
CREATE POLICY "Tenants can view their own leases" ON public.leases
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Property owners can view leases for their properties" ON public.leases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = leases.property_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policies pour payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (payer_id = auth.uid() OR receiver_id = auth.uid());

-- Policies pour property_visits
CREATE POLICY "Visitors can view their own visits" ON public.property_visits
    FOR SELECT USING (visitor_id = auth.uid());

CREATE POLICY "Property owners can view visits for their properties" ON public.property_visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_visits.property_id
            AND p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can request visits" ON public.property_visits
    FOR INSERT WITH CHECK (visitor_id = auth.uid());

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_tenant_dashboard_summary TO authenticated;
GRANT EXECUTE ON FUNCTION can_apply_to_property TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_visit_slots TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_application_score TO authenticated;

-- Fin de migration
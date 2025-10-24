-- ============================================================
-- Mon Toit — Migration: Tables Critiques Manquantes
-- Date: 2025-10-24
-- Ajoute les tables essentielles pour une plateforme locative complète
-- ============================================================

-- ============================================================
-- Table des évaluations de propriétés
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.leases(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text NOT NULL,
  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  location_rating integer CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  amenities_rating integer CHECK (amenities_rating >= 1 AND amenities_rating <= 5),
  is_verified_tenant boolean DEFAULT false,
  would_recommend boolean,
  pros text[] DEFAULT '{}',
  cons text[] DEFAULT '{}',
  helpful_count integer DEFAULT 0,
  reported_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  response_from_owner text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, tenant_id, lease_id)
);

-- ============================================================
-- Table des litiges
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  respondent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_type text NOT NULL CHECK (dispute_type IN ('payment', 'maintenance', 'deposit', 'behavior', 'contract_breach', 'other')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  requested_resolution text,
  proposed_solution text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  evidence_documents text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Table des polices d'assurance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insurance_provider text NOT NULL,
  policy_number text NOT NULL,
  policy_type text NOT NULL CHECK (policy_type IN ('property_damage', 'liability', 'rent_guarantee', 'comprehensive')),
  coverage_amount numeric(12,2) NOT NULL,
  premium_amount numeric(12,2) NOT NULL,
  coverage_start_date date NOT NULL,
  coverage_end_date date NOT NULL,
  deductible_amount numeric(12,2),
  covered_risks text[] DEFAULT '{}',
  exclusions text,
  documents text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  renewal_reminder_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Index pour optimiser les performances
-- ============================================================

-- Index pour les recherches de propriétés
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties
  USING gin(to_tsvector('french', title || ' ' || description || ' ' || address));

CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties
  (city, postal_code, country);

CREATE INDEX IF NOT EXISTS idx_properties_price_range ON public.properties
  (monthly_rent, price);

-- Index pour les évaluations
CREATE INDEX idx_property_reviews_property_id ON public.property_reviews(property_id);
CREATE INDEX idx_property_reviews_tenant_id ON public.property_reviews(tenant_id);
CREATE INDEX idx_property_reviews_rating ON public.property_reviews(rating);
CREATE INDEX idx_property_reviews_published ON public.property_reviews(is_published);

-- Index pour les litiges
CREATE INDEX idx_disputes_lease_id ON public.disputes(lease_id);
CREATE INDEX idx_disputes_initiator_id ON public.disputes(initiator_id);
CREATE INDEX idx_disputes_respondent_id ON public.disputes(respondent_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_type ON public.disputes(dispute_type);

-- Index pour les assurances
CREATE INDEX idx_insurance_policies_property_id ON public.insurance_policies(property_id);
CREATE INDEX idx_insurance_policies_owner_id ON public.insurance_policies(owner_id);
CREATE INDEX idx_insurance_policies_status ON public.insurance_policies(status);
CREATE INDEX idx_insurance_policies_coverage_dates ON public.insurance_policies(coverage_start_date, coverage_end_date);

-- ============================================================
-- Triggers pour les nouvelles tables
-- ============================================================

CREATE TRIGGER set_property_reviews_updated_at
  BEFORE UPDATE ON public.property_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Fonctions RPC manquantes
-- ============================================================

-- Fonction pour ajouter/retirer des favoris
CREATE OR REPLACE FUNCTION toggle_favorite(p_property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_favorites WHERE user_id = auth.uid() AND property_id = p_property_id) THEN
    DELETE FROM public.user_favorites WHERE user_id = auth.uid() AND property_id = p_property_id;
    RETURN false;
  ELSE
    INSERT INTO public.user_favorites (user_id, property_id) VALUES (auth.uid(), p_property_id);
    RETURN true;
  END IF;
END;
$$;

-- Fonction pour obtenir le résumé du dashboard propriétaire
CREATE OR REPLACE FUNCTION get_owner_dashboard_summary(p_owner_id uuid)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'properties', (
            SELECT json_build_object(
                'total', COUNT(*),
                'available', COUNT(*) FILTER (WHERE status = 'available'),
                'rented', COUNT(*) FILTER (WHERE status = 'rented'),
                'maintenance', COUNT(*) FILTER (WHERE status = 'maintenance')
            )
            FROM public.properties
            WHERE owner_id = p_owner_id
        ),
        'applications', (
            SELECT json_build_object(
                'pending', COUNT(*) FILTER (WHERE ra.status = 'pending'),
                'under_review', COUNT(*) FILTER (WHERE ra.status = 'under_review'),
                'total', COUNT(*)
            )
            FROM public.rental_applications ra
            JOIN public.properties p ON ra.property_id = p.id
            WHERE p.owner_id = p_owner_id
        ),
        'payments', (
            SELECT json_build_object(
                'total_revenue', COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0),
                'pending_payments', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
                'this_month', COALESCE(SUM(amount) FILTER (
                    WHERE status = 'completed'
                    AND paid_at >= date_trunc('month', CURRENT_DATE)
                ), 0)
            )
            FROM public.payments
            WHERE receiver_id = p_owner_id
        ),
        'disputes', (
            SELECT json_build_object(
                'open', COUNT(*) FILTER (WHERE status = 'open'),
                'under_review', COUNT(*) FILTER (WHERE status = 'under_review'),
                'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
                'total', COUNT(*)
            )
            FROM public.disputes d
            JOIN public.leases l ON d.lease_id = l.id
            JOIN public.properties p ON l.property_id = p.id
            WHERE p.owner_id = p_owner_id
        ),
        'reviews', (
            SELECT json_build_object(
                'average_rating', COALESCE(AVG(rating), 0),
                'total_reviews', COUNT(*),
                'pending_response', COUNT(*) FILTER (WHERE response_from_owner IS NULL AND is_published = true)
            )
            FROM public.property_reviews pr
            JOIN public.properties p ON pr.property_id = p.id
            WHERE p.owner_id = p_owner_id AND pr.is_published = true
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'une propriété
CREATE OR REPLACE FUNCTION get_property_statistics(p_property_id uuid)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'views_count', (
            SELECT COUNT(*)
            FROM public.property_views
            WHERE property_id = p_property_id
        ),
        'applications_count', (
            SELECT COUNT(*)
            FROM public.rental_applications
            WHERE property_id = p_property_id
        ),
        'average_rating', (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.property_reviews
            WHERE property_id = p_property_id AND is_published = true
        ),
        'reviews_count', (
            SELECT COUNT(*)
            FROM public.property_reviews
            WHERE property_id = p_property_id AND is_published = true
        ),
        'visits_count', (
            SELECT COUNT(*)
            FROM public.property_visits
            WHERE property_id = p_property_id AND status = 'completed'
        ),
        'conversion_rate', CASE
            WHEN (SELECT COUNT(*) FROM public.property_views WHERE property_id = p_property_id) > 0 THEN
                ROUND(
                    (SELECT COUNT(*)::numeric FROM public.rental_applications WHERE property_id = p_property_id) * 100.0 /
                    (SELECT COUNT(*) FROM public.property_views WHERE property_id = p_property_id),
                    2
                )
            ELSE 0
        END
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une évaluation de propriété
CREATE OR REPLACE FUNCTION create_property_review(
    p_property_id uuid,
    p_lease_id uuid,
    p_rating integer,
    p_title text,
    p_comment text,
    p_cleanliness_rating integer DEFAULT NULL,
    p_location_rating integer DEFAULT NULL,
    p_value_rating integer DEFAULT NULL,
    p_communication_rating integer DEFAULT NULL,
    p_amenities_rating integer DEFAULT NULL,
    p_would_recommend boolean DEFAULT NULL,
    p_pros text[] DEFAULT '{}',
    p_cons text[] DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    review_id uuid;
BEGIN
    -- Vérifier que le locataire peut évaluer cette propriété
    IF NOT EXISTS (
        SELECT 1 FROM public.leases
        WHERE id = p_lease_id
        AND tenant_id = auth.uid()
        AND property_id = p_property_id
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Vous ne pouvez évaluer que les propriétés pour lesquelles vous avez un bail actif';
    END IF;

    -- Vérifier qu'une évaluation n'existe pas déjà
    IF EXISTS (
        SELECT 1 FROM public.property_reviews
        WHERE property_id = p_property_id
        AND tenant_id = auth.uid()
        AND lease_id = p_lease_id
    ) THEN
        RAISE EXCEPTION 'Vous avez déjà évalué cette propriété pour ce bail';
    END IF;

    -- Insérer la nouvelle évaluation
    INSERT INTO public.property_reviews (
        property_id,
        tenant_id,
        lease_id,
        rating,
        title,
        comment,
        cleanliness_rating,
        location_rating,
        value_rating,
        communication_rating,
        amenities_rating,
        would_recommend,
        pros,
        cons
    ) VALUES (
        p_property_id,
        auth.uid(),
        p_lease_id,
        p_rating,
        p_title,
        p_comment,
        p_cleanliness_rating,
        p_location_rating,
        p_value_rating,
        p_communication_rating,
        p_amenities_rating,
        p_would_recommend,
        p_pros,
        p_cons
    ) RETURNING id INTO review_id;

    RETURN review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un litige
CREATE OR REPLACE FUNCTION create_dispute(
    p_lease_id uuid,
    p_dispute_type text,
    p_title text,
    p_description text,
    p_severity text DEFAULT 'medium',
    p_requested_resolution text DEFAULT NULL,
    p_evidence_documents text[] DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    dispute_id uuid;
    lease_record RECORD;
    respondent_id uuid;
BEGIN
    -- Récupérer les informations du bail
    SELECT * INTO lease_record
    FROM public.leases
    WHERE id = p_lease_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bail non trouvé';
    END IF;

    -- Déterminer le répondant (l'autre partie du bail)
    IF lease_record.tenant_id = auth.uid() THEN
        respondent_id := lease_record.owner_id;
    ELSE
        respondent_id := lease_record.tenant_id;
    END IF;

    -- Créer le litige
    INSERT INTO public.disputes (
        lease_id,
        initiator_id,
        respondent_id,
        dispute_type,
        title,
        description,
        severity,
        requested_resolution,
        evidence_documents
    ) VALUES (
        p_lease_id,
        auth.uid(),
        respondent_id,
        p_dispute_type,
        p_title,
        p_description,
        p_severity,
        p_requested_resolution,
        p_evidence_documents
    ) RETURNING id INTO dispute_id;

    RETURN dispute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS Policies pour les nouvelles tables
-- ============================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

-- Policies pour property_reviews
CREATE POLICY "Users can view published reviews" ON public.property_reviews
    FOR SELECT USING (is_published = true);

CREATE POLICY "Tenants can view their own reviews" ON public.property_reviews
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Property owners can view reviews for their properties" ON public.property_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_reviews.property_id
            AND p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can insert reviews for their leases" ON public.property_reviews
    FOR INSERT WITH CHECK (
        tenant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.leases l
            WHERE l.id = lease_id
            AND l.tenant_id = auth.uid()
            AND l.property_id = property_id
        )
    );

-- Policies pour disputes
CREATE POLICY "Users can view disputes they are involved in" ON public.disputes
    FOR SELECT USING (initiator_id = auth.uid() OR respondent_id = auth.uid());

CREATE POLICY "Users can create disputes for their leases" ON public.disputes
    FOR INSERT WITH CHECK (
        initiator_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.leases l
            WHERE l.id = lease_id
            AND (l.tenant_id = auth.uid() OR l.owner_id = auth.uid())
        )
    );

-- Policies pour insurance_policies
CREATE POLICY "Property owners can view their insurance policies" ON public.insurance_policies
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Property owners can manage their insurance policies" ON public.insurance_policies
    FOR ALL USING (owner_id = auth.uid());

-- ============================================================
-- Permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION toggle_favorite TO authenticated;
GRANT EXECUTE ON FUNCTION get_owner_dashboard_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION create_property_review TO authenticated;
GRANT EXECUTE ON FUNCTION create_dispute TO authenticated;

-- ============================================================
-- Vues matérialisées pour les statistiques
-- ============================================================

-- Vue pour les statistiques globales des propriétés
CREATE MATERIALIZED VIEW IF NOT EXISTS public.property_statistics_mv AS
SELECT
    p.id as property_id,
    p.title,
    p.monthly_rent,
    p.city,
    COUNT(DISTINCT pv.id) as total_views,
    COUNT(DISTINCT ra.id) as total_applications,
    COUNT(DISTINCT CASE WHEN pr.is_published = true THEN pr.id END) as total_reviews,
    COALESCE(AVG(CASE WHEN pr.is_published = true THEN pr.rating END), 0) as average_rating,
    COUNT(DISTINCT pvis.id) as total_visits
FROM public.properties p
LEFT JOIN public.property_views pv ON p.id = pv.property_id
LEFT JOIN public.rental_applications ra ON p.id = ra.property_id
LEFT JOIN public.property_reviews pr ON p.id = pr.property_id
LEFT JOIN public.property_visits pvis ON p.id = pvis.property_id
GROUP BY p.id, p.title, p.monthly_rent, p.city;

-- Index pour la vue matérialisée
CREATE INDEX IF NOT EXISTS idx_property_statistics_mv_property_id ON public.property_statistics_mv(property_id);
CREATE INDEX IF NOT EXISTS idx_property_statistics_mv_city ON public.property_statistics_mv(city);
CREATE INDEX IF NOT EXISTS idx_property_statistics_mv_price ON public.property_statistics_mv(monthly_rent);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_property_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.property_statistics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_property_statistics TO authenticated;

-- Fin de migration
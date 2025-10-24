-- ============================================================
-- Mon Toit — Migration: Tables immobilières et fonctions
-- Date: 2025-10-24
-- ============================================================

-- 1) Table properties (biens immobiliers)
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('appartement', 'maison', 'studio', 'villa', 'duplex', 'chambre', 'local_commercial')),
  category text NOT NULL DEFAULT 'location' CHECK (category IN ('location', 'vente', 'colocation')),

  -- Localisation
  address_line1 text,
  address_line2 text,
  neighborhood text NOT NULL,
  city text NOT NULL DEFAULT 'Abidjan',
  postal_code text,
  country text NOT NULL DEFAULT 'Côte d''Ivoire',
  latitude numeric(10, 8),
  longitude numeric(11, 8),

  -- Caractéristiques
  surface numeric(8, 2) NOT NULL CHECK (surface > 0),
  surface_unit text NOT NULL DEFAULT 'm²',
  rooms_count integer CHECK (rooms_count > 0),
  bedrooms_count integer CHECK (bedrooms_count >= 0),
  bathrooms_count integer CHECK (bathrooms_count >= 0),
  floor_level integer,
  total_floors integer,

  -- Prix et frais
  price numeric(12, 2) NOT NULL CHECK (price > 0),
  price_currency text NOT NULL DEFAULT 'XOF',
  price_frequency text CHECK (price_frequency IN ('monthly', 'weekly', 'daily', 'yearly', 'one_time')),
  deposit_amount numeric(12, 2) CHECK (deposit_amount >= 0),
  agency_fees numeric(12, 2) CHECK (agency_fees >= 0),
  charges_included boolean NOT NULL DEFAULT false,

  -- Équipements et services
  furnished boolean NOT NULL DEFAULT false,
  parking boolean NOT NULL DEFAULT false,
  elevator boolean NOT NULL DEFAULT false,
  balcony boolean NOT NULL DEFAULT false,
  terrace boolean NOT NULL DEFAULT false,
  garden boolean NOT NULL DEFAULT false,
  pool boolean NOT NULL DEFAULT false,
  air_conditioning boolean NOT NULL DEFAULT false,
  security_system boolean NOT NULL DEFAULT false,
  water_included boolean NOT NULL DEFAULT false,
  electricity_included boolean NOT NULL DEFAULT false,
  internet_included boolean NOT NULL DEFAULT false,
  cleaning_included boolean NOT NULL DEFAULT false,

  -- Disponibilité et statut
  available_from date,
  status text NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'loué', 'vendu', 'réservé', 'en_maintenance', 'indisponible')),
  publication_status text NOT NULL DEFAULT 'brouillon' CHECK (publication_status IN ('brouillon', 'en_attente', 'approuvé', 'rejeté', 'désactivé')),
  verification_status text NOT NULL DEFAULT 'en_attente' CHECK (verification_status IN ('en_attente', 'vérifié', 'rejeté')),

  -- Médias et visites
  images jsonb DEFAULT '[]',
  videos jsonb DEFAULT '[]',
  virtual_tour_url text,
  floor_plan_url text,

  -- Visites et contact
  visit_allowed boolean NOT NULL DEFAULT true,
  visit_schedule jsonb DEFAULT '{}',
  contact_preferences jsonb DEFAULT '{}',

  -- Métadonnées
  features jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  view_count integer NOT NULL DEFAULT 0,
  contact_count integer NOT NULL DEFAULT 0,
  favorite_count integer NOT NULL DEFAULT 0,

  -- Horodatages
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,

  -- Modération
  moderated_by uuid REFERENCES auth.users(id),
  moderation_reason text,
  moderated_at timestamptz,

  -- Référence unique
  reference text UNIQUE DEFAULT (
    'MT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(md5(gen_random_uuid()::text), 1, 8))
  )
);

-- Trigger updated_at pour properties
DROP TRIGGER IF EXISTS trg_properties_updated_at ON public.properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2) Table rental_applications (candidatures de location)
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations personnelles
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  birth_date date,

  -- Situation professionnelle
  profession text,
  employer text,
  monthly_income numeric(12, 2),
  contract_type text CHECK (contract_type IN ('cdi', 'cdd', 'alternance', 'stage', 'freelance', 'retraite', 'sans_emploi')),

  -- Informations complémentaires
  current_housing_situation text,
  moving_reason text,
  guarantor_info jsonb,

  -- Documents
  documents jsonb DEFAULT '{}',

  -- Statut de la candidature
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_examen', 'acceptée', 'refusée', 'retirée')),
  priority integer NOT NULL DEFAULT 0,

  -- Messages et notes
  cover_letter text,
  tenant_notes text,
  owner_notes text,
  internal_notes text,

  -- Horodatages
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  responded_at timestamptz,

  -- Suivi
  reviewed_by uuid REFERENCES auth.users(id),
  responded_by uuid REFERENCES auth.users(id),

  -- Notification
  email_sent boolean NOT NULL DEFAULT false,
  sms_sent boolean NOT NULL DEFAULT false
);

-- Trigger updated_at pour rental_applications
DROP TRIGGER IF EXISTS trg_rental_applications_updated_at ON public.rental_applications;
CREATE TRIGGER trg_rental_applications_updated_at
  BEFORE UPDATE ON public.rental_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3) Table user_verifications (vérifications utilisateur)
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('identity', 'address', 'income', 'professional', 'guarantor')),

  -- Documents de vérification
  documents jsonb DEFAULT '{}',
  document_urls jsonb DEFAULT '{}',

  -- Statut de vérification
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_examen', 'approuvé', 'rejeté', 'expiré')),

  -- Validation
  verified_by uuid REFERENCES auth.users(id),
  verification_notes text,
  rejection_reason text,

  -- Dates limites
  expires_at timestamptz,
  reminder_sent_at timestamptz,

  -- Horodatages
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,

  -- Métadonnées
  metadata jsonb DEFAULT '{}',

  -- Contrainte d'unicité
  UNIQUE(user_id, verification_type)
);

-- Trigger updated_at pour user_verifications
DROP TRIGGER IF EXISTS trg_user_verifications_updated_at ON public.user_verifications;
CREATE TRIGGER trg_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4) Table search_history (historique de recherche)
CREATE TABLE IF NOT EXISTS public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,

  -- Critères de recherche
  search_criteria jsonb DEFAULT '{}',
  filters jsonb DEFAULT '{}',
  location text,
  property_type text,
  price_min numeric(12, 2),
  price_max numeric(12, 2),
  surface_min numeric(8, 2),
  surface_max numeric(8, 2),

  -- Résultats
  results_count integer NOT NULL DEFAULT 0,
  clicked_properties jsonb DEFAULT '[]',

  -- Horodatages
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Métadonnées
  ip_address text,
  user_agent text,
  referrer text
);

-- 5) Table user_preferences (préférences utilisateur)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Préférences de notification
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  push_notifications boolean NOT NULL DEFAULT true,

  -- Préférences de recherche
  default_search_radius numeric(5, 2) DEFAULT 5.0,
  preferred_neighborhoods text[] DEFAULT '{}',
  property_types text[] DEFAULT '{}',

  -- Alertes automatiques
  price_alerts boolean NOT NULL DEFAULT true,
  new_property_alerts boolean NOT NULL DEFAULT true,
  price_drop_alerts boolean NOT NULL DEFAULT true,

  -- Confidentialité
  profile_public boolean NOT NULL DEFAULT false,
  show_contact_info boolean NOT NULL DEFAULT false,

  -- Affichage
  items_per_page integer NOT NULL DEFAULT 12,
  map_view_default boolean NOT NULL DEFAULT false,

  -- Horodatages
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Contrainte d'unicité
  UNIQUE(user_id)
);

-- Trigger updated_at pour user_preferences
DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Fin de migration
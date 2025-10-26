-- Création de la table notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('recommendations', 'messages', 'visits', 'applications', 'payments', 'system')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, category)
);

-- Index pour la table notification_preferences
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_category ON notification_preferences(category);
CREATE INDEX idx_notification_preferences_enabled ON notification_preferences(enabled);

-- Trigger pour updated_at
CREATE TRIGGER handle_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Création de la table property_alerts
CREATE TABLE IF NOT EXISTS property_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly', 'never')),
  last_notification_sent_at TIMESTAMP WITH TIME ZONE,
  max_price INTEGER,
  min_bedrooms INTEGER DEFAULT 1,
  max_bedrooms INTEGER,
  property_types TEXT[] DEFAULT '{}',
  neighborhoods TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  is_furnished BOOLEAN,
  min_surface_area INTEGER,
  max_surface_area INTEGER,
  has_ac BOOLEAN,
  has_parking BOOLEAN,
  has_garden BOOLEAN,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour la table property_alerts
CREATE INDEX idx_property_alerts_user_id ON property_alerts(user_id);
CREATE INDEX idx_property_alerts_active ON property_alerts(is_active);
CREATE INDEX idx_property_alerts_frequency ON property_alerts(notification_frequency);
CREATE INDEX idx_property_alerts_max_price ON property_alerts(max_price);
CREATE INDEX idx_property_alerts_neighborhoods ON property_alerts USING GIN(neighborhoods);
CREATE INDEX idx_property_alerts_cities ON property_alerts USING GIN(cities);
CREATE INDEX idx_property_alerts_property_types ON property_alerts USING GIN(property_types);

-- Trigger pour updated_at
CREATE TRIGGER handle_property_alerts_updated_at
  BEFORE UPDATE ON property_alerts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Activer RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour notification_preferences
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Politiques RLS pour property_alerts
CREATE POLICY "Users can view own property alerts" ON property_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own property alerts" ON property_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Insérer des préférences par défaut pour les utilisateurs existants
INSERT INTO notification_preferences (user_id, category, enabled, email_enabled, sms_enabled, push_enabled, frequency)
SELECT
  p.id as user_id,
  categories.category,
  true as enabled,
  CASE
    WHEN categories.category IN ('recommendations', 'applications', 'visits') THEN true
    ELSE true
  END as email_enabled,
  CASE
    WHEN categories.category = 'payments' THEN true
    ELSE false
  END as sms_enabled,
  true as push_enabled,
  'immediate' as frequency
FROM profiles p
CROSS JOIN (SELECT unnest(ARRAY['recommendations', 'messages', 'visits', 'applications', 'payments', 'system']) as category) categories
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np
  WHERE np.user_id = p.id AND np.category = categories.category
);
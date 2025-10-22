-- Migration pour le Dashboard de Sécurité Admin
-- Crée les tables nécessaires pour le monitoring de sécurité en temps réel

-- Table pour stocker les activités suspectes détectées automatiquement
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  ip_address INET NOT NULL,
  user_agent TEXT,
  metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT
);

-- Table pour les métriques de sécurité quotidiennes
CREATE TABLE IF NOT EXISTS security_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_admins INTEGER DEFAULT 0,
  mfa_compliant_admins INTEGER DEFAULT 0,
  failed_logins_24h INTEGER DEFAULT 0,
  successful_logins_24h INTEGER DEFAULT 0,
  suspicious_activities_count INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100 CHECK (security_score >= 0 AND security_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Table pour suivre les tentatives d'accès non autorisées
CREATE TABLE IF NOT EXISTS unauthorized_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  ip_address INET NOT NULL,
  attempted_resource VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  http_status INTEGER NOT NULL,
  user_agent TEXT,
  path VARCHAR(500),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function pour créer des alertes de sécurité automatiques
CREATE OR REPLACE FUNCTION create_security_alert(
  p_type VARCHAR(100),
  p_description TEXT,
  p_severity VARCHAR(20),
  p_user_id UUID DEFAULT NULL,
  p_user_email VARCHAR(255) DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO suspicious_activities (
    type, description, severity, user_id, user_email, ip_address, user_agent, metadata
  ) VALUES (
    p_type, p_description, p_severity, p_user_id, p_user_email, p_ip_address, p_user_agent, p_metadata
  ) RETURNING id INTO alert_id;

  RETURN alert_id;
END;
$$;

-- Fonction pour mettre à jour les métriques de sécurité quotidiennes
CREATE OR REPLACE FUNCTION update_daily_security_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_users_count INTEGER;
  active_admins_count INTEGER;
  mfa_compliant_count INTEGER;
  failed_logins_count INTEGER;
  successful_logins_count INTEGER;
  suspicious_count INTEGER;
  security_score_value INTEGER;
BEGIN
  -- Compter le total des utilisateurs
  SELECT COUNT(*) INTO total_users_count
  FROM profiles;

  -- Compter les admins actifs
  SELECT COUNT(DISTINCT ur.user_id) INTO active_admins_count
  FROM user_roles ur
  WHERE ur.role = 'admin';

  -- Pour l'instant, on estime la conformité MFA à 0 (à implémenter avec auth.mfa)
  SELECT 0 INTO mfa_compliant_count;

  -- Compter les connexions échouées des 24 dernières heures
  SELECT COUNT(*) INTO failed_logins_count
  FROM login_attempts
  WHERE success = false
  AND created_at >= NOW() - INTERVAL '24 hours';

  -- Compter les connexions réussies des 24 dernières heures
  SELECT COUNT(*) INTO successful_logins_count
  FROM login_attempts
  WHERE success = true
  AND created_at >= NOW() - INTERVAL '24 hours';

  -- Compter les activités suspectes non résolues
  SELECT COUNT(*) INTO suspicious_count
  FROM suspicious_activities
  WHERE status IN ('open', 'investigating');

  -- Calculer le score de sécurité
  security_score_value := 100;

  -- Réduire le score pour les activités suspectes
  security_score_value := security_score_value - LEAST(suspicious_count * 5, 30);

  -- Réduire le score pour les connexions échouées excessives
  IF failed_logins_count > 10 THEN
    security_score_value := security_score_value - LEAST((failed_logins_count - 10) * 2, 30);
  END IF;

  -- Insérer ou mettre à jour les métriques du jour
  INSERT INTO security_metrics (
    date, total_users, active_admins, mfa_compliant_admins,
    failed_logins_24h, successful_logins_24h, suspicious_activities_count,
    security_score
  ) VALUES (
    today_date, total_users_count, active_admins_count, mfa_compliant_count,
    failed_logins_count, successful_login_count, suspicious_count,
    GREATEST(0, security_score_value)
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_admins = EXCLUDED.active_admins,
    mfa_compliant_admins = EXCLUDED.mfa_compliant_admins,
    failed_logins_24h = EXCLUDED.failed_logins_24h,
    successful_logins_24h = EXCLUDED.successful_logins_24h,
    suspicious_activities_count = EXCLUDED.suspicious_activities_count,
    security_score = EXCLUDED.security_score,
    updated_at = NOW();
END;
$$;

-- Trigger pour créer automatiquement des alertes de sécurité
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Créer une alerte pour les tentatives de connexion multiples échouées
  IF TG_TABLE_NAME = 'login_attempts' AND NOT NEW.success THEN
    -- Vérifier s'il y a eu plus de 5 tentatives échouées depuis la même IP dans la dernière heure
    IF EXISTS (
      SELECT 1 FROM login_attempts
      WHERE ip_address = NEW.ip_address
      AND success = false
      AND created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY ip_address
      HAVING COUNT(*) >= 5
    ) THEN
      PERFORM create_security_alert(
        'multiple_failed_logins',
        'Tentatives de connexion multiples échouées détectées depuis cette adresse IP',
        'medium',
        NEW.user_id,
        NULL,
        NEW.ip_address,
        NEW.user_agent,
        jsonb_build_object('attempt_count', 5)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table login_attempts
CREATE TRIGGER suspicious_activity_trigger
AFTER INSERT ON login_attempts
FOR EACH ROW
EXECUTE FUNCTION detect_suspicious_activity();

-- RLS policies pour la sécurité
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE unauthorized_access_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Seuls les admins peuvent voir les activités suspectes
CREATE POLICY "Admins can view suspicious activities" ON suspicious_activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Policy: Seuls les admins peuvent voir les métriques de sécurité
CREATE POLICY "Admins can view security metrics" ON security_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Policy: Seuls les admins peuvent voir les tentatives d'accès non autorisées
CREATE POLICY "Admins can view unauthorized attempts" ON unauthorized_access_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Policy: Les admins peuvent modifier les activités suspectes
CREATE POLICY "Admins can update suspicious activities" ON suspicious_activities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Policy: Les admins peuvent insérer des activités suspectes
CREATE POLICY "Admins can insert suspicious activities" ON suspicious_activities
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_status ON suspicious_activities(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_created_at ON suspicious_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unauthorized_attempts_created_at ON unauthorized_access_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_metrics_date ON security_metrics(date DESC);

-- Créer une tâche planifiée pour mettre à jour les métriques quotidiennement
-- Note: Ceci nécessite l'extension pg_cron
-- SELECT cron.schedule('update-security-metrics', '0 2 * * *', 'SELECT update_daily_security_metrics();');

-- Audit trigger pour les modifications sur les activités suspectes
CREATE OR REPLACE FUNCTION audit_suspicious_activities_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Logger la résolution d'activité suspecte
    IF OLD.status != NEW.status AND NEW.status = 'resolved' THEN
      INSERT INTO admin_audit_logs (
        admin_id, action_type, target_type, target_id, action_metadata, created_at
      ) VALUES (
        NEW.resolved_by,
        'suspicious_activity_resolved',
        'suspicious_activity',
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'resolution_notes', NEW.resolution_notes
        ),
        NOW()
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger d'audit sur les activités suspectes
CREATE TRIGGER suspicious_activities_audit_trigger
AFTER UPDATE ON suspicious_activities
FOR EACH ROW
EXECUTE FUNCTION audit_suspicious_activities_changes();

-- Commentaires sur les tables
COMMENT ON TABLE suspicious_activities IS 'Stocke les activités suspectes détectées par le système de sécurité';
COMMENT ON TABLE security_metrics IS 'Métriques de sécurité quotidiennes pour le dashboard admin';
COMMENT ON TABLE unauthorized_access_attempts IS 'Journal des tentatives d accès non autorisées';
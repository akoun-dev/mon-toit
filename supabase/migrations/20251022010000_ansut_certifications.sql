-- Migration pour les Certifications ANSUT
-- Système complet de gestion des certifications selon les user stories admin

-- Table principale pour les demandes de certification ANSUT
CREATE TABLE IF NOT EXISTS ansut_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type de certification
  certification_type VARCHAR(50) NOT NULL CHECK (certification_type IN (
    'lease_certification',
    'property_verification',
    'tenant_verification'
  )),

  -- Statut et priorité
  status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested',
    'in_review',
    'approved',
    'rejected',
    'requires_additional_info'
  )),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low',
    'medium',
    'high',
    'urgent'
  )),

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),

  -- Notes et motifs
  certification_notes TEXT,
  rejection_reason TEXT,
  approval_notes TEXT,
  additional_info_requested TEXT[],
  additional_info_provided TEXT[],

  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  certificate_number VARCHAR(50) UNIQUE,
  certificate_issued_at TIMESTAMPTZ,
  certificate_expires_at TIMESTAMPTZ,
  certificate_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les documents des certifications
CREATE TABLE IF NOT EXISTS certification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID REFERENCES ansut_certifications(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT
);

-- Vue pour les statistiques des certifications
CREATE OR REPLACE VIEW ansut_certification_stats AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'requested') as pending,
  COUNT(*) FILTER (WHERE status = 'in_review') as in_review,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'requires_additional_info') as requires_info,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE date_trunc('month', requested_at) = date_trunc('month', CURRENT_DATE)) as this_month,
  AVG(
    CASE
      WHEN reviewed_at IS NOT NULL AND status IN ('approved', 'rejected')
      THEN EXTRACT(EPOCH FROM (reviewed_at - requested_at)) / (24 * 3600)
      ELSE NULL
    END
  ) as avg_processing_time_days
FROM ansut_certifications;

-- Fonction pour créer une demande de certification
CREATE OR REPLACE FUNCTION create_certification_request(
  p_lease_id UUID,
  p_certification_type VARCHAR(50),
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  certification_id UUID;
  lease_info RECORD;
BEGIN
  -- Récupérer les informations du bail
  SELECT
    l.id, l.property_id, l.landlord_id, l.tenant_id
  INTO lease_info
  FROM leases l
  WHERE l.id = p_lease_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bail non trouvé: %', p_lease_id;
  END IF;

  -- Créer la demande de certification
  INSERT INTO ansut_certifications (
    lease_id, property_id, landlord_id, tenant_id,
    certification_type, priority, certification_notes, metadata
  ) VALUES (
    lease_info.id, lease_info.property_id, lease_info.landlord_id, lease_info.tenant_id,
    p_certification_type, p_priority, p_notes, COALESCE(p_metadata, '{}')
  ) RETURNING id INTO certification_id;

  -- Logger l'action
  INSERT INTO admin_audit_logs (
    admin_id, action_type, target_type, target_id, action_metadata
  ) VALUES (
    lease_info.landlord_id,
    'certification_requested',
    'ansut_certification',
    certification_id,
    jsonb_build_object(
      'certification_type', p_certification_type,
      'priority', p_priority,
      'lease_id', p_lease_id
    )
  );

  RETURN certification_id;
END;
$$;

-- Fonction pour mettre à jour le statut d'une certification
CREATE OR REPLACE FUNCTION update_certification_status(
  p_certification_id UUID,
  p_new_status VARCHAR(50),
  p_notes TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_status VARCHAR(50);
BEGIN
  -- Vérifier les permissions
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission refusée: rôle admin requis';
  END IF;

  -- Récupérer le statut actuel
  SELECT status INTO current_status
  FROM ansut_certifications
  WHERE id = p_certification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Certification non trouvée: %', p_certification_id;
  END IF;

  -- Mettre à jour la certification
  UPDATE ansut_certifications SET
    status = p_new_status,
    reviewed_at = NOW(),
    reviewed_by = current_user_id,
    approval_notes = CASE WHEN p_new_status = 'approved' THEN p_notes ELSE approval_notes END,
    rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
    updated_at = NOW()
  WHERE id = p_certification_id;

  -- Si approuvée, générer un numéro de certificat
  IF p_new_status = 'approved' THEN
    UPDATE ansut_certifications SET
      certificate_number = 'ANSUT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0') || '-' ||
                        LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0'),
      certificate_issued_at = NOW(),
      certificate_expires_at = NOW() + INTERVAL '1 year'
    WHERE id = p_certification_id;
  END IF;

  -- Logger l'action
  INSERT INTO admin_audit_logs (
    admin_id, action_type, target_type, target_id, action_metadata
  ) VALUES (
    current_user_id,
    'certification_status_updated',
    'ansut_certification',
    p_certification_id,
    jsonb_build_object(
      'old_status', current_status,
      'new_status', p_new_status,
      'notes', p_notes,
      'rejection_reason', p_rejection_reason
    )
  );

  RETURN TRUE;
END;
$$;

-- Fonction pour ajouter un document à une certification
CREATE OR REPLACE FUNCTION add_certification_document(
  p_certification_id UUID,
  p_document_type VARCHAR(100),
  p_file_url TEXT,
  p_file_name VARCHAR(255),
  p_file_size BIGINT DEFAULT NULL,
  p_mime_type VARCHAR(100) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  document_id UUID;
  current_user_id UUID := auth.uid();
  certification_owner_id UUID;
BEGIN
  -- Vérifier que la certification existe
  SELECT landlord_id INTO certification_owner_id
  FROM ansut_certifications
  WHERE id = p_certification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Certification non trouvée: %', p_certification_id;
  END IF;

  -- Vérifier les permissions (admin ou propriétaire du bail)
  IF current_user_id != certification_owner_id AND NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  -- Ajouter le document
  INSERT INTO certification_documents (
    certification_id, document_type, file_url, file_name,
    file_size, mime_type, uploaded_by
  ) VALUES (
    p_certification_id, p_document_type, p_file_url, p_file_name,
    p_file_size, p_mime_type, current_user_id
  ) RETURNING id INTO document_id;

  -- Logger l'action
  INSERT INTO admin_audit_logs (
    admin_id, action_type, target_type, target_id, action_metadata
  ) VALUES (
    current_user_id,
    'certification_document_added',
    'certification_document',
    document_id,
    jsonb_build_object(
      'certification_id', p_certification_id,
      'document_type', p_document_type,
      'file_name', p_file_name
    )
  );

  RETURN document_id;
END;
$$;

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_ansut_certifications_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Créer les triggers
CREATE TRIGGER update_ansut_certifications_timestamp
  BEFORE UPDATE ON ansut_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ansut_certifications_timestamp();

-- RLS Policies
ALTER TABLE ansut_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres certifications
CREATE POLICY "Users can view their own certifications" ON ansut_certifications
FOR SELECT USING (
  landlord_id = auth.uid() OR
  tenant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Les propriétaires peuvent créer des certifications pour leurs baux
CREATE POLICY "Landlords can create certifications" ON ansut_certifications
FOR INSERT WITH CHECK (
  landlord_id = auth.uid()
);

-- Policy: Seuls les admins peuvent modifier les certifications
CREATE POLICY "Admins can update certifications" ON ansut_certifications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Les utilisateurs peuvent voir les documents de leurs certifications
CREATE POLICY "Users can view certification documents" ON certification_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ansut_certifications c
    WHERE c.id = certification_documents.certification_id
    AND (c.landlord_id = auth.uid() OR c.tenant_id = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Les utilisateurs peuvent uploader des documents pour leurs certifications
CREATE POLICY "Users can upload certification documents" ON certification_documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM ansut_certifications c
    WHERE c.id = certification_documents.certification_id
    AND (c.landlord_id = auth.uid() OR c.tenant_id = auth.uid())
  )
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ansut_certifications_status ON ansut_certifications(status);
CREATE INDEX IF NOT EXISTS idx_ansut_certifications_priority ON ansut_certifications(priority);
CREATE INDEX IF NOT EXISTS idx_ansut_certifications_landlord_id ON ansut_certifications(landlord_id);
CREATE INDEX IF NOT EXISTS idx_ansut_certifications_tenant_id ON ansut_certifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ansut_certifications_requested_at ON ansut_certifications(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_certification_documents_certification_id ON certification_documents(certification_id);

-- Trigger pour créer automatiquement des certificats numériques
CREATE OR REPLACE FUNCTION generate_digital_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- TODO: Implémenter la génération de certificat numérique
  -- Si la certification est approuvée et n'a pas encore de certificat numérique
  -- IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.certificate_number IS NULL THEN
  --   -- Générer automatiquement un numéro de certificat
  --   NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 8);
  --   NEW.certificate_issued_at := NOW();
  --   NEW.certificate_expires_at := NOW() + INTERVAL '1 year';
  -- END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour générer des certificats numériques automatiquement
CREATE TRIGGER generate_digital_certificate_trigger
AFTER UPDATE ON ansut_certifications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION generate_digital_certificate();

-- Commentaires sur les tables
COMMENT ON TABLE ansut_certifications IS 'Table principale pour les demandes de certification ANSUT';
COMMENT ON TABLE certification_documents IS 'Documents associés aux demandes de certification';
COMMENT ON VIEW ansut_certification_stats IS 'Vue statistique pour les certifications ANSUT';
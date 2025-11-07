-- ============================================
-- MZAKA-BF Database Schema
-- Burkina Faso Real Estate Platform
-- ============================================

-- Table contracts (remplace leases avec fonctionnalités étendues)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent_cfa INTEGER NOT NULL CHECK (monthly_rent_cfa > 0),
  deposit_cfa INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'awaiting_signature', 'active', 'expired', 'terminated')),
  pdf_url TEXT,
  verify_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT
);

CREATE INDEX idx_contracts_owner ON public.contracts(owner_id);
CREATE INDEX idx_contracts_tenant ON public.contracts(tenant_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_verify_id ON public.contracts(verify_id);

-- RLS pour contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contracts visible par parties et admin" ON public.contracts
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = tenant_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owner peut créer contrats" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Parties peuvent mettre à jour contrats" ON public.contracts
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    auth.uid() = tenant_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Table contract_signatures
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('otp', 'certificate')),
  hash_sha256 TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_addr TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX idx_signatures_signer ON public.contract_signatures(signer_id);

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signatures visibles par parties du contrat" ON public.contract_signatures
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM public.contracts 
      WHERE owner_id = auth.uid() OR tenant_id = auth.uid()
    )
  );

CREATE POLICY "System peut insérer signatures" ON public.contract_signatures
  FOR INSERT WITH CHECK (auth.uid() = signer_id);

-- Table payment_intents_fa (Faso Arzeka)
CREATE TABLE IF NOT EXISTS public.payment_intents_fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('BAIL_FEE', 'RENT', 'RECEIPT_SINGLE', 'RECEIPT_PACK')),
  reference TEXT UNIQUE NOT NULL,
  amount_cfa INTEGER NOT NULL CHECK (amount_cfa > 0),
  channel TEXT CHECK (channel IN ('web', 'app', 'ussd')),
  status TEXT NOT NULL DEFAULT 'created' 
    CHECK (status IN ('created', 'pending', 'paid', 'failed', 'expired')),
  redirect_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_payment_intents_user ON public.payment_intents_fa(user_id);
CREATE INDEX idx_payment_intents_reference ON public.payment_intents_fa(reference);
CREATE INDEX idx_payment_intents_status ON public.payment_intents_fa(status);

ALTER TABLE public.payment_intents_fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users voient leurs payment intents" ON public.payment_intents_fa
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users créent leurs payment intents" ON public.payment_intents_fa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System met à jour payment intents" ON public.payment_intents_fa
  FOR UPDATE USING (true);

-- Table fa_callbacks (logs webhooks Faso Arzeka)
CREATE TABLE IF NOT EXISTS public.fa_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  status_after TEXT NOT NULL,
  signature_ok BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fa_callbacks_reference ON public.fa_callbacks(reference);
CREATE INDEX idx_fa_callbacks_received ON public.fa_callbacks(received_at);

ALTER TABLE public.fa_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin voit callbacks FA" ON public.fa_callbacks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System insère callbacks FA" ON public.fa_callbacks
  FOR INSERT WITH CHECK (true);

-- Table receipts (quittances)
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  month_year TEXT NOT NULL,
  amount_cfa INTEGER NOT NULL,
  pdf_url TEXT,
  qr_id TEXT UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_payment ON public.receipts(payment_id);
CREATE INDEX idx_receipts_contract ON public.receipts(contract_id);
CREATE INDEX idx_receipts_qr ON public.receipts(qr_id);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receipts visibles par parties" ON public.receipts
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM public.contracts 
      WHERE owner_id = auth.uid() OR tenant_id = auth.uid()
    ) OR
    payment_id IN (
      SELECT id FROM public.payments 
      WHERE payer_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

CREATE POLICY "System insère receipts" ON public.receipts
  FOR INSERT WITH CHECK (true);

-- Table chatbot_sessions (YiriBot)
CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'mos', 'dyo', 'en')),
  context JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_chatbot_sessions_user ON public.chatbot_sessions(user_id);

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users gèrent leurs sessions chatbot" ON public.chatbot_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table chatbot_messages
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chatbot_messages_session ON public.chatbot_messages(session_id);

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users voient messages de leurs sessions" ON public.chatbot_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.chatbot_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users insèrent messages dans leurs sessions" ON public.chatbot_messages
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.chatbot_sessions WHERE user_id = auth.uid()
    )
  );

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer reference Faso Arzeka
CREATE OR REPLACE FUNCTION generate_fa_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FAZ-MZAKA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer verify_id unique
CREATE OR REPLACE FUNCTION generate_verify_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'VRF-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
END;
$$ LANGUAGE plpgsql;
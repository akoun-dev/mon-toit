-- Migration: Create payments, leases, and messages tables
-- Description: Add missing tables for complete rental management functionality

-- Create leases table first (needed by payments foreign key)
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lease_number TEXT UNIQUE,
  status TEXT DEFAULT 'draft', -- draft, active, expired, terminated, pending, signed
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent INTEGER NOT NULL,
  deposit_amount INTEGER,
  currency TEXT DEFAULT 'XOF',
  payment_frequency TEXT DEFAULT 'monthly', -- weekly, monthly, quarterly, yearly
  payment_day INTEGER DEFAULT 1, -- Day of month for payment
  late_fee_amount INTEGER DEFAULT 0,
  late_fee_percentage DECIMAL(5,2) DEFAULT 0,
  grace_period_days INTEGER DEFAULT 0,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  termination_notice_days INTEGER DEFAULT 30,
  security_deposit_return_conditions TEXT,
  property_condition_notes TEXT,
  included_utilities TEXT[],
  forbidden_activities TEXT[],
  pet_policy TEXT,
  smoking_policy TEXT,
  subletting_allowed BOOLEAN DEFAULT false,
  maintenance_responsibilities JSONB DEFAULT '{}',
  contact_preferences JSONB DEFAULT '{}',
  emergency_contact JSONB,
  special_terms TEXT,
  signed_document_url TEXT,
  owner_signature_url TEXT,
  tenant_signature_url TEXT,
  witness_name TEXT,
  witness_signature_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  terminated_at TIMESTAMP WITH TIME ZONE,
  termination_reason TEXT,
  early_termination_fee INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_type TEXT NOT NULL, -- rent, deposit, fees, utilities, maintenance
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded, cancelled
  payment_method TEXT, -- mobile_money, bank_transfer, cash, card, check
  payment_reference TEXT UNIQUE,
  description TEXT,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  external_transaction_id TEXT,
  payment_gateway_response JSONB,
  invoice_url TEXT,
  receipt_url TEXT,
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'message', -- message, notification, alert, document, inquiry
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT DEFAULT 'sent', -- sent, delivered, read, replied, deleted
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add missing columns to rental_applications
DO $$
BEGIN
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'normal';
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS property_visit_scheduled BOOLEAN DEFAULT false;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS property_visit_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS owner_notes TEXT;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS automated_reminders_sent INTEGER DEFAULT 0;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS internal_notes TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS payments_payer_id_idx ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS payments_recipient_id_idx ON public.payments(recipient_id);
CREATE INDEX IF NOT EXISTS payments_property_id_idx ON public.payments(property_id);
CREATE INDEX IF NOT EXISTS payments_lease_id_idx ON public.payments(lease_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_due_date_idx ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS payments_payment_type_idx ON public.payments(payment_type);

-- Create indexes for leases
CREATE INDEX IF NOT EXISTS leases_property_id_idx ON public.leases(property_id);
CREATE INDEX IF NOT EXISTS leases_tenant_id_idx ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS leases_owner_id_idx ON public.leases(owner_id);
CREATE INDEX IF NOT EXISTS leases_status_idx ON public.leases(status);
CREATE INDEX IF NOT EXISTS leases_lease_number_idx ON public.leases(lease_number);
CREATE INDEX IF NOT EXISTS leases_dates_idx ON public.leases(start_date, end_date);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_property_id_idx ON public.messages(property_id);
CREATE INDEX IF NOT EXISTS messages_lease_id_idx ON public.messages(lease_id);
CREATE INDEX IF NOT EXISTS messages_status_idx ON public.messages(status);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS messages_parent_message_id_idx ON public.messages(parent_message_id);

-- Create additional indexes for rental_applications
CREATE INDEX IF NOT EXISTS rental_applications_is_overdue_idx ON public.rental_applications(is_overdue);
CREATE INDEX IF NOT EXISTS rental_applications_urgency_level_idx ON public.rental_applications(urgency_level);

-- Triggers for updated_at
CREATE TRIGGER handle_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (payer_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (payer_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can update own payments" ON public.payments
  FOR UPDATE USING (payer_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Property owners can view related payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- RLS Policies for leases
CREATE POLICY "Tenants can view own leases" ON public.leases
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Owners can view own property leases" ON public.leases
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Tenants can update own leases" ON public.leases
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Owners can manage own property leases" ON public.leases
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all leases" ON public.leases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all leases" ON public.leases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

-- RPC Functions
CREATE OR REPLACE FUNCTION public.generate_lease_number()
RETURNS TEXT AS $$
DECLARE
  lease_number TEXT;
  year_part TEXT := EXTRACT(year FROM CURRENT_DATE)::TEXT;
  sequence_num INTEGER;
BEGIN
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(lease_number FROM 7) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.leases
  WHERE lease_number LIKE 'LEASE-' || year_part || '%';

  lease_number := 'LEASE-' || year_part || LPAD(sequence_num::TEXT, 4, '0');

  RETURN lease_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT,
  property_id UUID,
  property_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT DISTINCT
      CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END as other_user_id,
      m.property_id
    FROM public.messages m
    WHERE (m.sender_id = p_user_id OR m.receiver_id = p_user_id)
  ),
  last_messages AS (
    SELECT DISTINCT ON (c.other_user_id, c.property_id)
      c.other_user_id,
      c.property_id,
      m.content as last_message,
      m.created_at as last_message_at
    FROM conversations c
    JOIN public.messages m ON (
      (m.sender_id = p_user_id AND m.receiver_id = c.other_user_id) OR
      (m.receiver_id = p_user_id AND m.sender_id = c.other_user_id)
    )
    WHERE m.property_id = c.property_id OR (m.property_id IS NULL AND c.property_id IS NULL)
    ORDER BY c.other_user_id, c.property_id, m.created_at DESC
  )
  SELECT
    gen_random_uuid() as conversation_id,
    lm.other_user_id,
    p.full_name as other_user_name,
    p.avatar_url as other_user_avatar,
    lm.last_message,
    lm.last_message_at,
    (SELECT COUNT(*) FROM public.messages m2
     WHERE m2.receiver_id = p_user_id AND m2.sender_id = lm.other_user_id
     AND m2.read_at IS NULL) as unread_count,
    lm.property_id,
    pr.title as property_title
  FROM last_messages lm
  LEFT JOIN public.profiles p ON lm.other_user_id = p.id
  LEFT JOIN public.properties pr ON lm.property_id = pr.id
  ORDER BY lm.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_sender_id UUID, p_receiver_id UUID, p_property_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  UPDATE public.messages
  SET read_at = now(), updated_at = now()
  WHERE sender_id = p_sender_id
    AND receiver_id = p_receiver_id
    AND read_at IS NULL
    AND (p_property_id IS NULL OR property_id = p_property_id);

  GET DIAGNOSTICS marked_count = ROW_COUNT;
  RETURN marked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.payments IS 'Paiements entre utilisateurs (loyer, caution, frais, etc.)';
COMMENT ON TABLE public.leases IS 'Contrats de location entre propriétaires et locataires';
COMMENT ON TABLE public.messages IS 'Messages et communications entre utilisateurs';
COMMENT ON FUNCTION public.generate_lease_number IS 'Générer un numéro de bail automatique';
COMMENT ON FUNCTION public.get_user_conversations IS 'Récupérer les conversations d un utilisateur';
COMMENT ON FUNCTION public.mark_messages_as_read IS 'Marquer les messages comme lus';

-- Grant permissions for RPC functions
GRANT EXECUTE ON FUNCTION public.generate_lease_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read TO authenticated;
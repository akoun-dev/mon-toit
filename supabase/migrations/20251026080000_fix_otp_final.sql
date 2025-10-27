-- Migration finale pour corriger le système OTP sans conflits
-- Date: 2025-10-26
-- Description: Utilise les fonctions existantes et complète le système

-- Table otp_codes si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT false
);

-- Rendre user_id nullable pour éviter les conflits pendant l'inscription
ALTER TABLE public.otp_codes ALTER COLUMN user_id DROP NOT NULL;

-- Activer RLS si pas déjà fait
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Politiques pour otp_codes (si pas déjà créées)
DROP POLICY IF EXISTS "Enable read access for admins" ON public.otp_codes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.otp_codes;

CREATE POLICY "Enable read access for admins" ON public.otp_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON public.otp_codes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Permissions (si pas déjà accordées)
GRANT ALL ON public.otp_codes TO authenticated;
GRANT SELECT ON public.otp_codes TO anon;

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON public.otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Mettre à jour create_otp_code pour qu'elle stocke dans la table
CREATE OR REPLACE FUNCTION public.create_otp_code(
  p_email TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_token TEXT;
  v_result JSON;
BEGIN
  -- Nettoyer les anciens codes expirés pour le même email
  UPDATE public.otp_codes
  SET is_used = true, used_at = now()
  WHERE email = p_email
  AND expires_at < now()
  AND is_used = false;

  -- Générer un token OTP à 6 chiffres
  v_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Insérer le nouveau code OTP (user_id peut être NULL pendant l'inscription)
  INSERT INTO public.otp_codes (email, code, user_id, user_agent, expires_at)
  VALUES (p_email, v_token, p_user_id, p_user_agent, now() + interval '15 minutes');

  -- Construire le résultat
  v_result := json_build_object(
    'success', true,
    'token', v_token,
    'email', p_email,
    'user_id', p_user_id,
    'expires_at', (now() + interval '15 minutes')::timestamp,
    'created_at', now()::timestamp,
    'message', 'Code OTP généré avec succès'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- La fonction verify_otp_code existe déjà, il suffit de s'assurer qu'elle fonctionne correctement
-- Vérifier si la fonction existante est bien configurée
DO $$
BEGIN
  -- Si la fonction n'existe pas avec les bons paramètres, la créer
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'verify_otp_code'
    AND pronargs = 3
    AND proargnames = ARRAY['p_email','p_code','p_user_agent']
  ) THEN
    EXECUTE $func$
    CREATE OR REPLACE FUNCTION public.verify_otp_code_mon_toit(
      p_email TEXT,
      p_code TEXT,
      p_user_agent TEXT DEFAULT NULL
    )
    RETURNS JSON AS $outer$
    DECLARE
      v_otp_record RECORD;
      v_result JSON;
    BEGIN
      -- Chercher le code OTP valide
      SELECT * INTO v_otp_record
      FROM public.otp_codes
      WHERE email = p_email
      AND code = p_code
      AND expires_at > now()
      AND is_used = false
      ORDER BY created_at DESC
      LIMIT 1;

      IF v_otp_record.id IS NOT NULL THEN
        -- Marquer le code comme utilisé
        UPDATE public.otp_codes
        SET is_used = true, used_at = now()
        WHERE id = v_otp_record.id;

        v_result := json_build_object(
          'success', true,
          'verified', true,
          'user_id', v_otp_record.user_id,
          'email', p_email,
          'code', p_code,
          'verified_at', now()::timestamp,
          'message', 'Code OTP vérifié avec succès'
        );
      ELSE
        v_result := json_build_object(
          'success', false,
          'verified', false,
          'email', p_email,
          'code', p_code,
          'message', 'Code OTP invalide ou expiré'
        );
      END IF;

      RETURN v_result;
    END;
    $outer$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$;

    EXECUTE $func$
    -- Créer un alias pour compatibilité
    CREATE OR REPLACE FUNCTION public.verify_otp_code_simple(
      p_email TEXT,
      p_token TEXT
    )
    RETURNS JSON AS $outer$
    BEGIN
      RETURN public.verify_otp_code_mon_toit(p_email, p_token, NULL);
    END;
    $outer$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$;
  END IF;
END $$;

-- Permissions sur create_otp_code (la fonction existante a déjà les permissions)
GRANT EXECUTE ON FUNCTION public.create_otp_code TO anon, authenticated;

-- Permissions sur les fonctions de vérification si elles ont été créées
DO $$
BEGIN
  -- Vérifier si la fonction verify_otp_code_mon_toit existe avant d'accorder les permissions
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'verify_otp_code_mon_toit'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.verify_otp_code_mon_toit(TEXT, TEXT, TEXT) TO anon, authenticated';
  END IF;
  
  -- Vérifier si la fonction verify_otp_code_simple existe avant d'accorder les permissions
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'verify_otp_code_simple'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.verify_otp_code_simple(TEXT, TEXT) TO anon, authenticated';
  END IF;
END $$;

-- Ajouter des commentaires
COMMENT ON TABLE public.otp_codes IS 'Stocke les codes OTP à usage unique pour l''authentification Mon Toit';
COMMENT ON FUNCTION public.create_otp_code IS 'Génère et stocke un code OTP à 6 chiffres valide pendant 15 minutes';

-- Commentaires conditionnels pour les fonctions qui pourraient ne pas exister
DO $$
BEGIN
  -- Vérifier si la fonction verify_otp_code_mon_toit existe avant d'ajouter le commentaire
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'verify_otp_code_mon_toit'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE 'COMMENT ON FUNCTION public.verify_otp_code_mon_toit(TEXT, TEXT, TEXT) IS ''Vérifie et consomme un code OTP pour Mon Toit''';
  END IF;
  
  -- Vérifier si la fonction verify_otp_code_simple existe avant d'ajouter le commentaire
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'verify_otp_code_simple'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE 'COMMENT ON FUNCTION public.verify_otp_code_simple(TEXT, TEXT) IS ''Vérifie un code OTP de manière simplifiée''';
  END IF;
END $$;
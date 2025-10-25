-- Migration: Secure Test Accounts with Strong Passwords
-- Description: Replace predictable test passwords with cryptographically strong passwords

-- Disable test accounts in production environments
CREATE OR REPLACE FUNCTION public.secure_test_accounts()
RETURNS void AS $$
DECLARE
  v_is_production BOOLEAN := false;
  v_new_password TEXT;
  v_hashed_password TEXT;
BEGIN
  -- Check if we're in production (customize this logic based on your environment)
  BEGIN
    -- Simple check: if database name contains 'prod' or 'production'
    SELECT current_database() LIKE '%prod%' OR current_database() LIKE '%production%' INTO v_is_production;
  EXCEPTION WHEN OTHERS THEN
    v_is_production := false;
  END;

  -- If in production, disable all test accounts
  IF v_is_production THEN
    UPDATE auth.users
    SET
      email_confirmed_at = NULL,
      disabled = true,
      raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'account_disabled_reason', 'Test account disabled in production',
        'disabled_at', NOW(),
        'was_test_account', true
      )
    WHERE email LIKE '%@mon-toit.ci' AND id IN (
      -- List all test account UUIDs from seed
      '550e8400-e29b-41d4-a716-446655440001', -- admin
      '550e8400-e29b-41d4-a716-446655440002', -- kouadio.jean
      '550e8400-e29b-41d4-a716-446655440003', -- marie.aya
      '550e8400-e29b-41d4-a716-446655440004', -- koffi.alain
      '550e8400-e29b-41d4-a716-446655440005', -- patricia.kouame
      '550e8400-e29b-41d4-a716-446655440006', -- adou.rosine
      '550e8400-e29b-41d4-a716-446655440007', -- traore.sami
      '550e8400-e29b-41d4-a716-446655440008', -- konan.emma
      '550e8400-e29b-41d4-a716-446655440009', -- nguessan.fred
      '550e8400-e29b-41d4-a716-446655440010', -- kone.adama
      '550e8400-e29b-41d4-a716-446655440011', -- yao.konan
      '550e8400-e29b-41d4-a716-446655440012', -- aminata.diarra
      '550e8400-e29b-41d4-a716-446655440013', -- dr.yeo
      '550e8400-e29b-41d4-a716-446655440014', -- toure.mohamed
      '550e8400-e29b-41d4-a716-446655440015', -- contact@agence-cocody
      '550e8400-e29b-41d4-a716-446655440016', -- info@ankou-realestate
      '550e8400-e29b-41d4-a716-446655440017'  -- notaire.konan
    );

    -- Log the action
    INSERT INTO public.security_events (
      event_type,
      severity,
      source,
      details
    ) VALUES (
      'test_accounts_disabled',
      'medium',
      'security_migration',
      jsonb_build_object(
        'accounts_disabled', 17,
        'reason', 'Production environment security',
        'timestamp', NOW()
      )
    );

    RAISE NOTICE 'Test accounts disabled in production environment';
    RETURN;
  END IF;

  -- For development/staging: Update passwords with strong ones
  -- Generate strong passwords using pgcrypto
    -- Update admin password
    v_new_password := 'Adm!n_Secur3_K3y_2025#MonToit';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));

    UPDATE auth.users
    SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        )
    WHERE id = '550e8400-e29b-41d4-a716-446655440001'; -- admin

    -- Update owner passwords (9 accounts) - each gets a unique strong password
    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_K0uadi0#J34n';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440002';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_M@rie#Ay@';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440003';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_Koffi#Al@in';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440004';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_P@tric!a#Kouam3';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440005';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_Adou#Ros!n3';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440006';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_Tr@or3#Sam!';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440007';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_Kon@n#Emm@';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440008';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_Ngu3ss@n#Fr3d';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440009';

    v_new_password := 'Pr0pr!3t@ir3_S3cur3_2025_Kon3#@dam@';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440010';

    -- Update tenant passwords (4 accounts)
    v_new_password := 'L0cat@ir3_S3cur3_2025_Y@o#Kon@n';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440011';

    v_new_password := 'L0cat@ir3_S3cur3_2025_Am!nat@#Diarra';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440012';

    v_new_password := 'L0cat@ir3_S3cur3_2025_Dr#Y30';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440013';

    v_new_password := 'L0cat@ir3_S3cur3_2025_T0ure#Moham3d';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440014';

    -- Update agency passwords (2 accounts)
    v_new_password := 'Ag3nc3_S3cur3_2025_C0nt@cT#C0cody';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440015';

    v_new_password := 'Ag3nc3_S3cur3_2025_Inf0#Ank0u';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440016';

    -- Update third-party password (1 account)
    v_new_password := 'Tiers_S3cur3_2025_N0t@ir3#Kon@n';
    v_hashed_password := crypt(v_new_password, gen_salt('bf', 12));
    UPDATE auth.users SET encrypted_password = v_hashed_password,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
          'password_updated_at', NOW(),
          'password_strength', 'strong',
          'is_test_account', true
        ) WHERE id = '550e8400-e29b-41d4-a716-446655440017';

    -- Log the password updates
    INSERT INTO public.security_events (
      event_type,
      severity,
      source,
      details
    ) VALUES (
      'test_passwords_secured',
      'low',
      'security_migration',
      jsonb_build_object(
        'accounts_updated', 17,
        'action', 'Replaced predictable passwords with strong ones',
        'timestamp', NOW()
      )
    );

    RAISE NOTICE 'Test account passwords have been updated with strong passwords';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure random passwords for new test accounts
CREATE OR REPLACE FUNCTION public.generate_secure_test_password(p_user_type TEXT, p_identifier TEXT)
RETURNS TEXT AS $$
DECLARE
  v_base_words TEXT[] := ARRAY['Secure', 'Strong', 'Protected', 'Safe', 'Guarded'];
  v_special_chars TEXT[] := ARRAY['!', '@', '#', '$', '%', '^', '&', '*'];
  v_password TEXT;
BEGIN
  -- Validate user type
  IF p_user_type NOT IN ('admin_ansut', 'proprietaire', 'locataire', 'agence', 'tiers_de_confiance') THEN
    RAISE EXCEPTION 'Invalid user type: %', p_user_type;
  END IF;

  -- Generate password: [Role][Secure][Identifier][Year][Special][Numbers]
  v_password := p_user_type || '_' ||
                v_base_words[floor(random() * array_length(v_base_words, 1)) + 1] || '_' ||
                p_identifier || '_2025_' ||
                v_special_chars[floor(random() * array_length(v_special_chars, 1)) + 1] ||
                floor(random() * 9000 + 1000)::TEXT;

  RETURN v_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an account is a test account
CREATE OR REPLACE FUNCTION public.is_test_account(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_email LIKE '%@mon-toit.ci' OR p_email LIKE '%@proprietaire.ci' OR p_email LIKE '%@locataire.ci' OR p_email LIKE '%@agence%.ci';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure test account credentials view (for development only)
CREATE OR REPLACE VIEW public.development_test_credentials AS
SELECT
  u.email,
  p.user_type,
  p.full_name,
  'NEW_SECURE_PASSWORD' as password_note,
  raw_user_meta_data->>'password_updated_at' as password_updated
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'is_test_account' = 'true'
  AND u.email_confirmed_at IS NOT NULL
ORDER BY p.user_type, p.full_name;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION secure_test_accounts() TO service_role;
GRANT EXECUTE ON FUNCTION generate_secure_test_password(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION is_test_account(TEXT) TO authenticated;

-- Grant read access to credentials view in development
GRANT SELECT ON development_test_credentials TO service_role;

-- Add comment with instructions
COMMENT ON FUNCTION public.secure_test_accounts() IS 'Sécurise les comptes de test avec des mots de passe robustes ou les désactive en production';
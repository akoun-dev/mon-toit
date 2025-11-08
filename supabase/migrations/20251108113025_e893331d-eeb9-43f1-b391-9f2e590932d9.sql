-- ====================================================================
-- SEED FINAL : Création de 10 baux de test avec statuts valides
-- ====================================================================

DO $$
DECLARE
  lease_count INTEGER;
  v_property_ids UUID[];
  v_landlord_ids UUID[];
  v_tenant_ids UUID[];
  v_admin_id UUID;
BEGIN
  SELECT COUNT(*) INTO lease_count FROM public.leases;
  
  IF lease_count < 5 THEN
    RAISE NOTICE '🔄 Création de 10 baux de test...';
    
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@ansut.ci' LIMIT 1;
    SELECT ARRAY_AGG(id) INTO v_property_ids FROM (SELECT id FROM public.properties ORDER BY created_at LIMIT 4) sub;
    SELECT ARRAY_AGG(id) INTO v_landlord_ids FROM (SELECT id FROM auth.users WHERE email IN ('contact@immobilier-ci.com', 'contact@abidjan-prestige.com') LIMIT 2) sub;
    SELECT ARRAY_AGG(id) INTO v_tenant_ids FROM (SELECT id FROM auth.users WHERE email NOT IN ('contact@immobilier-ci.com', 'contact@abidjan-prestige.com', 'admin@ansut.ci', 'moderateur@ansut.ci') ORDER BY created_at LIMIT 10) sub;
    
    -- ✅ BAIL 1 : Actif + Certifié
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, certification_requested_at, verified_at, verified_by, certification_notes,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[1], v_landlord_ids[1], v_tenant_ids[1], 'residential', 150000, 300000, 15000,
      CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 'active', 'certified',
      CURRENT_DATE - INTERVAL '6 months' + INTERVAL '1 day', CURRENT_DATE - INTERVAL '6 months' + INTERVAL '2 days', v_admin_id,
      'Bail vérifié et certifié. Tous les documents conformes.',
      CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '6 months', true, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE);

    -- ✅ BAIL 2 : Actif + Certifié  
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, certification_requested_at, verified_at, verified_by, certification_notes,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[2], v_landlord_ids[1], v_tenant_ids[2], 'residential', 120000, 240000, 12000,
      CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months', 'active', 'certified',
      CURRENT_DATE - INTERVAL '4 months' + INTERVAL '1 day', CURRENT_DATE - INTERVAL '4 months' + INTERVAL '3 days', v_admin_id,
      'Certification approuvée après vérification des pièces d''identité et justificatifs.',
      CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE - INTERVAL '4 months', true, CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE);

    -- ✅ BAIL 3 : Actif + Certifié
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, certification_requested_at, verified_at, verified_by, certification_notes,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[3], v_landlord_ids[2], v_tenant_ids[3], 'residential', 75000, 150000, 7500,
      CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 'active', 'certified',
      CURRENT_DATE - INTERVAL '2 months' + INTERVAL '1 day', CURRENT_DATE - INTERVAL '2 months' + INTERVAL '2 days', v_admin_id,
      'Bail résidentiel certifié. Locataire étudiant avec garants vérifiés.',
      CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '2 months', true, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE);

    -- ⏳ BAIL 4 : Draft + Certification PENDING (à examiner)
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, certification_requested_at,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[4], v_landlord_ids[1], v_tenant_ids[4], 'residential', 95000, 190000, 9500,
      CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 'draft', 'pending', CURRENT_DATE - INTERVAL '1 day',
      CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', true, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE);

    -- ⏳ BAIL 5 : Draft + Certification PENDING (demande il y a 3 jours)
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, certification_requested_at,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[1], v_landlord_ids[2], v_tenant_ids[5], 'commercial', 200000, 600000, 20000,
      CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 year 1 week', 'draft', 'pending',
      CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '4 days', true, CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE);

    -- ⏳ BAIL 6 : Draft + Certification PENDING (demande il y a 5 jours)
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, certification_requested_at,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[2], v_landlord_ids[1], v_tenant_ids[6], 'residential', 85000, 170000, 8500,
      CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '1 year 2 weeks', 'draft', 'pending',
      CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '6 days', true, CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE);

    -- 📝 BAIL 7 : Draft + Pas encore demandé (signature propriétaire uniquement)
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status,
      landlord_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[3], v_landlord_ids[1], v_tenant_ids[7], 'residential', 110000, 220000, 11000,
      CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '13 months', 'draft', 'not_requested',
      CURRENT_DATE - INTERVAL '1 day', false, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE);

    -- 📝 BAIL 8 : Draft + Pas encore demandé (aucune signature)
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[4], v_landlord_ids[2], v_tenant_ids[8], 'residential', 65000, 130000, 6500,
      CURRENT_DATE + INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '1 year 3 weeks', 'draft', 'not_requested',
      false, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE);

    -- ❌ BAIL 9 : Draft + Certification REJETÉE
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status,
      certification_requested_at, verified_at, verified_by, certification_notes,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[1], v_landlord_ids[1], v_tenant_ids[9], 'residential', 90000, 180000, 9000,
      CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '51 weeks', 'draft', 'rejected',
      CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '8 days', v_admin_id,
      'Certification refusée : documents d''identité non conformes. Veuillez fournir des documents valides et réessayer.',
      CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE - INTERVAL '11 days', true, CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE);

    -- 🔚 BAIL 10 : EXPIRED + Certifié
    INSERT INTO public.leases (property_id, landlord_id, tenant_id, lease_type, monthly_rent, deposit_amount, charges_amount,
      start_date, end_date, status, certification_status,
      certification_requested_at, verified_at, verified_by, certification_notes,
      landlord_signed_at, tenant_signed_at, is_electronically_signed, created_at, updated_at)
    VALUES (v_property_ids[2], v_landlord_ids[2], v_tenant_ids[10], 'residential', 100000, 200000, 10000,
      CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE - INTERVAL '2 months', 'expired', 'certified',
      CURRENT_DATE - INTERVAL '14 months' + INTERVAL '1 day', CURRENT_DATE - INTERVAL '14 months' + INTERVAL '2 days',
      v_admin_id, 'Bail certifié. Contrat de 12 mois expiré normalement.',
      CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE - INTERVAL '14 months', true, CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE);

    RAISE NOTICE '✅ 10 baux de test créés avec succès!';
    RAISE NOTICE '  → 3 baux actifs certifiés';
    RAISE NOTICE '  → 3 baux en attente de certification (pending)';
    RAISE NOTICE '  → 2 baux en brouillon (draft)';
    RAISE NOTICE '  → 1 bail rejeté (rejected)';
    RAISE NOTICE '  → 1 bail expiré (expired)';
  ELSE
    RAISE NOTICE 'ℹ️ Des baux existent déjà (%). Seed ignoré.', lease_count;
  END IF;
END $$;
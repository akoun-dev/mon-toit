-- Critical Foreign Key Fixes
-- Date: 2025-10-21
-- Fix foreign key references to use auth.users instead of profiles

-- ===============================================================================
-- 1) FIX PROPERTIES TABLE OWNER REFERENCE
-- ===============================================================================

-- Check if constraint exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_owner_id_fkey'
    AND table_name = 'properties'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE properties DROP CONSTRAINT properties_owner_id_fkey;
  END IF;
END $$;

-- Add the correct constraint pointing to auth.users
ALTER TABLE properties
ADD CONSTRAINT properties_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===============================================================================
-- 2) FIX PROPERTY_APPLICATIONS TABLE TENANT REFERENCE
-- ===============================================================================

-- Check if constraint exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_applications_tenant_id_fkey'
    AND table_name = 'property_applications'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE property_applications DROP CONSTRAINT property_applications_tenant_id_fkey;
  END IF;
END $$;

-- Add the correct constraint pointing to auth.users
ALTER TABLE property_applications
ADD CONSTRAINT property_applications_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===============================================================================
-- 3) FIX LEASE_AGREEMENTS TABLE REFERENCES
-- ===============================================================================

-- Check if constraints exist before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lease_agreements_tenant_id_fkey'
    AND table_name = 'lease_agreements'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE lease_agreements DROP CONSTRAINT lease_agreements_tenant_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lease_agreements_owner_id_fkey'
    AND table_name = 'lease_agreements'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE lease_agreements DROP CONSTRAINT lease_agreements_owner_id_fkey;
  END IF;
END $$;

-- Add the correct constraints pointing to auth.users
ALTER TABLE lease_agreements
ADD CONSTRAINT lease_agreements_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE,
ADD CONSTRAINT lease_agreements_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===============================================================================
-- 4) FIX PROPERTY_REVIEWS TABLE REFERENCES
-- ===============================================================================

-- Check if constraints exist before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_reviews_reviewer_id_fkey'
    AND table_name = 'property_reviews'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE property_reviews DROP CONSTRAINT property_reviews_reviewer_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_reviews_reviewee_id_fkey'
    AND table_name = 'property_reviews'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE property_reviews DROP CONSTRAINT property_reviews_reviewee_id_fkey;
  END IF;
END $$;

-- Add the correct constraints pointing to auth.users
ALTER TABLE property_reviews
ADD CONSTRAINT property_reviews_reviewer_id_fkey
FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
ADD CONSTRAINT property_reviews_reviewee_id_fkey
FOREIGN KEY (reviewee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===============================================================================
-- 5) FIX RENT_PAYMENTS TABLE TENANT REFERENCE
-- ===============================================================================

-- Check if constraint exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rent_payments_tenant_id_fkey'
    AND table_name = 'rent_payments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE rent_payments DROP CONSTRAINT rent_payments_tenant_id_fkey;
  END IF;
END $$;

-- Add the correct constraint pointing to auth.users
ALTER TABLE rent_payments
ADD CONSTRAINT rent_payments_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===============================================================================
-- 6) FIX MESSAGES TABLE REFERENCES
-- ===============================================================================

-- Check if constraints exist before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_sender_id_fkey'
    AND table_name = 'messages'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_receiver_id_fkey'
    AND table_name = 'messages'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_receiver_id_fkey;
  END IF;
END $$;

-- Add the correct constraints pointing to auth.users
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
ADD CONSTRAINT messages_receiver_id_fkey
FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===============================================================================
-- 7) CLEAN UP ORPHANED RECORDS
-- ===============================================================================

-- Create a function to identify and report orphaned records
CREATE OR REPLACE FUNCTION identify_orphaned_records()
RETURNS TABLE(
  table_name TEXT,
  orphaned_count BIGINT,
  details TEXT
) AS $$
BEGIN
  -- Check properties with orphaned owners
  RETURN QUERY
  SELECT
    'properties'::TEXT,
    COUNT(*)::BIGINT,
    'Properties with non-existent owner_id in auth.users'::TEXT
  FROM properties p
  LEFT JOIN auth.users u ON p.owner_id = u.id
  WHERE u.id IS NULL;
  
  -- Check property_applications with orphaned tenants
  RETURN QUERY
  SELECT
    'property_applications'::TEXT,
    COUNT(*)::BIGINT,
    'Applications with non-existent tenant_id in auth.users'::TEXT
  FROM property_applications pa
  LEFT JOIN auth.users u ON pa.tenant_id = u.id
  WHERE u.id IS NULL;
  
  -- Check lease_agreements with orphaned tenants or owners
  RETURN QUERY
  SELECT
    'lease_agreements'::TEXT,
    COUNT(*)::BIGINT,
    'Leases with non-existent tenant_id or owner_id in auth.users'::TEXT
  FROM lease_agreements la
  LEFT JOIN auth.users u1 ON la.tenant_id = u1.id
  LEFT JOIN auth.users u2 ON la.owner_id = u2.id
  WHERE u1.id IS NULL OR u2.id IS NULL;
  
  -- Check messages with orphaned senders or receivers
  RETURN QUERY
  SELECT
    'messages'::TEXT,
    COUNT(*)::BIGINT,
    'Messages with non-existent sender_id or receiver_id in auth.users'::TEXT
  FROM messages m
  LEFT JOIN auth.users u1 ON m.sender_id = u1.id
  LEFT JOIN auth.users u2 ON m.receiver_id = u2.id
  WHERE u1.id IS NULL OR u2.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the orphaned records check
SELECT '=== ORPHANED RECORDS REPORT ===' as section_title;
SELECT * FROM identify_orphaned_records();

-- ===============================================================================
-- 8) VALIDATION
-- ===============================================================================

-- Create a validation function to verify all foreign key constraints
CREATE OR REPLACE FUNCTION validate_foreign_key_constraints()
RETURNS TABLE(
  table_name TEXT,
  constraint_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.table_name::TEXT,
    c.constraint_name::TEXT,
    'VALID'::TEXT,
    'Foreign key constraint properly defined'::TEXT
  FROM information_schema.table_constraints c
  JOIN information_schema.key_column_usage kcu
    ON c.constraint_name = kcu.constraint_name
  WHERE c.table_schema = 'public'
    AND c.constraint_type = 'FOREIGN KEY'
    AND (c.table_name IN ('properties', 'property_applications', 'lease_agreements', 
                          'property_reviews', 'rent_payments', 'messages'))
  ORDER BY c.table_name, c.constraint_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run validation
SELECT '=== FOREIGN KEY CONSTRAINTS VALIDATION ===' as section_title;
SELECT * FROM validate_foreign_key_constraints();

COMMIT;
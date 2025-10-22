-- Comprehensive Schema Optimization (Simplified Version)
-- Date: 2025-10-21
-- Only essential fixes that work with current schema

-- ===============================================================================
-- 1) CRITICAL FIXES: User Reference Inconsistencies (Working parts only)
-- ===============================================================================

-- Fix properties table: Change owner_id reference from profiles to auth.users
DO $$
BEGIN
  -- Check if constraint exists before dropping
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_owner_id_fkey'
    AND table_name = 'properties'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE properties DROP CONSTRAINT properties_owner_id_fkey;
  END IF;

  ALTER TABLE properties
  ADD CONSTRAINT properties_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Fix rental_applications: Change applicant_id reference from profiles to auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rental_applications_applicant_id_fkey'
    AND table_name = 'rental_applications'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE rental_applications DROP CONSTRAINT rental_applications_applicant_id_fkey;
  END IF;

  ALTER TABLE rental_applications
  ADD CONSTRAINT rental_applications_applicant_id_fkey
  FOREIGN KEY (applicant_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Fix leases: Update tenant_id and landlord_id references to auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leases_tenant_id_fkey'
    AND table_name = 'leases'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE leases DROP CONSTRAINT leases_tenant_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leases_landlord_id_fkey'
    AND table_name = 'leases'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE leases DROP CONSTRAINT leases_landlord_id_fkey;
  END IF;

  ALTER TABLE leases
  ADD CONSTRAINT leases_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT leases_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- ===============================================================================
-- 2) CRITICAL PERFORMANCE INDEXES (Only working ones)
-- ===============================================================================

-- Index for properties owner lookups
CREATE INDEX IF NOT EXISTS idx_properties_owner_id
ON properties(owner_id);

-- NOTE: Other indexes removed due to missing tables/columns in current schema
-- This migration file should be updated when the schema matches the expected tables

-- Migration completed successfully with schema reference fixes
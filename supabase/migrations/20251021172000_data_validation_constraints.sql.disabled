-- Data Validation Constraints
-- Date: 2025-10-21
-- Add comprehensive check constraints for data integrity

-- ===============================================================================
-- 1) PROPERTIES TABLE CONSTRAINTS
-- ===============================================================================

-- Remove existing constraints if they exist
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_monthly_rent_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_area_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_bedrooms_check;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_bathrooms_check;

-- Add comprehensive property constraints
ALTER TABLE properties
ADD CONSTRAINT properties_monthly_rent_check
CHECK (monthly_rent BETWEEN 5000 AND 5000000), -- 5K to 5M FCFA realistic range for Ivory Coast
ADD CONSTRAINT properties_area_check
CHECK (surface_area BETWEEN 10 AND 1000), -- Reasonable property sizes
ADD CONSTRAINT properties_bedrooms_check
CHECK (bedrooms BETWEEN 0 AND 20), -- Max 20 bedrooms for exceptional properties
ADD CONSTRAINT properties_bathrooms_check
CHECK (bathrooms BETWEEN 0 AND 15); -- Max 15 bathrooms

-- Additional property constraints
ALTER TABLE properties
ADD CONSTRAINT properties_deposit_check
CHECK (deposit_amount IS NULL OR deposit_amount BETWEEN 0 AND monthly_rent * 3), -- Max 3 months rent
ADD CONSTRAINT properties_charges_check
CHECK (charges_amount IS NULL OR charges_amount BETWEEN 0 AND monthly_rent * 0.5), -- Max 50% of rent
ADD CONSTRAINT properties_floor_check
CHECK (floor_number IS NULL OR floor_number BETWEEN 0 AND 50), -- Max 50 floors
ADD CONSTRAINT properties_status_check
CHECK (status IN ('disponible', 'loué', 'en_attente', 'retiré', 'en_maintenance', 'en_negociation')),
ADD CONSTRAINT properties_type_check
CHECK (property_type IN ('appartement', 'villa', 'studio', 'duplex', 'bureau', 'local_commercial'));

-- ===============================================================================
-- 2) PROFILES TABLE CONSTRAINTS
-- ===============================================================================

-- Remove existing constraints if they exist
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_format;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_name_required;

-- Add phone number format validation for Ivory Coast
ALTER TABLE profiles
ADD CONSTRAINT profiles_phone_format
CHECK (
  phone IS NULL OR
  phone ~ '^\+225[0-9]{8,10}$' OR -- Ivory Coast format with country code
  phone ~ '^[0-9]{8,10}$' -- Local format without country code
);

-- Ensure at least one name field is populated
ALTER TABLE profiles
ADD CONSTRAINT profiles_name_required
CHECK (full_name IS NOT NULL AND length(trim(full_name)) > 0);

-- Additional profile constraints
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_type_check
CHECK (user_type IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'admin', 'super_admin', 'tiers_de_confiance')),
ADD CONSTRAINT profiles_bio_length_check
CHECK (bio IS NULL OR length(bio) <= 1000); -- Max 1000 characters for bio

-- ===============================================================================
-- 3) LEASE AGREEMENTS TABLE CONSTRAINTS
-- ===============================================================================

-- Remove existing constraints if they exist
ALTER TABLE lease_agreements DROP CONSTRAINT IF EXISTS lease_agreements_dates_check;

-- Add lease agreement date validation
ALTER TABLE lease_agreements
ADD CONSTRAINT lease_agreements_dates_check
CHECK (end_date > start_date),
ADD CONSTRAINT lease_agreements_start_date_check
CHECK (start_date >= CURRENT_DATE - INTERVAL '1 year'), -- Can't start more than 1 year ago
ADD CONSTRAINT lease_agreements_duration_check
CHECK (end_date - start_date BETWEEN INTERVAL '1 month' AND INTERVAL '10 years'), -- 1 month to 10 years
ADD CONSTRAINT lease_agreements_status_check
CHECK (status IN ('draft', 'active', 'terminated', 'expired', 'pending'));

-- ===============================================================================
-- 4) RENT PAYMENTS TABLE CONSTRAINTS
-- ===============================================================================

-- Remove existing constraints if they exist
ALTER TABLE rent_payments DROP CONSTRAINT IF EXISTS rent_payments_amount_check;

-- Add payment constraints
ALTER TABLE rent_payments
ADD CONSTRAINT rent_payments_amount_check
CHECK (amount > 0 AND amount <= 10000000), -- Max 10M FCFA monthly rent
ADD CONSTRAINT rent_payments_due_date_check
CHECK (due_date >= CURRENT_DATE - INTERVAL '6 months'), -- Can't be more than 6 months overdue
ADD CONSTRAINT rent_payments_status_check
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded'));

-- ===============================================================================
-- 5) PROPERTY APPLICATIONS TABLE CONSTRAINTS
-- ===============================================================================

-- Add application constraints
ALTER TABLE property_applications
ADD CONSTRAINT property_applications_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'accepted')),
ADD CONSTRAINT property_applications_income_check
CHECK (monthly_income IS NULL OR monthly_income > 0),
ADD CONSTRAINT property_applications_income_ratio_check
CHECK (
  monthly_income IS NULL OR 
  proposed_rent IS NULL OR 
  (monthly_income * 0.4) >= proposed_rent -- Rent shouldn't exceed 40% of income
);

-- ===============================================================================
-- 6) MESSAGES TABLE CONSTRAINTS
-- ===============================================================================

-- Add message constraints
ALTER TABLE messages
ADD CONSTRAINT messages_content_check
CHECK (content IS NOT NULL AND length(trim(content)) > 0),
ADD CONSTRAINT messages_content_length_check
CHECK (length(content) <= 5000); -- Max 5000 characters per message

-- ===============================================================================
-- 7) PROPERTY REVIEWS TABLE CONSTRAINTS
-- ===============================================================================

-- Add review constraints
ALTER TABLE property_reviews
ADD CONSTRAINT property_reviews_rating_check
CHECK (rating BETWEEN 1 AND 5),
ADD CONSTRAINT property_reviews_comment_length_check
CHECK (comment IS NULL OR length(comment) <= 2000); -- Max 2000 characters for review

-- ===============================================================================
-- 8) AGENCY MANDATES TABLE CONSTRAINTS
-- ===============================================================================

-- Add mandate constraints
ALTER TABLE agency_mandates
ADD CONSTRAINT agency_mandates_dates_check
CHECK (end_date > start_date),
ADD CONSTRAINT agency_mandates_duration_check
CHECK (end_date - start_date BETWEEN INTERVAL '1 month' AND INTERVAL '5 years'), -- 1 month to 5 years
ADD CONSTRAINT agency_mandates_commission_check
CHECK (commission_rate BETWEEN 0 AND 20), -- Max 20% commission
ADD CONSTRAINT agency_mandates_status_check
CHECK (status IN ('pending', 'active', 'expired', 'cancelled'));

-- ===============================================================================
-- 9) PROPERTY VISIT SLOTS TABLE CONSTRAINTS
-- ===============================================================================

-- Add visit slot constraints
ALTER TABLE property_visit_slots
ADD CONSTRAINT property_visit_slots_time_check
CHECK (end_time > start_time),
ADD CONSTRAINT property_visit_slots_duration_check
CHECK (end_time - start_time BETWEEN INTERVAL '15 minutes' AND INTERVAL '4 hours'), -- 15 min to 4 hours
ADD CONSTRAINT property_visit_slots_future_check
CHECK (start_time > CURRENT_TIMESTAMP), -- Can't create slots in the past
ADD CONSTRAINT property_visit_slots_max_visitors_check
CHECK (max_visitors BETWEEN 1 AND 20), -- Max 20 visitors per slot
ADD CONSTRAINT property_visit_slots_fee_check
CHECK (visit_fee_amount BETWEEN 0 AND 10000), -- Max 10,000 FCFA visit fee (ANSUT regulation)
ADD CONSTRAINT property_visit_slots_status_check
CHECK (status IN ('available', 'booked', 'completed', 'cancelled'));

-- ===============================================================================
-- 10) PROPERTY VISIT BOOKINGS TABLE CONSTRAINTS
-- ===============================================================================

-- Add visit booking constraints
ALTER TABLE property_visit_bookings
ADD CONSTRAINT property_visit_bookings_visitors_check
CHECK (number_of_visitors BETWEEN 1 AND 20), -- Max 20 visitors
ADD CONSTRAINT property_visit_bookings_payment_check
CHECK (payment_amount >= 0),
ADD CONSTRAINT property_visit_bookings_status_check
CHECK (visit_status IN ('scheduled', 'in_progress', 'completed', 'no_show', 'cancelled')),
ADD CONSTRAINT property_visit_bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- ===============================================================================
-- 11) VALIDATION FUNCTIONS
-- ===============================================================================

-- Function to validate all constraints
CREATE OR REPLACE FUNCTION validate_data_constraints()
RETURNS TABLE(
  table_name TEXT,
  constraint_name TEXT,
  validation_status TEXT,
  invalid_count BIGINT,
  details TEXT
) AS $$
BEGIN
  -- Validate properties constraints
  RETURN QUERY
  SELECT
    'properties'::TEXT,
    'monthly_rent_range'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'VALID' ELSE 'INVALID' END::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) || ' properties with rent outside 5K-5M FCFA range'::TEXT
  FROM properties
  WHERE monthly_rent < 5000 OR monthly_rent > 5000000
  
  UNION ALL
  
  SELECT
    'properties'::TEXT,
    'surface_area_range'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'VALID' ELSE 'INVALID' END::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) || ' properties with area outside 10-1000m² range'::TEXT
  FROM properties
  WHERE surface_area < 10 OR surface_area > 1000
  
  UNION ALL
  
  SELECT
    'properties'::TEXT,
    'bedrooms_range'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'VALID' ELSE 'INVALID' END::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) || ' properties with bedrooms outside 0-20 range'::TEXT
  FROM properties
  WHERE bedrooms < 0 OR bedrooms > 20
  
  UNION ALL
  
  SELECT
    'profiles'::TEXT,
    'phone_format'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'VALID' ELSE 'INVALID' END::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) || ' profiles with invalid phone format'::TEXT
  FROM profiles
  WHERE phone IS NOT NULL AND 
        phone !~ '^\+225[0-9]{8,10}$' AND 
        phone !~ '^[0-9]{8,10}$'
  
  UNION ALL
  
  SELECT
    'lease_agreements'::TEXT,
    'date_validation'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'VALID' ELSE 'INVALID' END::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) || ' lease agreements with invalid date ranges'::TEXT
  FROM lease_agreements
  WHERE end_date <= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix common data issues
CREATE OR REPLACE FUNCTION fix_common_data_issues()
RETURNS TABLE(
  fix_type TEXT,
  records_fixed BIGINT,
  details TEXT
) AS $$
DECLARE
  v_fix_count BIGINT;
BEGIN
  -- Fix negative rents
  UPDATE properties 
  SET monthly_rent = 50000 -- Set to default minimum rent
  WHERE monthly_rent < 0;
  GET DIAGNOSTICS v_fix_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT
    'negative_rents'::TEXT,
    v_fix_count::BIGINT,
    'Set negative rents to 50,000 FCFA minimum'::TEXT;
  
  -- Fix invalid surface areas
  UPDATE properties 
  SET surface_area = 50 -- Set to default minimum area
  WHERE surface_area < 10 OR surface_area > 1000;
  GET DIAGNOSTICS v_fix_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT
    'invalid_areas'::TEXT,
    v_fix_count::BIGINT,
    'Set invalid areas to 50m² default'::TEXT;
  
  -- Fix invalid bedroom counts
  UPDATE properties 
  SET bedrooms = 1 -- Set to default minimum
  WHERE bedrooms < 0 OR bedrooms > 20;
  GET DIAGNOSTICS v_fix_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT
    'invalid_bedrooms'::TEXT,
    v_fix_count::BIGINT,
    'Set invalid bedroom counts to 1 default'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- 12) VALIDATION AND FIXES
-- ===============================================================================

-- Run constraint validation
SELECT '=== DATA CONSTRAINTS VALIDATION ===' as section_title;
SELECT * FROM validate_data_constraints();

-- Run data fixes (commented out by default for safety)
-- Uncomment the line below to automatically fix common issues:
-- SELECT * FROM fix_common_data_issues();

-- Create a trigger to validate data on insert/update
CREATE OR REPLACE FUNCTION validate_property_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate monthly rent
  IF NEW.monthly_rent < 5000 OR NEW.monthly_rent > 5000000 THEN
    RAISE EXCEPTION 'Monthly rent must be between 5,000 and 5,000,000 FCFA';
  END IF;
  
  -- Validate surface area
  IF NEW.surface_area < 10 OR NEW.surface_area > 1000 THEN
    RAISE EXCEPTION 'Surface area must be between 10 and 1,000 square meters';
  END IF;
  
  -- Validate bedrooms
  IF NEW.bedrooms < 0 OR NEW.bedrooms > 20 THEN
    RAISE EXCEPTION 'Number of bedrooms must be between 0 and 20';
  END IF;
  
  -- Validate bathrooms
  IF NEW.bathrooms < 0 OR NEW.bathrooms > 15 THEN
    RAISE EXCEPTION 'Number of bathrooms must be between 0 and 15';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property validation
DROP TRIGGER IF EXISTS trigger_validate_property_data ON properties;
CREATE TRIGGER trigger_validate_property_data
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION validate_property_data();

COMMIT;
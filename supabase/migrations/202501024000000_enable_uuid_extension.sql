-- Migration: Enable UUID extension
-- Description: Enable the uuid-ossp extension to provide UUID generation functions
-- This migration must run first before any table creation that uses UUID functions

-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add comment for documentation
COMMENT ON EXTENSION "uuid-ossp" IS 'Extension UUID generation functions for PostgreSQL';
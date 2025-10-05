-- Database initialization script for PostgreSQL
-- This script runs automatically when the PostgreSQL container starts

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to check if tables exist
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_exists.table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Basketball Performance Database initialization started...';
END $$;

-- Migration: Drop planned_production table
-- This removes the planned production module from the database

DROP TABLE IF EXISTS planned_production CASCADE;

-- Note: CASCADE will automatically drop:
-- - All indexes on the table
-- - All foreign key constraints referencing this table
-- - Any dependent views or functions


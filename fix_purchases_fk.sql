-- Allow purchases of items that might not strictly exist in the templates table (e.g. Mock Data)
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_template_id_fkey;

-- Ensure template_id matches the type used in templates (usually BIGINT or UUID depending on setup, Mock uses Number)
-- This is just a safety measure, usually not needed if table created correctly.
-- We keep template_id column but handle it loosely.

-- Fix: Set file size limit to NULL (Unlimited) to bypass specific size checks
-- This relies on the global project limit (usually 5GB or tiered)

UPDATE storage.buckets
SET file_size_limit = NULL
WHERE id = 'assets';

-- Verify
SELECT id, name, file_size_limit FROM storage.buckets WHERE id = 'assets';

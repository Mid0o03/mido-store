-- Migration: Increase Upload Limit for Assets Bucket
-- Set limit to 500MB (524288000 bytes)

UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'assets';

-- Verify the change
SELECT id, name, file_size_limit
FROM storage.buckets
WHERE id = 'assets';

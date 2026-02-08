-- Fix: Set file size limit to 1GB explicitly (1073741824 bytes)
UPDATE storage.buckets
SET file_size_limit = 1073741824
WHERE id = 'assets';

-- Verify
SELECT id, name, file_size_limit FROM storage.buckets WHERE id = 'assets';

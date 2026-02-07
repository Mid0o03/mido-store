-- Check ALL buckets to see if there's a mismatch or another bucket involved
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

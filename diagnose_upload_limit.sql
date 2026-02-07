-- Diagnose: Check current upload limit for 'assets' bucket

SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'assets';

-- If this returns a value around 52428800 (50MB), then the update was NOT successful.
-- If it returns NULL, it usually means 'Unlimited' or Global Project default.
-- If it returns 524288000 (500MB), then the update WAS successful, and the error might be elsewhere.

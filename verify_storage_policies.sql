-- ============================================
-- VERIFY: Storage Policies
-- ============================================
-- This script verifies that storage policies are correctly configured
-- for the 'assets' bucket to allow client downloads.
--
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. List all policies on storage.objects for 'assets' bucket
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%assets%';

-- 2. Check if 'assets' bucket exists and is private
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'assets';

-- Expected Result:
-- - Bucket should exist
-- - public should be FALSE (private bucket)
-- - Should have policies allowing:
--   * Admins to INSERT/UPDATE/DELETE
--   * Authenticated users to SELECT

-- 3. Test if current user can generate signed URLs
-- (This would need to be run from the application, not SQL Editor)
-- But we can check if the function exists:
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'storage' 
  AND routine_name LIKE '%sign%';

-- ============================================
-- DIAGNOSTIC: Download Functionality
-- ============================================
-- This script checks the state of templates and downloads
-- to identify why client downloads may be failing.
--
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check which templates have file_url populated
SELECT 
    id,
    title,
    price,
    file_url,
    CASE 
        WHEN file_url IS NULL THEN '❌ No File'
        WHEN file_url = '' THEN '❌ Empty'
        ELSE '✅ Has File'
    END as file_status
FROM templates
ORDER BY id DESC;

-- 2. Check purchases that reference templates without files
SELECT 
    p.id as purchase_id,
    p.template_title,
    p.user_id,
    p.created_at,
    t.file_url,
    CASE 
        WHEN t.file_url IS NULL OR t.file_url = '' THEN '⚠️ Client cannot download'
        ELSE '✅ Download available'
    END as download_status
FROM purchases p
LEFT JOIN templates t ON p.template_id = t.id
ORDER BY p.created_at DESC;

-- 3. Check storage bucket configuration
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id = 'assets';

-- 4. Count templates by file availability
SELECT 
    CASE 
        WHEN file_url IS NULL OR file_url = '' THEN 'No File'
        ELSE 'Has File'
    END as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM templates), 1) as percentage
FROM templates
GROUP BY status;

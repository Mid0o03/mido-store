-- ============================================
-- RESET ANALYTICS DATA
-- ============================================
-- This script clears all purchase records from the database
-- to reset the admin dashboard analytics for real sales tracking.
--
-- WARNING: This operation is IRREVERSIBLE.
-- Make sure you have backed up any important data before running.
--
-- Usage:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Paste this script
-- 3. Click "Run" to execute
-- ============================================

-- Delete all purchase records
DELETE FROM purchases;

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining_purchases FROM purchases;

-- Optional: Check that analytics are reset
-- (Run this in a separate query after deletion)
-- SELECT get_admin_stats();

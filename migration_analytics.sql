-- Analytics Setup

-- 1. Add 'views' column
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Create RPC function for atomic increment
-- This prevents race conditions if multiple people view at once
CREATE OR REPLACE FUNCTION increment_views(row_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE templates
  SET views = views + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Safety update for existing rows
UPDATE templates SET views = 0 WHERE views IS NULL;

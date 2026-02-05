-- Add new columns for Product Management

-- 1. Add 'is_featured' column
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Add 'status' column
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- 3. Update existing rows to have default values (safety check)
UPDATE templates SET status = 'published' WHERE status IS NULL;
UPDATE templates SET is_featured = false WHERE is_featured IS NULL;

-- 4. Policy Check (The previous policy "Enable update..." should cover updates)
-- If you didn't run the previous generic update policy, run this:
CREATE POLICY "Enable update for authenticated users only" 
ON templates FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

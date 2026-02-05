-- Create Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    template_id BIGINT REFERENCES templates(id),
    
    -- Snapshot data (in case original template changes/deleted)
    template_title TEXT,
    template_image TEXT,
    template_version TEXT DEFAULT 'v1.0.0',
    price_paid NUMERIC,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own purchases
CREATE POLICY "Users can view their own purchases" 
ON purchases FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own purchases (triggered by frontend after payment)
CREATE POLICY "Users can insert their own purchases" 
ON purchases FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Optional: Admin view all (if needed later)
-- CREATE POLICY "Admins can view all" ON purchases ...

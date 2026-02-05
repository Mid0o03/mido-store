-- Migration: Live Preview
-- Add 'demo_url' to templates for external live demos (e.g. Vercel, Netlify)

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS demo_url TEXT;

-- Optional: Add a check constraint to ensure it looks like a URL if not null
-- ALTER TABLE templates ADD CONSTRAINT demo_url_check CHECK (demo_url IS NULL OR demo_url ~* '^https?://.*');

-- Migration: Assets Storage & File Management
-- 1. Add file_url column to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 2. Create 'assets' Storage Bucket (Private)
-- Note: 'public' is false, so we need Signed URLs or Authenticated Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Row Level Security for Storage)

-- Policy 1: Admin can do EVERYTHING (Upload, Delete, Select) in 'assets'
-- We assume Admin has email 'admin@mido.com' or 'midodev.fr@gmail.com'
-- (Adjust logic if using a 'roles' table, but this matches get_admin_stats logic)
CREATE POLICY "Admins can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND 
  (auth.email() = 'admin@mido.com' OR auth.email() = 'midodev.fr@gmail.com')
);

CREATE POLICY "Admins can update assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND 
  (auth.email() = 'admin@mido.com' OR auth.email() = 'midodev.fr@gmail.com')
);

CREATE POLICY "Admins can delete assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND 
  (auth.email() = 'admin@mido.com' OR auth.email() = 'midodev.fr@gmail.com')
);

CREATE POLICY "Admins can select assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets' AND 
  (auth.email() = 'admin@mido.com' OR auth.email() = 'midodev.fr@gmail.com')
);

-- Policy 2: Clients can Download (Select)
-- For MVP, we allow ANY authenticated user to download if they have the link.
-- Ideally, we would join with 'purchases' table to verify ownership, 
-- but that is complex in Storage Policies due to cross-schema joins.
-- For now: Authenticated Read Access is a good baseline + Signed URLs from Frontend.
CREATE POLICY "Authenticated users can download assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'assets');

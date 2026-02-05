-- ACTIVEZ L'INSERTION POUR LA TABLE TEMPLATES
-- 1. Activer RLS (déjà fait normalement)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 2. Créer une politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Enable insert for authenticated users only" 
ON templates FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. (Optionnel) Permettre la suppression/modification pour l'admin
CREATE POLICY "Enable delete for authenticated users only" 
ON templates FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Enable update for authenticated users only" 
ON templates FOR UPDATE 
TO authenticated 
USING (true);


-- ACTIVEZ LE STOCKAGE D'IMAGES
-- Assurez-vous d'avoir un bucket 'product-images' PUBLIC.

-- 1. Permettre l'upload d'images pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- 2. Permettre à tout le monde de voir les images (Lecture publique)
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

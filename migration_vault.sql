-- ============================================================
-- MIGRATION: CRÉATION DU VAULT CLIENT (DOCUMENTS & Fichiers)
-- ============================================================

-- 1. Table pour garder une trace des URLs des documents
create table if not exists client_documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  client_id uuid references clients(id) on delete cascade not null,
  project_id uuid references freelance_projects(id) on delete set null,
  title text not null,
  type text not null, -- 'quote', 'invoice', 'contract', 'mockup', 'other'
  file_url text not null,
  status text default 'active'
);

alter table client_documents enable row level security;

-- Policies
create policy "Admins manage documents"
  on client_documents for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Clients view their own documents"
  on client_documents for select
  using (
    client_id in (select id from clients where email = auth.jwt()->>'email')
  );

-- 2. Création du Bucket Supabase "vault" 
-- Ce bucket stockera physiquement (Stockage Objet) les PDFs et Maquettes
insert into storage.buckets (id, name, public) 
values ('vault', 'vault', false) 
on conflict do nothing;

-- 3. Sécurité du Bucket
create policy "Admin Vault Full Access"
  on storage.objects for all
  using (bucket_id = 'vault' and auth.role() = 'authenticated');

create policy "Client Vault Select Access"
  on storage.objects for select
  using (bucket_id = 'vault' and auth.role() = 'authenticated');

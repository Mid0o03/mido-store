-- ============================================================
-- MIDO FREELANCE OS - Full Migration V2
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CLIENTS TABLE
-- ============================================================
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  user_id uuid references auth.users(id) on delete set null, -- Link to Supabase Auth (optional)
  name text not null,
  email text not null unique,
  phone text,
  company text,
  address text,
  city text,
  country text default 'France',
  status text default 'active', -- 'active', 'archived', 'prospect'
  notes text,
  avatar_url text,
  portal_password text -- Hashed client portal password (managed separately)
);

alter table clients enable row level security;

create policy "Admins manage clients"
  on clients for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 2. PROJECTS TABLE
-- ============================================================
create table if not exists freelance_projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  client_id uuid references clients(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'discovery', -- 'discovery', 'design', 'development', 'review', 'delivered', 'archived'
  progress integer default 0 check (progress between 0 and 100),
  start_date date,
  deadline date,
  delivery_date date,
  total_amount numeric(10, 2) default 0,
  deposit_paid boolean default false,
  final_paid boolean default false,
  preview_url text, -- URL for the ProjectViewer iframe
  figma_url text,
  github_url text
);

alter table freelance_projects enable row level security;

create policy "Admins manage freelance projects"
  on freelance_projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Clients view their own projects"
  on freelance_projects for select
  using (
    client_id in (
      select id from clients where email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================
-- 3. QUOTES TABLE
-- ============================================================
create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  client_id uuid references clients(id) on delete cascade not null,
  project_id uuid references freelance_projects(id) on delete set null,
  quote_number text unique not null, -- ex: DEVIS-2026-001
  status text default 'draft', -- 'draft', 'sent', 'accepted', 'declined', 'expired'
  line_items jsonb default '[]'::jsonb, -- [{ description, quantity, unit_price, total }]
  subtotal numeric(10, 2) default 0,
  total numeric(10, 2) default 0,
  deposit_amount numeric(10, 2) default 0, -- 30% of total
  deposit_paid boolean default false,
  deposit_stripe_id text,
  valid_until date,
  signed_at timestamp with time zone,
  notes text,
  -- Auto-entrepreneur legal mention (no VAT)
  legal_mention text default 'TVA non applicable, art. 293 B du CGI'
);

alter table quotes enable row level security;

create policy "Admins manage quotes"
  on quotes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Clients view their own quotes"
  on quotes for select
  using (
    client_id in (
      select id from clients where email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================
-- 4. INVOICES TABLE
-- ============================================================
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  client_id uuid references clients(id) on delete cascade not null,
  project_id uuid references freelance_projects(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  invoice_number text unique not null, -- ex: FACT-2026-001
  type text default 'deposit', -- 'deposit', 'final', 'standalone'
  status text default 'pending', -- 'pending', 'sent', 'paid', 'overdue', 'cancelled'
  line_items jsonb default '[]'::jsonb,
  subtotal numeric(10, 2) default 0,
  total numeric(10, 2) default 0,
  amount_paid numeric(10, 2) default 0,
  due_date date,
  paid_at timestamp with time zone,
  stripe_payment_intent_id text,
  pdf_url text,
  legal_mention text default 'TVA non applicable, art. 293 B du CGI'
);

alter table invoices enable row level security;

create policy "Admins manage invoices"
  on invoices for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Clients view their own invoices"
  on invoices for select
  using (
    client_id in (
      select id from clients where email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================
-- 5. MESSAGES TABLE (Real-time Chat)
-- ============================================================
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  project_id uuid references freelance_projects(id) on delete cascade not null,
  sender_type text not null, -- 'admin' or 'client'
  sender_email text not null,
  content text,
  file_url text,
  file_name text,
  file_type text, -- 'image', 'pdf', 'zip', etc.
  read_at timestamp with time zone -- null = unread
);

alter table messages enable row level security;

-- Enable realtime for messages
alter publication supabase_realtime add table messages;

create policy "Admins manage all messages"
  on messages for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Clients manage messages in their projects"
  on messages for all
  using (
    project_id in (
      select id from freelance_projects where client_id in (
        select id from clients where email = auth.jwt() ->> 'email'
      )
    )
  )
  with check (
    project_id in (
      select id from freelance_projects where client_id in (
        select id from clients where email = auth.jwt() ->> 'email'
      )
    )
  );

-- ============================================================
-- 6. PROJECT TASKS / MILESTONES TABLE
-- ============================================================
create table if not exists project_tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  project_id uuid references freelance_projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'pending', -- 'pending', 'in_progress', 'completed'
  order_index integer default 0,
  due_date date,
  completed_at timestamp with time zone
);

alter table project_tasks enable row level security;

create policy "Admins manage project tasks"
  on project_tasks for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Clients view tasks in their projects"
  on project_tasks for select
  using (
    project_id in (
      select id from freelance_projects where client_id in (
        select id from clients where email = auth.jwt() ->> 'email'
      )
    )
  );

-- ============================================================
-- 7. EXPENSES TABLE (Freelance Accounting)
-- ============================================================
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  date date not null default current_date,
  category text not null, -- 'software', 'hardware', 'marketing', 'office', 'transport', 'other'
  description text not null,
  amount numeric(10, 2) not null,
  receipt_url text,
  is_deductible boolean default true
);

alter table expenses enable row level security;

create policy "Only admins manage expenses"
  on expenses for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 8. SEQUENCES for auto-numbering
-- ============================================================
create sequence if not exists quote_number_seq start 1;
create sequence if not exists invoice_number_seq start 1;

-- Helper function to generate Quote numbers
create or replace function generate_quote_number()
returns text language plpgsql as $$
begin
  return 'DEVIS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('quote_number_seq')::text, 3, '0');
end;
$$;

-- Helper function to generate Invoice numbers
create or replace function generate_invoice_number()
returns text language plpgsql as $$
begin
  return 'FACT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 3, '0');
end;
$$;

-- ============================================================
-- 9. ADMIN NOTIFICATIONS VIEW (Helper)
-- ============================================================
create or replace view admin_notifications as
  select
    'message' as type,
    m.created_at,
    m.project_id::text as ref_id,
    m.sender_email,
    'Nouveau message de ' || m.sender_email as summary
  from messages m
  where m.sender_type = 'client'
    and m.read_at is null
  union all
  select
    'quote_signed' as type,
    q.signed_at as created_at,
    q.id::text as ref_id,
    c.email as sender_email,
    'Devis ' || q.quote_number || ' signé par ' || c.name as summary
  from quotes q
  join clients c on q.client_id = c.id
  where q.signed_at is not null
    and q.status = 'accepted'
  order by created_at desc;

-- ============================================================
-- Done! Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PATCH V2.1 — Phase 3/4 additions (run if already migrated V2)
-- ============================================================

-- Add accepted_at to quotes (replaces signed_at for clarity)
alter table quotes add column if not exists accepted_at timestamp with time zone;

-- Add stripe_payment_intent alias column to invoices
alter table invoices add column if not exists stripe_payment_intent text;

-- Allow clients to INSERT invoices for deposit payments (needed for self-service payment)
create policy if not exists "Clients can insert own invoices"
  on invoices for insert
  with check (
    client_id in (
      select id from clients where email = auth.jwt() ->> 'email'
    )
  );

-- Allow clients to UPDATE their own quotes (needed to mark accepted)
create policy if not exists "Clients can accept their own quotes"
  on quotes for update
  using (
    client_id in (
      select id from clients where email = auth.jwt() ->> 'email'
    )
  )
  with check (
    client_id in (
      select id from clients where email = auth.jwt() ->> 'email'
    )
  );

-- Storage bucket for chat files (run once in Supabase Dashboard Storage)
-- insert into storage.buckets (id, name, public) values ('assets', 'assets', true);

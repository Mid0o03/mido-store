alter table quotes 
add column if not exists payment_type text default 'one_off',
add column if not exists monthly_fee numeric default 0,
add column if not exists duration_months integer default 0;

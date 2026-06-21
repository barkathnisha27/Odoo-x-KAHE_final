-- Ensure pgcrypto is enabled
create extension if not exists "pgcrypto";

-- Create cafes table
create table if not exists public.cafes (
  id uuid primary key default gen_random_uuid(),
  cafe_name text not null,
  owner_name text,
  owner_email text,
  phone text,
  address text,
  city text,
  upi_id text,
  logo_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Grant permissions for cafes
grant select, insert, update, delete on public.cafes to authenticated;
grant all on public.cafes to service_role;
alter table public.cafes enable row level security;

create policy "Allow authenticated read cafes" on public.cafes
  for select to authenticated using (true);
create policy "Allow authenticated insert cafes" on public.cafes
  for insert to authenticated with check (true);
create policy "Allow authenticated update cafes" on public.cafes
  for update to authenticated using (true);

-- Create users_profile table
create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references public.cafes(id) on delete cascade,
  name text not null,
  email text unique not null,
  password text,
  role text not null check (role in ('admin','cashier','kitchen','customer')),
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Grant permissions for users_profile
grant select, insert, update, delete on public.users_profile to authenticated;
grant all on public.users_profile to service_role;
alter table public.users_profile enable row level security;

create policy "Allow authenticated read profiles" on public.users_profile
  for select to authenticated using (true);
create policy "Allow authenticated insert profiles" on public.users_profile
  for insert to authenticated with check (true);
create policy "Allow authenticated update profiles" on public.users_profile
  for update to authenticated using (true);

-- Seed one demo cafe if it does not exist
insert into public.cafes (
  id,
  cafe_name,
  owner_name,
  owner_email,
  phone,
  address,
  city,
  upi_id
)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'DineFlow Demo Cafe',
  'Nisha',
  'admin@dineflow.ai',
  '9876543210',
  'Karpagam College Area, Coimbatore',
  'Coimbatore',
  'dineflow@ybl'
where not exists (
  select 1 from public.cafes where owner_email = 'admin@dineflow.ai' or id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Seed Demo Users Linked to Same Cafe
insert into public.users_profile (id, cafe_id, name, email, password, role, phone, is_active)
values
  ('00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Nisha Admin', 'admin@dineflow.ai', 'admin123', 'admin', '9876543210', true),
  ('00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Shareng Cashier', 'cashier@dineflow.ai', 'cashier123', 'cashier', '9876543211', true),
  ('00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Kitchen Team', 'kitchen@dineflow.ai', 'kitchen123', 'kitchen', '9876543212', true),
  ('00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Aisha Customer', 'customer@dineflow.ai', 'customer123', 'customer', '9876543213', true)
on conflict (email) do update set
  cafe_id = excluded.cafe_id,
  role = excluded.role,
  name = excluded.name,
  password = excluded.password,
  is_active = true;

-- Helper macro/DO block to alter tables safely if they exist
do $$
begin
  alter table public.products add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.categories add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.floors add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.tables add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.orders add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.order_items add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.payments add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.customers add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.ingredients add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.recipes add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.coupons add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.promotions add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.pos_sessions add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.bookings add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.prediction_dataset add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.ai_insights add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.map_data add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.simulations add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  alter table public.payment_methods add column if not exists cafe_id uuid references public.cafes(id) on delete cascade;
exception when undefined_table or undefined_column then null;
end $$;

-- Reload schema cache
notify pgrst, 'reload schema';

-- Remove duplicate products by cafe_id + name, keeping the oldest/first
delete from public.products a
using public.products b
where a.ctid > b.ctid
and coalesce(a.cafe_id::text, '') = coalesce(b.cafe_id::text, '')
and lower(trim(a.name)) = lower(trim(b.name));

do $$
begin
  alter table public.products
  add constraint products_cafe_name_unique unique (cafe_id, name);
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_column then null;
end $$;

-- Remove duplicate floors by cafe_id + name, keeping oldest/first
delete from public.floors a
using public.floors b
where a.ctid > b.ctid
and coalesce(a.cafe_id::text, '') = coalesce(b.cafe_id::text, '')
and lower(trim(a.name)) = lower(trim(b.name));

do $$
begin
  alter table public.floors
  add constraint floors_cafe_name_unique unique (cafe_id, name);
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_column then null;
end $$;

-- Remove duplicate tables by cafe_id + floor_id + table_number
delete from public.tables a
using public.tables b
where a.ctid > b.ctid
and coalesce(a.cafe_id::text, '') = coalesce(b.cafe_id::text, '')
and a.floor_id = b.floor_id
and a.table_number = b.table_number;

do $$
begin
  alter table public.tables
  add constraint tables_cafe_floor_number_unique unique (cafe_id, floor_id, table_number);
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_column then null;
end $$;

-- Remove duplicate payment methods by cafe_id + name
delete from public.payment_methods a
using public.payment_methods b
where a.ctid > b.ctid
and coalesce(a.cafe_id::text, '') = coalesce(b.cafe_id::text, '')
and lower(trim(a.name)) = lower(trim(b.name));

do $$
begin
  alter table public.payment_methods
  add constraint payment_methods_cafe_name_unique unique (cafe_id, name);
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_column then null;
end $$;

-- Remove duplicate ingredients by cafe_id + name
delete from public.ingredients a
using public.ingredients b
where a.ctid > b.ctid
and coalesce(a.cafe_id::text, '') = coalesce(b.cafe_id::text, '')
and lower(trim(a.name)) = lower(trim(b.name));

do $$
begin
  alter table public.ingredients
  add constraint ingredients_cafe_name_unique unique (cafe_id, name);
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_column then null;
end $$;

notify pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public.cafe_invites (
  id uuid default gen_random_uuid() primary key,
  cafe_id text not null,
  code text not null unique,
  role text not null,
  used boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  cafe_id text not null,
  feature_name text not null,
  is_enabled boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (cafe_id, feature_name)
);

-- Inform PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

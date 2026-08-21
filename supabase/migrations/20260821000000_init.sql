-- CropWise (Harvest Window) schema
-- Target: jqhuwlxxoluwiobbqwfd

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  onboarded boolean not null default false,
  farm_name text,
  farm_location text,
  farm_type text,
  farm_size numeric,
  farm_size_unit text,
  irrigation_method text,
  storage_facilities text[] not null default '{}',
  phone text,
  address text,
  preferred_contact text,
  language text
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- ---------- farm_crops ----------
create table public.farm_crops (
  id uuid primary key default gen_random_uuid (),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  crop text not null,
  created_at timestamptz not null default now ()
);

alter table public.farm_crops enable row level security;

create policy "farm_crops_select_own"
  on public.farm_crops for select
  using (auth.uid() = profile_id);

create policy "farm_crops_insert_own"
  on public.farm_crops for insert
  with check (auth.uid() = profile_id);

create policy "farm_crops_delete_own"
  on public.farm_crops for delete
  using (auth.uid() = profile_id);

create index farm_crops_profile_idx on public.farm_crops (profile_id);

-- ---------- market_prices ----------
create table public.market_prices (
  id uuid primary key default gen_random_uuid (),
  crop text not null,
  crop_hi text,
  market text not null default 'Pune',
  min_price integer,
  max_price integer,
  unit text not null default '₹/kg',
  updated_at timestamptz not null default now ()
);

alter table public.market_prices enable row level security;

create policy "market_prices_read_all"
  on public.market_prices for select
  using (true);

-- ---------- buyers ----------
create table public.buyers (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  location text,
  crop_focus text,
  bid_min numeric,
  bid_max numeric,
  currency text not null default '$',
  status text not null default 'Active',
  created_at timestamptz not null default now ()
);

alter table public.buyers enable row level security;

create policy "buyers_read_all"
  on public.buyers for select
  using (true);

-- ---------- news ----------
create table public.news (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  summary text,
  source text,
  url text not null unique,
  category text,
  published_at timestamptz,
  is_placeholder boolean not null default false
);

alter table public.news enable row level security;

create policy "news_read_all"
  on public.news for select
  using (true);

create index news_published_idx on public.news (published_at desc);

-- ---------- sync_meta (service role only) ----------
create table public.sync_meta (
  key text primary key,
  last_sync_at timestamptz
);

alter table public.sync_meta enable row level security;
-- No policies: reachable only via service_role.

-- ---------- crop_calendar ----------
create table public.crop_calendar (
  id uuid primary key default gen_random_uuid (),
  crop text not null,
  crop_hi text,
  sowing_start date,
  sowing_end date,
  harvest_start date,
  harvest_end date,
  region text
);

alter table public.crop_calendar enable row level security;

create policy "crop_calendar_read_all"
  on public.crop_calendar for select
  using (true);

-- ---------- msp_rates ----------
create table public.msp_rates (
  id uuid primary key default gen_random_uuid (),
  crop text not null,
  crop_hi text,
  price_per_quintal integer not null,
  year integer,
  unit text not null default '₹/quintal'
);

alter table public.msp_rates enable row level security;

create policy "msp_rates_read_all"
  on public.msp_rates for select
  using (true);

-- ---------- schemes ----------
create table public.schemes (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  name_hi text,
  ministry text,
  summary text,
  summary_hi text,
  eligibility text,
  eligibility_hi text,
  apply_url text,
  icon text,
  category text
);

alter table public.schemes enable row level security;

create policy "schemes_read_all"
  on public.schemes for select
  using (true);

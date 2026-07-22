-- ============================================================================
-- VitalTrack — Supabase schema
-- Run this in the SQL Editor of EACH Supabase project (VitalTrack_Dev AND
-- VitalTrack_Prod). It is idempotent (safe to re-run).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one account can hold multiple family-member profiles.
-- `account_id` links to Supabase Auth (auth.users.id).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references auth.users(id) on delete cascade,
  full_name          text not null,
  relationship       text default 'Self',
  dob                date,
  gender             text,
  height             text,
  weight             text,
  blood_type         text default 'Unknown',
  medical_conditions text,
  doctor_name        text,
  doctor_phone       text,
  emergency_contact  text,
  notes              text,
  is_self            boolean not null default false,
  is_default         boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists profiles_account_id_idx on public.profiles(account_id);

-- ---------------------------------------------------------------------------
-- health_records: single polymorphic table for all 8 categories.
-- `data` (jsonb) holds category-specific fields (systolic/diastolic, duration,
-- level, etc.), mirroring the TS `HealthRecord.fields` shape.
-- `account_id` is denormalized from profiles so RLS policies stay cheap.
-- ---------------------------------------------------------------------------
create table if not exists public.health_records (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  account_id  uuid not null references auth.users(id) on delete cascade,
  category    text not null check (category in
                ('blood','meal','exercise','sleep','symptoms','stress','medication','water')),
  entry_date  date not null,
  entry_time  time,
  data        jsonb not null default '{}'::jsonb,
  notes       text,
  source      text default 'manual',
  created_at  timestamptz not null default now()
);

create index if not exists health_records_profile_date_idx
  on public.health_records(profile_id, entry_date desc, entry_time desc);
create index if not exists health_records_account_idx
  on public.health_records(account_id, entry_date);

-- ---------------------------------------------------------------------------
-- Auto-create a default "Self" profile when a new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (account_id, full_name, is_self, is_default)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'My Profile'), true, true)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security: a user can only ever touch their own rows.
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.health_records enable row level security;

drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_delete_own"  on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (account_id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (account_id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "profiles_delete_own" on public.profiles
  for delete using (account_id = auth.uid());

drop policy if exists "records_select_own"  on public.health_records;
drop policy if exists "records_insert_own"  on public.health_records;
drop policy if exists "records_update_own"  on public.health_records;
drop policy if exists "records_delete_own"  on public.health_records;
create policy "records_select_own" on public.health_records
  for select using (account_id = auth.uid());
create policy "records_insert_own" on public.health_records
  for insert with check (account_id = auth.uid());
create policy "records_update_own" on public.health_records
  for update using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "records_delete_own" on public.health_records
  for delete using (account_id = auth.uid());

-- ============================================================================
-- (Dev only) Seed a demo / guest account so "Continue as Guest" works.
-- Run ONLY in the VitalTrack_Dev project. Skip for Production.
-- The password below is set via the Auth API; this script creates the SQL-side
-- rows. Create the auth user first via Dashboard → Authentication → Add user:
--   email: demo@example.com   password: demo1234
-- Then run the block below.
-- ============================================================================
/*
insert into public.profiles (account_id, full_name, is_self, is_default)
select id, 'John Smith (Demo)', true, true
from auth.users
where email = 'demo@example.com'
on conflict do nothing;
*/

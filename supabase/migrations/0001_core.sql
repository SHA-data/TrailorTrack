-- ==============================================================================
-- TailorTrack Phase 2 Migration: Core Schema, Roles, Immutability & RLS
-- ==============================================================================

-- Enable pgcrypto for cryptographically secure random bytes if not already enabled
create extension if not exists "pgcrypto" with schema extensions;

-- ------------------------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------------------------

-- 1.1 Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'tailor')),
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 Customers Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  city text,
  qr_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  qr_token_rotated_at timestamptz,
  created_at timestamptz not null default now()
);

-- 1.3 Tailor Shops Table
create table if not exists public.tailor_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  shop_name text not null,
  city text,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

-- 1.4 Consents Table
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  shop_id uuid not null references public.tailor_shops(id) on delete cascade,
  scopes text[] not null default '{measurements,orders}',
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'declined')),
  granted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint check_consent_scopes check (scopes <@ array['measurements', 'orders', 'saved_looks']::text[])
);

-- Partial unique index: Only one active or pending consent per customer-shop pair
create unique index if not exists idx_consents_single_active_or_pending
on public.consents (customer_id, shop_id)
where status in ('pending', 'active');

-- Index foreign keys for join performance
create index if not exists idx_customers_user_id on public.customers (user_id);
create index if not exists idx_tailor_shops_owner_id on public.tailor_shops (owner_id);
create index if not exists idx_consents_customer_id on public.consents (customer_id);
create index if not exists idx_consents_shop_id on public.consents (shop_id);

-- ------------------------------------------------------------------------------
-- 2. HELPER & SECURITY FUNCTIONS
-- ------------------------------------------------------------------------------

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Function: Checks if the calling user owns the customer profile
create or replace function public.is_customer_owner(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.customers
    where id = p_customer_id
      and user_id = auth.uid()
  );
$$;

-- Function: Checks if the calling user owns the tailor shop
create or replace function public.is_shop_owner(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tailor_shops
    where id = p_shop_id
      and owner_id = auth.uid()
  );
$$;

-- Function: Validates active, unexpired, unrevoked consent with scope
create or replace function public.has_active_consent(
  p_shop_id uuid,
  p_customer_id uuid,
  p_scope text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.consents
    where shop_id = p_shop_id
      and customer_id = p_customer_id
      and status = 'active'
      and revoked_at is null
      and (expires_at is null or expires_at > now())
      and p_scope = any(scopes)
  );
$$;

-- Function: Rotates customer's QR token with 128-bit cryptographically secure randomness
create or replace function public.rotate_my_qr_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_token text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_new_token := encode(extensions.gen_random_bytes(16), 'hex');

  -- Mark transaction context so the immutability trigger allows rotation
  perform set_config('tailortrack.rotating_qr', 'true', true);

  update public.customers
  set qr_token = v_new_token,
      qr_token_rotated_at = now()
  where user_id = auth.uid();

  if not found then
    raise exception 'Customer record not found for authenticated user';
  end if;

  return v_new_token;
end;
$$;

-- ------------------------------------------------------------------------------
-- 3. IMMUTABILITY & LIFECYCLE TRIGGERS
-- ------------------------------------------------------------------------------

-- Trigger function: Prevents direct modifications to critical immutable identity columns
create or replace function public.enforce_column_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Prevent modifying profiles.id or profiles.role
  if tg_table_name = 'profiles' then
    if new.id <> old.id then
      raise exception 'Cannot modify immutable column profiles.id';
    end if;
    if new.role <> old.role then
      raise exception 'Cannot modify user role once assigned';
    end if;
  end if;

  -- Prevent direct update of customer user_id or qr_token
  if tg_table_name = 'customers' then
    if new.user_id <> old.user_id then
      raise exception 'Cannot modify immutable column customers.user_id';
    end if;
    -- Normal updates cannot modify qr_token directly (must use rotate_my_qr_token)
    if new.qr_token <> old.qr_token then
      if coalesce(current_setting('tailortrack.rotating_qr', true), 'false') <> 'true' then
        raise exception 'qr_token cannot be updated directly. Call rotate_my_qr_token()';
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Apply updated_at trigger
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Apply column immutability triggers
drop trigger if exists trg_profiles_protect_columns on public.profiles;
create trigger trg_profiles_protect_columns
  before update on public.profiles
  for each row
  execute function public.enforce_column_immutability();

drop trigger if exists trg_customers_protect_columns on public.customers;
create trigger trg_customers_protect_columns
  before update on public.customers
  for each row
  execute function public.enforce_column_immutability();

-- ------------------------------------------------------------------------------
-- 4. NEW USER AUTOMATIC PROVISIONING TRIGGER
-- ------------------------------------------------------------------------------

-- Trigger function on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_full_name text;
  v_shop_name text;
  v_city text;
  v_phone text;
begin
  -- Extract metadata safely
  v_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  -- Strictly coerce any role other than 'tailor' to 'customer'
  if v_role <> 'tailor' then
    v_role := 'customer';
  end if;

  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_city := new.raw_user_meta_data->>'city';
  v_phone := coalesce(new.phone, new.raw_user_meta_data->>'phone');
  v_shop_name := coalesce(new.raw_user_meta_data->>'shop_name', v_full_name || '''s Tailors');

  -- 1. Create Profile
  insert into public.profiles (id, role, full_name, phone, avatar_url)
  values (new.id, v_role, v_full_name, v_phone, new.raw_user_meta_data->>'avatar_url');

  -- 2. Create Role-Specific Row
  if v_role = 'customer' then
    insert into public.customers (user_id, city, qr_token)
    values (new.id, v_city, encode(extensions.gen_random_bytes(16), 'hex'));
  else
    insert into public.tailor_shops (owner_id, shop_name, city, address, phone)
    values (new.id, v_shop_name, v_city, new.raw_user_meta_data->>'address', v_phone);
  end if;

  return new;
end;
$$;

-- Bind trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all 4 tables
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.tailor_shops enable row level security;
alter table public.consents enable row level security;

-- Drop any existing policies to ensure clean idempotent run
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Customers can view own customer record" on public.customers;
drop policy if exists "Customers can update own customer record" on public.customers;
drop policy if exists "Shop owners can view own shop" on public.tailor_shops;
drop policy if exists "Shop owners can update own shop" on public.tailor_shops;
drop policy if exists "Customers can view own consents" on public.consents;
drop policy if exists "Shop owners can view consents for own shop" on public.consents;
drop policy if exists "Shop owners can insert pending consent for own shop" on public.consents;
drop policy if exists "Customers can update own consent status" on public.consents;

-- 5.1 Profiles Policies
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5.2 Customers Policies (Tailors have NO direct select)
create policy "Customers can view own customer record"
  on public.customers
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Customers can update own customer record"
  on public.customers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5.3 Tailor Shops Policies
create policy "Shop owners can view own shop"
  on public.tailor_shops
  for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Shop owners can update own shop"
  on public.tailor_shops
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 5.4 Consents Policies (No deletes allowed by anyone)
create policy "Customers can view own consents"
  on public.consents
  for select
  to authenticated
  using (public.is_customer_owner(customer_id));

create policy "Shop owners can view consents for own shop"
  on public.consents
  for select
  to authenticated
  using (public.is_shop_owner(shop_id));

create policy "Shop owners can insert pending consent for own shop"
  on public.consents
  for insert
  to authenticated
  with check (
    public.is_shop_owner(shop_id)
    and status = 'pending'
  );

create policy "Customers can update own consent status"
  on public.consents
  for update
  to authenticated
  using (public.is_customer_owner(customer_id))
  with check (
    public.is_customer_owner(customer_id)
    and (
      -- Customer can revoke any active/pending consent
      (status = 'revoked' and revoked_at is not null)
      or
      -- Customer can accept or decline a pending consent
      (status in ('active', 'declined'))
    )
  );

-- ------------------------------------------------------------------------------
-- 6. PERMISSIONS & PRIVILEGES
-- ------------------------------------------------------------------------------

-- Revoke all permissions from anon role
revoke all on public.profiles from anon;
revoke all on public.customers from anon;
revoke all on public.tailor_shops from anon;
revoke all on public.consents from anon;

-- Grant minimal necessary permissions to authenticated role
grant select, update on public.profiles to authenticated;
grant select, update on public.customers to authenticated;
grant select, update on public.tailor_shops to authenticated;
grant select, insert, update on public.consents to authenticated;

-- Function execution grants
grant execute on function public.rotate_my_qr_token() to authenticated;
grant execute on function public.is_customer_owner(uuid) to authenticated;
grant execute on function public.is_shop_owner(uuid) to authenticated;
grant execute on function public.has_active_consent(uuid, uuid, text) to authenticated;

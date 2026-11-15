-- ==============================================================================
-- TailorTrack Migration 0002: Customer Profile Completion, Family Profiles,
-- and Measurement Sets with Versioned Append-Only History.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ALTER CUSTOMERS TABLE
-- ------------------------------------------------------------------------------

-- Add fit_category and preferred_unit to customers
alter table public.customers
  add column if not exists fit_category text check (fit_category in ('men','women','boys','girls')),
  add column if not exists preferred_unit text not null default 'in' check (preferred_unit in ('in','cm'));

comment on column public.customers.fit_category is 'Primary fit category for garment templates (men, women, boys, girls).';
comment on column public.customers.preferred_unit is 'Preferred display unit (in = inches, cm = centimeters). Canonical storage is always inches.';

-- ------------------------------------------------------------------------------
-- 2. CREATE FAMILY MEMBERS TABLE
-- ------------------------------------------------------------------------------

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 80),
  relation text not null check (relation in ('spouse','son','daughter','father','mother','brother','sister','other')),
  fit_category text not null check (fit_category in ('men','women','boys','girls')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_family_members_id_customer unique (id, customer_id)
);

comment on table public.family_members is 'Family members under a customer profile for centralized tailoring passports.';

-- Trigger: Enforce maximum 10 family members per customer
create or replace function public.enforce_family_members_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.family_members
  where customer_id = new.customer_id;

  if v_count >= 10 then
    raise exception 'Maximum 10 family members allowed per customer profile.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_family_members_cap on public.family_members;
create trigger trg_family_members_cap
  before insert on public.family_members
  for each row
  execute function public.enforce_family_members_cap();

-- Trigger: Updated_at for family_members
drop trigger if exists trg_family_members_updated_at on public.family_members;
create trigger trg_family_members_updated_at
  before update on public.family_members
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. CREATE MEASUREMENT SETS TABLE (APPEND-ONLY HISTORY)
-- ------------------------------------------------------------------------------

create table if not exists public.measurement_sets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  family_member_id uuid null,
  garment_type text not null check (garment_type in ('kameez','shirt','shalwar','trouser','waistcoat','sherwani','coat')),
  values jsonb not null check (
    jsonb_typeof(values) = 'object'
    and values <> '{}'::jsonb
    and pg_column_size(values) <= 4096
  ),
  fit_preference text check (fit_preference in ('slim','regular','loose')),
  notes text check (notes is null or length(notes) <= 500),
  source text not null default 'self' check (source in ('self','tailor')),
  shop_id uuid null references public.tailor_shops(id),
  taken_on date not null default current_date,
  created_at timestamptz default now(),
  constraint fk_measurement_sets_family_member
    foreign key (family_member_id, customer_id)
    references public.family_members(id, customer_id)
    on delete cascade
);

comment on table public.measurement_sets is 'Append-only historical measurement sets. Values are stored strictly in inches.';

-- Composite index for fast querying of latest sets and garment timelines
create index if not exists idx_measurement_sets_query
  on public.measurement_sets(customer_id, family_member_id, garment_type, created_at desc);

-- Trigger: Append-only immutability (only notes may be updated)
create or replace function public.enforce_measurement_sets_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    new.id <> old.id or
    new.customer_id <> old.customer_id or
    new.family_member_id is distinct from old.family_member_id or
    new.garment_type <> old.garment_type or
    new.values <> old.values or
    new.fit_preference is distinct from old.fit_preference or
    new.source <> old.source or
    new.shop_id is distinct from old.shop_id or
    new.taken_on <> old.taken_on or
    new.created_at <> old.created_at
  ) then
    raise exception 'Measurement sets are immutable history. Only notes can be updated; create a new set for updated measurements.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_measurement_sets_immutability on public.measurement_sets;
create trigger trg_measurement_sets_immutability
  before update on public.measurement_sets
  for each row
  execute function public.enforce_measurement_sets_immutability();

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS
alter table public.family_members enable row level security;
alter table public.measurement_sets enable row level security;

-- 4.1 Family Members Policies
create policy "Customers can view own family members"
  on public.family_members
  for select
  to authenticated
  using (public.is_customer_owner(customer_id));

create policy "Tailors can view family members with active consent"
  on public.family_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tailor_shops s
      where s.owner_id = auth.uid()
        and public.has_active_consent(s.id, customer_id, 'measurements')
    )
  );

create policy "Customers can insert own family members"
  on public.family_members
  for insert
  to authenticated
  with check (public.is_customer_owner(customer_id));

create policy "Customers can update own family members"
  on public.family_members
  for update
  to authenticated
  using (public.is_customer_owner(customer_id))
  with check (public.is_customer_owner(customer_id));

create policy "Customers can delete own family members"
  on public.family_members
  for delete
  to authenticated
  using (public.is_customer_owner(customer_id));

-- 4.2 Measurement Sets Policies
create policy "Customers can view own measurement sets"
  on public.measurement_sets
  for select
  to authenticated
  using (public.is_customer_owner(customer_id));

create policy "Tailors can view measurement sets with active consent"
  on public.measurement_sets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tailor_shops s
      where s.owner_id = auth.uid()
        and public.has_active_consent(s.id, customer_id, 'measurements')
    )
  );

create policy "Customers can insert own self-measured sets"
  on public.measurement_sets
  for insert
  to authenticated
  with check (
    public.is_customer_owner(customer_id)
    and source = 'self'
    and shop_id is null
  );

create policy "Customers can update own measurement set notes"
  on public.measurement_sets
  for update
  to authenticated
  using (public.is_customer_owner(customer_id))
  with check (public.is_customer_owner(customer_id));

create policy "Customers can delete own measurement sets"
  on public.measurement_sets
  for delete
  to authenticated
  using (public.is_customer_owner(customer_id));

-- ------------------------------------------------------------------------------
-- 5. PERMISSIONS & PRIVILEGES
-- ------------------------------------------------------------------------------

-- Revoke all permissions from anon
revoke all on public.family_members from anon;
revoke all on public.measurement_sets from anon;

-- Grant minimal permissions to authenticated
grant select, insert, update, delete on public.family_members to authenticated;
grant select, insert, update, delete on public.measurement_sets to authenticated;

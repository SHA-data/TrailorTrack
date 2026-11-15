-- ============================================================================
-- TAILORTRACK MIGRATION 0003: ACCESS FLOW, QR PASSPORT & CONSENT STATE MACHINE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ALTER TABLE: public.consents
-- ----------------------------------------------------------------------------
alter table public.consents
  add column if not exists requested_scopes text[] not null default '{measurements}',
  add column if not exists responded_at timestamptz;

-- Ensure requested_scopes constraint aligns with valid scopes
alter table public.consents
  drop constraint if exists check_consent_requested_scopes;

alter table public.consents
  add constraint check_consent_requested_scopes
  check (requested_scopes <@ array['measurements', 'orders', 'saved_looks']::text[]);

-- ----------------------------------------------------------------------------
-- 2. CONSENT STATE MACHINE TRIGGER
-- ----------------------------------------------------------------------------
create or replace function public.check_consent_state_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Block modification if already in a terminal state
  if old.status in ('declined', 'revoked') then
    raise exception 'Cannot modify consent in terminal status %', old.status;
  end if;

  -- Validate state transitions
  if old.status = 'pending' then
    if new.status not in ('active', 'declined') then
      raise exception 'Invalid status transition: pending can only become active or declined (attempted %)', new.status;
    end if;
  elsif old.status = 'active' then
    if new.status not in ('revoked') then
      raise exception 'Invalid status transition: active can only become revoked (attempted %)', new.status;
    end if;
  else
    raise exception 'Unknown previous status %', old.status;
  end if;

  -- Enforce rules when transitioning to active
  if new.status = 'active' then
    -- Scopes must be a non-empty subset of requested_scopes
    if new.scopes is null or cardinality(new.scopes) = 0 then
      raise exception 'Active consent must have at least one granted scope';
    end if;

    if not (new.scopes <@ new.requested_scopes) then
      raise exception 'Granted scopes (%) must be a subset of requested scopes (%)', new.scopes, new.requested_scopes;
    end if;

    -- expires_at is required and must be between now and 365 days
    if new.expires_at is null then
      raise exception 'expires_at is required when activating consent';
    end if;

    if new.expires_at <= now() or new.expires_at > (now() + interval '365 days') then
      raise exception 'expires_at must be in the future and within 365 days of activation';
    end if;

    if new.granted_at is null then
      new.granted_at := now();
    end if;

    if new.responded_at is null then
      new.responded_at := now();
    end if;
  end if;

  -- Enforce rules when transitioning to declined
  if new.status = 'declined' then
    if new.responded_at is null then
      new.responded_at := now();
    end if;
  end if;

  -- Enforce rules when transitioning to revoked
  if new.status = 'revoked' then
    if new.revoked_at is null then
      new.revoked_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_consents_state_machine on public.consents;
create trigger trg_consents_state_machine
  before update on public.consents
  for each row
  execute function public.check_consent_state_transition();

-- Lock down direct client updates on consents so only RPCs can update them
drop policy if exists "Customers can update own consent status" on public.consents;

-- ----------------------------------------------------------------------------
-- 3. NEW TABLES: access_log & qr_lookup_attempts
-- ----------------------------------------------------------------------------
create table if not exists public.access_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  shop_id uuid not null references public.tailor_shops(id) on delete cascade,
  action text not null check (action in ('viewed_profile', 'viewed_measurements', 'viewed_family')),
  created_at timestamptz not null default now()
);

create index if not exists idx_access_log_customer_created
  on public.access_log (customer_id, created_at desc);

alter table public.access_log enable row level security;

-- Customers can view their own access logs
create policy "Customers can view own access logs"
  on public.access_log
  for select
  to authenticated
  using (public.is_customer_owner(customer_id));

-- No direct client insert/update/delete for access_log (only RPC writes)
revoke all on public.access_log from anon, public;
revoke insert, update, delete on public.access_log from authenticated;
grant select on public.access_log to authenticated;

-- QR lookup attempts table (for throttling)
create table if not exists public.qr_lookup_attempts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.tailor_shops(id) on delete cascade,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_qr_lookups_shop_window
  on public.qr_lookup_attempts (shop_id, created_at desc);

alter table public.qr_lookup_attempts enable row level security;

-- Strictly internal to RPCs
revoke all on public.qr_lookup_attempts from anon, authenticated, public;

-- ----------------------------------------------------------------------------
-- 4. SECURITY DEFINER RPCs
-- ----------------------------------------------------------------------------

-- Helper: Get current caller's shop_id or raise exception if not a tailor
create or replace function public.get_caller_shop_id()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_role text;
  v_shop_id uuid;
begin
  v_uid := (nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  if v_uid is null then
    raise exception 'Unauthorized: caller has no authenticated user ID';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role <> 'tailor' then
    raise exception 'Forbidden: caller is not a tailor';
  end if;

  select id into v_shop_id from public.tailor_shops where owner_id = v_uid;
  if v_shop_id is null then
    raise exception 'Shop not found for caller';
  end if;

  return v_shop_id;
end;
$$;

-- Helper: Get current caller's customer_id or raise exception if not a customer
create or replace function public.get_caller_customer_id()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_role text;
  v_customer_id uuid;
begin
  v_uid := (nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
  if v_uid is null then
    raise exception 'Unauthorized: caller has no authenticated user ID';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role <> 'customer' then
    raise exception 'Forbidden: caller is not a customer';
  end if;

  select id into v_customer_id from public.customers where user_id = v_uid;
  if v_customer_id is null then
    raise exception 'Customer profile not found for caller';
  end if;

  return v_customer_id;
end;
$$;

-- 4.1 lookup_passport (Tailor only)
create or replace function public.lookup_passport(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_failed_count int;
  v_customer record;
  v_full_name text;
  v_masked_name text;
  v_name_parts text[];
  v_consent record;
  v_rel_status text := 'none';
  v_consent_id uuid := null;
  v_cooldown_until timestamptz := null;
begin
  v_shop_id := public.get_caller_shop_id();

  -- Rate limit throttle: 15 failed lookups in the last hour
  select count(*) into v_failed_count
  from public.qr_lookup_attempts
  where shop_id = v_shop_id
    and succeeded = false
    and created_at > (now() - interval '1 hour');

  if v_failed_count >= 15 then
    raise exception 'Rate limit exceeded: Too many failed lookups. Please try again later.';
  end if;

  -- Look up customer by QR token
  select c.id, c.user_id into v_customer
  from public.customers c
  where c.qr_token = p_token;

  if v_customer.id is null then
    -- Log failure
    insert into public.qr_lookup_attempts (shop_id, succeeded)
    values (v_shop_id, false);
    return null;
  end if;

  -- Log success
  insert into public.qr_lookup_attempts (shop_id, succeeded)
  values (v_shop_id, true);

  -- Fetch customer profile name and mask it
  select p.full_name into v_full_name
  from public.profiles p
  where p.id = v_customer.user_id;

  v_full_name := trim(coalesce(v_full_name, 'Customer'));
  v_name_parts := regexp_split_to_array(v_full_name, '\s+');
  if array_length(v_name_parts, 1) > 1 then
    v_masked_name := v_name_parts[1] || ' ' || left(v_name_parts[array_length(v_name_parts, 1)], 1) || '.';
  else
    v_masked_name := v_name_parts[1];
  end if;

  -- Determine relationship of this shop to that customer
  select id, status, granted_at, expires_at, responded_at
  into v_consent
  from public.consents
  where customer_id = v_customer.id
    and shop_id = v_shop_id
  order by created_at desc
  limit 1;

  if v_consent.id is not null then
    v_consent_id := v_consent.id;
    if v_consent.status = 'active' then
      if v_consent.expires_at is not null and v_consent.expires_at <= now() then
        v_rel_status := 'expired';
      else
        v_rel_status := 'active';
      end if;
    elsif v_consent.status = 'pending' then
      v_rel_status := 'pending';
    elsif v_consent.status = 'declined' then
      if v_consent.responded_at is not null and v_consent.responded_at > (now() - interval '3 days') then
        v_rel_status := 'declined';
        v_cooldown_until := v_consent.responded_at + interval '3 days';
      else
        v_rel_status := 'none';
      end if;
    elsif v_consent.status = 'revoked' then
      v_rel_status := 'revoked';
    end if;
  end if;

  return jsonb_build_object(
    'masked_name', v_masked_name,
    'status', v_rel_status,
    'consent_id', v_consent_id,
    'cooldown_until', v_cooldown_until
  );
end;
$$;

-- 4.2 request_access (Tailor only)
create or replace function public.request_access(p_token text, p_scopes text[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_customer_id uuid;
  v_consent_id uuid;
  v_recent_declined record;
  v_active_or_pending record;
begin
  v_shop_id := public.get_caller_shop_id();

  if p_scopes is null or cardinality(p_scopes) = 0 then
    raise exception 'At least one scope must be requested';
  end if;

  if not (p_scopes <@ array['measurements', 'orders', 'saved_looks']::text[]) then
    raise exception 'Invalid scopes requested: %', p_scopes;
  end if;

  select id into v_customer_id
  from public.customers
  where qr_token = p_token;

  if v_customer_id is null then
    raise exception 'Invalid passport token';
  end if;

  -- Check 3-day decline cooldown
  select id, responded_at into v_recent_declined
  from public.consents
  where customer_id = v_customer_id
    and shop_id = v_shop_id
    and status = 'declined'
    and responded_at > (now() - interval '3 days')
  order by responded_at desc
  limit 1;

  if v_recent_declined.id is not null then
    raise exception 'Request blocked: Customer declined recently. Please wait for cooldown to expire.';
  end if;

  -- Check existing active or pending
  select id, status, expires_at into v_active_or_pending
  from public.consents
  where customer_id = v_customer_id
    and shop_id = v_shop_id
    and (
      status = 'pending'
      or (status = 'active' and (expires_at is null or expires_at > now()))
    )
  limit 1;

  if v_active_or_pending.id is not null then
    raise exception 'A consent with status % already exists for this customer', v_active_or_pending.status;
  end if;

  insert into public.consents (
    customer_id,
    shop_id,
    requested_scopes,
    scopes,
    status
  ) values (
    v_customer_id,
    v_shop_id,
    p_scopes,
    p_scopes,
    'pending'
  )
  returning id into v_consent_id;

  return v_consent_id;
end;
$$;

-- 4.3 respond_to_consent (Customer only)
create or replace function public.respond_to_consent(
  p_consent_id uuid,
  p_decision text,
  p_scopes text[],
  p_duration_days int default 30
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_consent record;
begin
  v_customer_id := public.get_caller_customer_id();

  select * into v_consent
  from public.consents
  where id = p_consent_id;

  if v_consent.id is null then
    raise exception 'Consent request not found';
  end if;

  if v_consent.customer_id <> v_customer_id then
    raise exception 'Unauthorized: caller does not own this consent request';
  end if;

  if v_consent.status <> 'pending' then
    raise exception 'Cannot respond to consent with status %', v_consent.status;
  end if;

  if p_decision = 'decline' then
    update public.consents
    set status = 'declined',
        responded_at = now()
    where id = p_consent_id;
    return true;

  elsif p_decision = 'approve' then
    if p_duration_days not in (7, 30, 90, 365) then
      raise exception 'Invalid duration: must be 7, 30, 90, or 365 days';
    end if;

    if p_scopes is null or cardinality(p_scopes) = 0 then
      raise exception 'At least one scope must be approved';
    end if;

    if not (p_scopes <@ v_consent.requested_scopes) then
      raise exception 'Approved scopes must be a subset of requested scopes';
    end if;

    update public.consents
    set status = 'active',
        scopes = p_scopes,
        granted_at = now(),
        responded_at = now(),
        expires_at = now() + (p_duration_days || ' days')::interval
    where id = p_consent_id;
    return true;

  else
    raise exception 'Invalid decision: must be approve or decline';
  end if;
end;
$$;

-- 4.4 revoke_consent (Customer only)
create or replace function public.revoke_consent(p_consent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_consent record;
begin
  v_customer_id := public.get_caller_customer_id();

  select * into v_consent
  from public.consents
  where id = p_consent_id;

  if v_consent.id is null then
    raise exception 'Consent not found';
  end if;

  if v_consent.customer_id <> v_customer_id then
    raise exception 'Unauthorized: caller does not own this consent';
  end if;

  if v_consent.status <> 'active' then
    raise exception 'Only active consents can be revoked';
  end if;

  update public.consents
  set status = 'revoked',
      revoked_at = now()
  where id = p_consent_id;

  return true;
end;
$$;

-- 4.5 my_consent_status (Tailor only)
create or replace function public.my_consent_status(p_consent_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_consent record;
  v_cust_id_returned uuid := null;
begin
  v_shop_id := public.get_caller_shop_id();

  select * into v_consent
  from public.consents
  where id = p_consent_id
    and shop_id = v_shop_id;

  if v_consent.id is null then
    return null;
  end if;

  -- Only reveal customer_id if consent is actively valid
  if v_consent.status = 'active' and (v_consent.expires_at is null or v_consent.expires_at > now()) then
    v_cust_id_returned := v_consent.customer_id;
  end if;

  return jsonb_build_object(
    'id', v_consent.id,
    'status', v_consent.status,
    'scopes', v_consent.scopes,
    'expires_at', v_consent.expires_at,
    'customer_id', v_cust_id_returned
  );
end;
$$;

-- 4.6 list_my_consented_customers (Tailor only)
create or replace function public.list_my_consented_customers()
returns table (
  customer_id uuid,
  full_name text,
  phone text,
  city text,
  fit_category text,
  scopes text[],
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  return query
  select
    c.id as customer_id,
    p.full_name,
    p.phone,
    c.city,
    c.fit_category,
    cn.scopes,
    cn.expires_at
  from public.consents cn
  join public.customers c on c.id = cn.customer_id
  join public.profiles p on p.id = c.user_id
  where cn.shop_id = v_shop_id
    and cn.status = 'active'
    and cn.expires_at > now()
  order by cn.granted_at desc;
end;
$$;

-- 4.7 get_consented_customer (Tailor only)
create or replace function public.get_consented_customer(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_consent record;
  v_customer record;
  v_profile record;
  v_recent_log uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  select * into v_consent
  from public.consents
  where customer_id = p_customer_id
    and shop_id = v_shop_id
    and status = 'active'
    and expires_at > now()
  order by granted_at desc
  limit 1;

  if v_consent.id is null then
    raise exception 'No active consent found for customer';
  end if;

  select * into v_customer from public.customers where id = p_customer_id;
  select * into v_profile from public.profiles where id = v_customer.user_id;

  -- 30-minute de-duplication for access_log
  select id into v_recent_log
  from public.access_log
  where customer_id = p_customer_id
    and shop_id = v_shop_id
    and action = 'viewed_profile'
    and created_at > (now() - interval '30 minutes')
  limit 1;

  if v_recent_log is null then
    insert into public.access_log (customer_id, shop_id, action)
    values (p_customer_id, v_shop_id, 'viewed_profile');
  end if;

  return jsonb_build_object(
    'customer_id', v_customer.id,
    'full_name', v_profile.full_name,
    'phone', v_profile.phone,
    'city', v_customer.city,
    'fit_category', v_customer.fit_category,
    'scopes', v_consent.scopes,
    'expires_at', v_consent.expires_at
  );
end;
$$;

-- 4.8 log_measurement_view (Tailor only)
create or replace function public.log_measurement_view(p_customer_id uuid, p_what text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_has_scope boolean;
  v_recent_log uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  if p_what not in ('viewed_measurements', 'viewed_family') then
    raise exception 'Invalid log action: must be viewed_measurements or viewed_family';
  end if;

  -- Validate active consent with 'measurements' scope
  select exists(
    select 1
    from public.consents
    where customer_id = p_customer_id
      and shop_id = v_shop_id
      and status = 'active'
      and expires_at > now()
      and 'measurements' = any(scopes)
  ) into v_has_scope;

  if not v_has_scope then
    raise exception 'Forbidden: no active consent covering measurements for this customer';
  end if;

  -- 30-minute de-duplication
  select id into v_recent_log
  from public.access_log
  where customer_id = p_customer_id
    and shop_id = v_shop_id
    and action = p_what
    and created_at > (now() - interval '30 minutes')
  limit 1;

  if v_recent_log is null then
    insert into public.access_log (customer_id, shop_id, action)
    values (p_customer_id, v_shop_id, p_what);
  end if;

  return true;
end;
$$;

-- 4.9 list_pending_requests (Customer only)
create or replace function public.list_pending_requests()
returns table (
  consent_id uuid,
  shop_id uuid,
  shop_name text,
  shop_city text,
  shop_address text,
  shop_phone text,
  requested_scopes text[],
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
begin
  v_customer_id := public.get_caller_customer_id();

  return query
  select
    cn.id as consent_id,
    s.id as shop_id,
    s.shop_name,
    s.city as shop_city,
    s.address as shop_address,
    s.phone as shop_phone,
    cn.requested_scopes,
    cn.created_at
  from public.consents cn
  join public.tailor_shops s on s.id = cn.shop_id
  where cn.customer_id = v_customer_id
    and cn.status = 'pending'
  order by cn.created_at desc;
end;
$$;

-- 4.10 list_my_access (Customer only)
create or replace function public.list_my_access()
returns table (
  consent_id uuid,
  shop_id uuid,
  shop_name text,
  shop_city text,
  shop_phone text,
  status text,
  scopes text[],
  requested_scopes text[],
  granted_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
begin
  v_customer_id := public.get_caller_customer_id();

  return query
  select
    cn.id as consent_id,
    s.id as shop_id,
    s.shop_name,
    s.city as shop_city,
    s.phone as shop_phone,
    case
      when cn.status = 'active' and cn.expires_at <= now() then 'expired'
      else cn.status
    end as status,
    cn.scopes,
    cn.requested_scopes,
    cn.granted_at,
    cn.expires_at,
    cn.revoked_at,
    cn.responded_at
  from public.consents cn
  join public.tailor_shops s on s.id = cn.shop_id
  where cn.customer_id = v_customer_id
    and cn.status <> 'pending'
  order by coalesce(cn.responded_at, cn.created_at) desc;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. REVOKE / GRANT PERMISSIONS ON RPCs
-- ----------------------------------------------------------------------------
revoke all on function public.get_caller_shop_id() from public, anon;
grant execute on function public.get_caller_shop_id() to authenticated;

revoke all on function public.get_caller_customer_id() from public, anon;
grant execute on function public.get_caller_customer_id() to authenticated;

revoke all on function public.lookup_passport(text) from public, anon;
grant execute on function public.lookup_passport(text) to authenticated;

revoke all on function public.request_access(text, text[]) from public, anon;
grant execute on function public.request_access(text, text[]) to authenticated;

revoke all on function public.respond_to_consent(uuid, text, text[], int) from public, anon;
grant execute on function public.respond_to_consent(uuid, text, text[], int) to authenticated;

revoke all on function public.revoke_consent(uuid) from public, anon;
grant execute on function public.revoke_consent(uuid) to authenticated;

revoke all on function public.my_consent_status(uuid) from public, anon;
grant execute on function public.my_consent_status(uuid) to authenticated;

revoke all on function public.list_my_consented_customers() from public, anon;
grant execute on function public.list_my_consented_customers() to authenticated;

revoke all on function public.get_consented_customer(uuid) from public, anon;
grant execute on function public.get_consented_customer(uuid) to authenticated;

revoke all on function public.log_measurement_view(uuid, text) from public, anon;
grant execute on function public.log_measurement_view(uuid, text) to authenticated;

revoke all on function public.list_pending_requests() from public, anon;
grant execute on function public.list_pending_requests() to authenticated;

revoke all on function public.list_my_access() from public, anon;
grant execute on function public.list_my_access() to authenticated;

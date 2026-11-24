-- ============================================================================
-- TailorTrack Migration 0005: Orders, Items, Snapshots & Notifications Schema
-- ============================================================================
-- Enforces:
-- 1. Orders: Immutable fields, forward-only status pipeline, payment constraints.
-- 2. Order Items: 1-6 items per order with garment taxonomy and fabric details.
-- 3. Snapshots: Stored in order_item_measurements; readable by customer always,
--    and by shop only if order is open OR shop has active 'measurements' consent.
-- 4. Order Events: Immutable append-only audit trail.
-- 5. Notifications: Machine-readable kind + jsonb data for customer inbox.
-- 6. Shop Order Counters: Atomic sequence generator for human order numbers.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper function: is_order_open
-- ----------------------------------------------------------------------------
create or replace function public.is_order_open(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in ('received', 'cutting', 'stitching', 'ready');
$$;

-- ----------------------------------------------------------------------------
-- 2. Orders Table
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.tailor_shops(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete cascade,
  family_member_id uuid null,
  person_label text not null check (length(trim(person_label)) between 1 and 80),
  shop_name text not null,
  shop_city text,
  shop_phone text,
  order_seq integer not null,
  consent_id uuid null references public.consents(id) on delete set null,
  status text not null default 'received' check (status in ('received', 'cutting', 'stitching', 'ready', 'delivered', 'cancelled')),
  total_pkr integer not null check (total_pkr between 1 and 10000000),
  paid_pkr integer not null default 0 check (paid_pkr >= 0 and paid_pkr <= total_pkr),
  delivery_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  closed_at timestamptz null,
  constraint uq_orders_shop_seq unique (shop_id, order_seq),
  constraint fk_orders_family_member foreign key (family_member_id, customer_id)
    references public.family_members(id, customer_id) on delete set null
);

comment on table public.orders is 'Core commercial garment stitching orders between customers and tailor shops.';

-- Indexes for frequent query patterns
create index if not exists idx_orders_shop_status_delivery
  on public.orders (shop_id, status, delivery_date);

create index if not exists idx_orders_customer_created
  on public.orders (customer_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Order Items Table (1 to 6 items per order)
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  position smallint not null check (position between 1 and 6),
  garment_type text not null check (garment_type in ('kameez','shirt','shalwar','trouser','waistcoat','sherwani','coat')),
  quantity smallint not null default 1 check (quantity between 1 and 10),
  fabric_source text not null check (fabric_source in ('customer', 'shop')),
  fabric_details text check (fabric_details is null or length(fabric_details) <= 200),
  fabric_metres numeric(5,2) null check (fabric_metres is null or fabric_metres >= 0),
  design_notes text check (design_notes is null or length(design_notes) <= 1000),
  has_snapshot boolean not null default false,
  constraint uq_order_items_order_position unique (order_id, position)
);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- 4. Order Item Measurements (Snapshot copy taken at order creation)
-- ----------------------------------------------------------------------------
create table if not exists public.order_item_measurements (
  item_id uuid primary key references public.order_items(id) on delete cascade,
  source_set_id uuid null references public.measurement_sets(id) on delete set null,
  values jsonb not null check (jsonb_typeof(values) = 'object' and values <> '{}'::jsonb),
  fit_preference text check (fit_preference is null or fit_preference in ('slim','regular','loose')),
  taken_on date null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. Order Events Table (Append-only state & transaction log)
-- ----------------------------------------------------------------------------
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('created', 'status_changed', 'delivery_rescheduled', 'price_changed', 'payment_recorded')),
  from_value text null,
  to_value text null,
  note text check (note is null or length(note) <= 280),
  actor_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order_created
  on public.order_events (order_id, created_at);

-- ----------------------------------------------------------------------------
-- 6. Notifications Table (Machine-readable data only; wording in code)
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('order_created', 'order_status', 'order_rescheduled', 'order_price_changed', 'order_payment')),
  data jsonb not null default '{}'::jsonb,
  order_id uuid null references public.orders(id) on delete cascade,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications (user_id)
  where read_at is null;

-- ----------------------------------------------------------------------------
-- 7. Shop Order Counters (Sequence numbers #1, #2... per shop)
-- ----------------------------------------------------------------------------
create table if not exists public.shop_order_counters (
  shop_id uuid primary key references public.tailor_shops(id) on delete cascade,
  last_seq integer not null default 0
);

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS: Business Invariants & State Machine
-- ----------------------------------------------------------------------------

-- 8.1 Append-only enforcement on order_events
create or replace function public.enforce_order_events_append_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'order_events is append-only: updates and deletes are prohibited';
end;
$$;

drop trigger if exists trg_order_events_append_only on public.order_events;
create trigger trg_order_events_append_only
  before update or delete on public.order_events
  for each row execute function public.enforce_order_events_append_only();

-- 8.2 Orders Update Rules: Immutability, Forward-only status, Paid amounts
create or replace function public.check_orders_update_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Block modification if already cancelled (terminal)
  if old.status = 'cancelled' then
    raise exception 'Cannot modify order in terminal status cancelled';
  end if;

  -- Delivered orders allow only recording payments (paid_pkr increase)
  if old.status = 'delivered' then
    if new.status <> 'delivered' then
      raise exception 'Cannot modify status of an order that has already been delivered';
    end if;
    if new.total_pkr <> old.total_pkr
       or new.delivery_date <> old.delivery_date
       or new.person_label <> old.person_label
       or new.shop_id <> old.shop_id
       or new.customer_id <> old.customer_id then
      raise exception 'Cannot modify details of a delivered order (only payment recording permitted)';
    end if;
  end if;

  -- Immutable columns across any update
  if new.shop_id <> old.shop_id
     or new.customer_id <> old.customer_id
     or new.order_seq <> old.order_seq
     or new.person_label <> old.person_label
     or new.shop_name <> old.shop_name
     or coalesce(new.shop_city, '') <> coalesce(old.shop_city, '')
     or coalesce(new.shop_phone, '') <> coalesce(old.shop_phone, '')
     or coalesce(new.consent_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(old.consent_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or coalesce(new.family_member_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(old.family_member_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or new.created_at <> old.created_at then
    raise exception 'Attempted to modify immutable order attributes';
  end if;

  -- paid_pkr never decreases
  if new.paid_pkr < old.paid_pkr then
    raise exception 'paid_pkr cannot decrease (attempted % -> %)', old.paid_pkr, new.paid_pkr;
  end if;

  -- Validate status transitions when status changes
  if new.status <> old.status then
    -- Cancel is allowed from any open status
    if new.status = 'cancelled' then
      if not public.is_order_open(old.status) then
        raise exception 'Cannot cancel order with current status %', old.status;
      end if;
    -- Forward pipeline validation: received -> cutting -> stitching -> ready -> delivered
    elsif old.status = 'received' then
      if new.status not in ('cutting', 'stitching', 'ready', 'delivered') then
        raise exception 'Invalid status transition: received to %', new.status;
      end if;
    elsif old.status = 'cutting' then
      if new.status not in ('stitching', 'ready', 'delivered') then
        raise exception 'Invalid status transition: cutting to %', new.status;
      end if;
    elsif old.status = 'stitching' then
      if new.status not in ('ready', 'delivered') then
        raise exception 'Invalid status transition: stitching to %', new.status;
      end if;
    elsif old.status = 'ready' then
      if new.status not in ('delivered') then
        raise exception 'Invalid status transition: ready to %', new.status;
      end if;
    else
      raise exception 'Invalid status transition from % to %', old.status, new.status;
    end if;

    -- Update status timestamp and closed timestamp if reached end
    new.status_changed_at = now();
    if new.status in ('delivered', 'cancelled') then
      new.closed_at = now();
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_update_rules on public.orders;
create trigger trg_orders_update_rules
  before update on public.orders
  for each row execute function public.check_orders_update_rules();

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_measurements enable row level security;
alter table public.order_events enable row level security;
alter table public.notifications enable row level security;
alter table public.shop_order_counters enable row level security;

-- 9.1 Orders: Customer owner OR Shop owner can select
create policy "Customers and shop owners can view orders"
  on public.orders
  for select
  to authenticated
  using (
    public.is_customer_owner(customer_id)
    or public.is_shop_owner(shop_id)
  );

-- 9.2 Order Items: Customer owner OR Shop owner can select
create policy "Customers and shop owners can view order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_customer_owner(o.customer_id)
          or public.is_shop_owner(o.shop_id)
        )
    )
  );

-- 9.3 Order Events: Customer owner OR Shop owner can select
create policy "Customers and shop owners can view order events"
  on public.order_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_events.order_id
        and (
          public.is_customer_owner(o.customer_id)
          or public.is_shop_owner(o.shop_id)
        )
    )
  );

-- 9.4 Order Item Measurements:
-- Customer owner OR (shop owner AND (order is open OR has_active_consent(shop, customer, 'measurements')))
create policy "Customer or authorized shop can view measurement snapshot"
  on public.order_item_measurements
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_measurements.item_id
        and (
          public.is_customer_owner(o.customer_id)
          or (
            public.is_shop_owner(o.shop_id)
            and (
              public.is_order_open(o.status)
              or public.has_active_consent(o.shop_id, o.customer_id, 'measurements')
            )
          )
        )
    )
  );

-- 9.5 Notifications: user_id = auth.uid() only
create policy "Users can view own notifications"
  on public.notifications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 10. PRIVILEGES: Revoke direct writes, grant SELECT only where policy exists
-- ----------------------------------------------------------------------------
revoke all on public.orders from public, anon;
revoke insert, update, delete on public.orders from authenticated;
grant select on public.orders to authenticated;

revoke all on public.order_items from public, anon;
revoke insert, update, delete on public.order_items from authenticated;
grant select on public.order_items to authenticated;

revoke all on public.order_item_measurements from public, anon;
revoke insert, update, delete on public.order_item_measurements from authenticated;
grant select on public.order_item_measurements to authenticated;

revoke all on public.order_events from public, anon;
revoke insert, update, delete on public.order_events from authenticated;
grant select on public.order_events to authenticated;

revoke all on public.notifications from public, anon;
revoke insert, update, delete on public.notifications from authenticated;
grant select on public.notifications to authenticated;

-- shop_order_counters has NO select/insert/update/delete for users (only security definer RPCs)
revoke all on public.shop_order_counters from public, anon, authenticated;

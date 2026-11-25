-- ============================================================================
-- TailorTrack Migration 0006: Orders & Dashboard Security Definer RPCs
-- ============================================================================
-- All RPCs run as SECURITY DEFINER with empty search_path.
-- Caller identity is resolved via public.get_caller_shop_id() / get_caller_customer_id().
-- Revoked from public and anon; granted to authenticated only.
-- Short, machine-readable exceptions raised for client-side mapping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. create_order (Tailor only)
-- ----------------------------------------------------------------------------
create or replace function public.create_order(
  p_customer_id uuid,
  p_family_member_id uuid,
  p_delivery_date date,
  p_total_pkr int,
  p_advance_pkr int,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_consent record;
  v_shop record;
  v_person_name text;
  v_person_label text;
  v_today_karachi date;
  v_num_items int;
  v_open_orders_count int;
  v_order_seq int;
  v_order_id uuid;
  v_item jsonb;
  v_item_id uuid;
  v_garment_type text;
  v_mset_id uuid;
  v_mset record;
  v_cust_user_id uuid;
  i int;
begin
  -- 1. Verify caller owns a tailor shop
  v_shop_id := public.get_caller_shop_id();

  -- 2. Verify active unexpired consent with 'orders' scope
  select id, scopes into v_consent
  from public.consents
  where shop_id = v_shop_id
    and customer_id = p_customer_id
    and status = 'active'
    and revoked_at is null
    and (expires_at is null or expires_at > now())
    and 'orders' = any(scopes)
  order by granted_at desc
  limit 1;

  if v_consent.id is null then
    raise exception 'consent_required: Active consent with orders scope is required to create an order';
  end if;

  -- 3. Verify family member belongs to customer (or resolve customer self name)
  if p_family_member_id is not null then
    select full_name into v_person_name
    from public.family_members
    where id = p_family_member_id and customer_id = p_customer_id;

    if v_person_name is null then
      raise exception 'invalid_family_member: Family member does not belong to this customer';
    end if;
    v_person_label := v_person_name;
  else
    select p.full_name into v_person_name
    from public.customers c
    join public.profiles p on p.id = c.user_id
    where c.id = p_customer_id;

    v_person_label := coalesce(v_person_name, 'Self');
  end if;

  -- 4. Validate items array (1 to 6 items)
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items_invalid: p_items must be a JSON array';
  end if;

  v_num_items := jsonb_array_length(p_items);
  if v_num_items < 1 or v_num_items > 6 then
    raise exception 'item_count_invalid: An order must contain between 1 and 6 items (received %)', v_num_items;
  end if;

  -- 5. Validate delivery date (Asia/Karachi calendar: today to today + 365 days)
  v_today_karachi := (now() at time zone 'Asia/Karachi')::date;
  if p_delivery_date < v_today_karachi or p_delivery_date > (v_today_karachi + 365) then
    raise exception 'delivery_date_invalid: Delivery date must be between today and 365 days in the future';
  end if;

  -- 6. Validate pricing
  if p_total_pkr < 1 or p_total_pkr > 10000000 then
    raise exception 'total_invalid: Total price must be between PKR 1 and PKR 10,000,000';
  end if;

  if p_advance_pkr < 0 or p_advance_pkr > p_total_pkr then
    raise exception 'advance_invalid: Advance payment must be between 0 and the total order price';
  end if;

  -- 7. Cap at maximum 10 open orders per shop-customer pair
  select count(*) into v_open_orders_count
  from public.orders
  where shop_id = v_shop_id
    and customer_id = p_customer_id
    and public.is_order_open(status);

  if v_open_orders_count >= 10 then
    raise exception 'limit_reached: Maximum limit of 10 open orders reached for this customer';
  end if;

  -- 8. Fetch shop snapshot details
  select shop_name, city, phone into v_shop
  from public.tailor_shops
  where id = v_shop_id;

  -- 9. Atomic race-safe sequence assignment
  insert into public.shop_order_counters (shop_id, last_seq)
  values (v_shop_id, 1)
  on conflict (shop_id)
  do update set last_seq = public.shop_order_counters.last_seq + 1
  returning last_seq into v_order_seq;

  -- 10. Insert core order
  insert into public.orders (
    shop_id, customer_id, family_member_id, person_label,
    shop_name, shop_city, shop_phone, order_seq, consent_id,
    status, total_pkr, paid_pkr, delivery_date
  ) values (
    v_shop_id, p_customer_id, p_family_member_id, v_person_label,
    v_shop.shop_name, v_shop.city, v_shop.phone, v_order_seq, v_consent.id,
    'received', p_total_pkr, p_advance_pkr, p_delivery_date
  ) returning id into v_order_id;

  -- 11. Loop over items and create item rows + measurement snapshots
  for i in 0..(v_num_items - 1) loop
    v_item := (p_items->i);

    v_garment_type := (v_item->>'garment_type');
    if v_garment_type not in ('kameez','shirt','shalwar','trouser','waistcoat','sherwani','coat') then
      raise exception 'invalid_garment: Garment type % is not recognized', v_garment_type;
    end if;

    if (v_item->>'fabric_source') not in ('customer', 'shop') then
      raise exception 'invalid_fabric_source: Fabric source must be customer or shop';
    end if;

    insert into public.order_items (
      order_id, position, garment_type, quantity,
      fabric_source, fabric_details, fabric_metres, design_notes,
      has_snapshot
    ) values (
      v_order_id,
      (i + 1)::smallint,
      v_garment_type,
      coalesce((v_item->>'quantity')::smallint, 1),
      (v_item->>'fabric_source'),
      nullif(trim(v_item->>'fabric_details'), ''),
      nullif(v_item->>'fabric_metres', '')::numeric(5,2),
      nullif(trim(v_item->>'design_notes'), ''),
      false
    ) returning id into v_item_id;

    -- If item specifies a measurement_set_id, take snapshot
    v_mset_id := nullif(v_item->>'measurement_set_id', '')::uuid;
    if v_mset_id is not null then
      -- Consent must include 'measurements' scope
      if not ('measurements' = any(v_consent.scopes)) then
        raise exception 'scope_missing: Active consent with measurements scope is required to attach measurement sets';
      end if;

      -- Validate measurement set belongs to same customer, person, and garment
      select * into v_mset
      from public.measurement_sets
      where id = v_mset_id
        and customer_id = p_customer_id
        and (
          (p_family_member_id is null and family_member_id is null) or
          (p_family_member_id is not null and family_member_id = p_family_member_id)
        )
        and garment_type = v_garment_type;

      if v_mset.id is null then
        raise exception 'invalid_measurement_set: Measurement set does not match customer, person, or garment type';
      end if;

      -- Insert immutable snapshot
      insert into public.order_item_measurements (
        item_id, source_set_id, values, fit_preference, taken_on
      ) values (
        v_item_id, v_mset.id, v_mset.values, v_mset.fit_preference, v_mset.taken_on
      );

      update public.order_items set has_snapshot = true where id = v_item_id;
    end if;
  end loop;

  -- 12. Record creation event
  insert into public.order_events (order_id, kind, from_value, to_value, actor_user_id)
  values (v_order_id, 'created', null, 'received', auth.uid());

  -- Record payment event if advance was provided
  if p_advance_pkr > 0 then
    insert into public.order_events (order_id, kind, from_value, to_value, note, actor_user_id)
    values (v_order_id, 'payment_recorded', '0', p_advance_pkr::text, 'Advance recorded at order placement', auth.uid());
  end if;

  -- 13. Create notification for customer
  select user_id into v_cust_user_id from public.customers where id = p_customer_id;
  if v_cust_user_id is not null then
    insert into public.notifications (user_id, kind, data, order_id)
    values (
      v_cust_user_id,
      'order_created',
      jsonb_build_object(
        'order_id', v_order_id,
        'order_seq', v_order_seq,
        'shop_name', v_shop.shop_name,
        'person_label', v_person_label,
        'total_pkr', p_total_pkr,
        'advance_pkr', p_advance_pkr,
        'delivery_date', p_delivery_date
      ),
      v_order_id
    );
  end if;

  return v_order_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. update_order_status (Tailor only)
-- ----------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_order record;
  v_cust_user_id uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  select * into v_order
  from public.orders
  where id = p_order_id and shop_id = v_shop_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found: Order does not exist or does not belong to your shop';
  end if;

  if not public.is_order_open(v_order.status) then
    raise exception 'order_closed: Cannot change status of an order that is already %', v_order.status;
  end if;

  -- Update order status (trigger checks valid pipeline / cancel)
  update public.orders
  set status = p_new_status
  where id = p_order_id;

  -- Record event
  insert into public.order_events (order_id, kind, from_value, to_value, note, actor_user_id)
  values (p_order_id, 'status_changed', v_order.status, p_new_status, nullif(trim(p_note), ''), auth.uid());

  -- Notify customer
  select user_id into v_cust_user_id from public.customers where id = v_order.customer_id;
  if v_cust_user_id is not null then
    insert into public.notifications (user_id, kind, data, order_id)
    values (
      v_cust_user_id,
      'order_status',
      jsonb_build_object(
        'order_id', p_order_id,
        'order_seq', v_order.order_seq,
        'shop_name', v_order.shop_name,
        'from_status', v_order.status,
        'to_status', p_new_status,
        'note', nullif(trim(p_note), '')
      ),
      p_order_id
    );
  end if;

  return true;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. reschedule_order (Tailor only)
-- ----------------------------------------------------------------------------
create or replace function public.reschedule_order(
  p_order_id uuid,
  p_new_date date,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_order record;
  v_today_karachi date;
  v_cust_user_id uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  select * into v_order
  from public.orders
  where id = p_order_id and shop_id = v_shop_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found: Order not found';
  end if;

  if not public.is_order_open(v_order.status) then
    raise exception 'order_closed: Cannot reschedule an order in terminal status %', v_order.status;
  end if;

  v_today_karachi := (now() at time zone 'Asia/Karachi')::date;
  if p_new_date < v_today_karachi then
    raise exception 'delivery_date_invalid: New delivery date cannot be in the past';
  end if;

  update public.orders
  set delivery_date = p_new_date
  where id = p_order_id;

  -- Record event
  insert into public.order_events (order_id, kind, from_value, to_value, note, actor_user_id)
  values (p_order_id, 'delivery_rescheduled', v_order.delivery_date::text, p_new_date::text, nullif(trim(p_note), ''), auth.uid());

  -- Notify customer
  select user_id into v_cust_user_id from public.customers where id = v_order.customer_id;
  if v_cust_user_id is not null then
    insert into public.notifications (user_id, kind, data, order_id)
    values (
      v_cust_user_id,
      'order_rescheduled',
      jsonb_build_object(
        'order_id', p_order_id,
        'order_seq', v_order.order_seq,
        'shop_name', v_order.shop_name,
        'from_date', v_order.delivery_date::text,
        'to_date', p_new_date::text,
        'note', nullif(trim(p_note), '')
      ),
      p_order_id
    );
  end if;

  return true;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. change_order_price (Tailor only)
-- ----------------------------------------------------------------------------
create or replace function public.change_order_price(
  p_order_id uuid,
  p_new_total int,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_order record;
  v_cust_user_id uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  select * into v_order
  from public.orders
  where id = p_order_id and shop_id = v_shop_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found: Order not found';
  end if;

  if not public.is_order_open(v_order.status) then
    raise exception 'order_closed: Cannot change price of an order in terminal status %', v_order.status;
  end if;

  if p_new_total < 1 or p_new_total > 10000000 then
    raise exception 'total_invalid: Total price must be between PKR 1 and PKR 10,000,000';
  end if;

  if p_new_total < v_order.paid_pkr then
    raise exception 'amount_invalid: New total price (PKR %) cannot be less than already paid amount (PKR %)', p_new_total, v_order.paid_pkr;
  end if;

  update public.orders
  set total_pkr = p_new_total
  where id = p_order_id;

  -- Record event
  insert into public.order_events (order_id, kind, from_value, to_value, note, actor_user_id)
  values (p_order_id, 'price_changed', v_order.total_pkr::text, p_new_total::text, nullif(trim(p_note), ''), auth.uid());

  -- Notify customer
  select user_id into v_cust_user_id from public.customers where id = v_order.customer_id;
  if v_cust_user_id is not null then
    insert into public.notifications (user_id, kind, data, order_id)
    values (
      v_cust_user_id,
      'order_price_changed',
      jsonb_build_object(
        'order_id', p_order_id,
        'order_seq', v_order.order_seq,
        'shop_name', v_order.shop_name,
        'from_total', v_order.total_pkr,
        'to_total', p_new_total,
        'note', nullif(trim(p_note), '')
      ),
      p_order_id
    );
  end if;

  return true;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. record_payment (Tailor only, open or delivered orders)
-- ----------------------------------------------------------------------------
create or replace function public.record_payment(
  p_order_id uuid,
  p_amount int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_order record;
  v_new_paid int;
  v_cust_user_id uuid;
begin
  v_shop_id := public.get_caller_shop_id();

  select * into v_order
  from public.orders
  where id = p_order_id and shop_id = v_shop_id
  for update;

  if v_order.id is null then
    raise exception 'order_not_found: Order not found';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'order_closed: Cannot record payment for a cancelled order';
  end if;

  if p_amount <= 0 then
    raise exception 'amount_invalid: Payment amount must be greater than zero';
  end if;

  v_new_paid := v_order.paid_pkr + p_amount;
  if v_new_paid > v_order.total_pkr then
    raise exception 'amount_invalid: Total payments (PKR %) would exceed order total (PKR %)', v_new_paid, v_order.total_pkr;
  end if;

  update public.orders
  set paid_pkr = v_new_paid
  where id = p_order_id;

  -- Record event
  insert into public.order_events (order_id, kind, from_value, to_value, note, actor_user_id)
  values (p_order_id, 'payment_recorded', v_order.paid_pkr::text, v_new_paid::text, 'Payment received: PKR ' || p_amount::text, auth.uid());

  -- Notify customer
  select user_id into v_cust_user_id from public.customers where id = v_order.customer_id;
  if v_cust_user_id is not null then
    insert into public.notifications (user_id, kind, data, order_id)
    values (
      v_cust_user_id,
      'order_payment',
      jsonb_build_object(
        'order_id', p_order_id,
        'order_seq', v_order.order_seq,
        'shop_name', v_order.shop_name,
        'amount_paid', p_amount,
        'total_paid', v_new_paid,
        'balance_remaining', (v_order.total_pkr - v_new_paid)
      ),
      p_order_id
    );
  end if;

  return true;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. mark_notifications_read (Authenticated user, customer or tailor)
-- ----------------------------------------------------------------------------
create or replace function public.mark_notifications_read(
  p_ids uuid[] default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_count int;
begin
  v_uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  );

  if v_uid is null then
    raise exception 'Unauthorized: caller has no authenticated user ID';
  end if;

  if p_ids is null then
    update public.notifications
    set read_at = now()
    where user_id = v_uid and read_at is null;
  else
    update public.notifications
    set read_at = now()
    where user_id = v_uid and id = any(p_ids) and read_at is null;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. shop_dashboard_stats (Tailor only)
-- ----------------------------------------------------------------------------
create or replace function public.shop_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_today_karachi date;
  v_month_start_karachi timestamptz;
  v_stats jsonb;
begin
  v_shop_id := public.get_caller_shop_id();

  v_today_karachi := (now() at time zone 'Asia/Karachi')::date;
  v_month_start_karachi := date_trunc('month', now() at time zone 'Asia/Karachi');

  select jsonb_build_object(
    'received_count', count(*) filter (where status = 'received'),
    'cutting_count', count(*) filter (where status = 'cutting'),
    'stitching_count', count(*) filter (where status = 'stitching'),
    'ready_count', count(*) filter (where status = 'ready'),
    'delivered_count', count(*) filter (where status = 'delivered'),
    'cancelled_count', count(*) filter (where status = 'cancelled'),
    'due_today', count(*) filter (where public.is_order_open(status) and delivery_date = v_today_karachi),
    'due_next_7_days', count(*) filter (where public.is_order_open(status) and delivery_date > v_today_karachi and delivery_date <= (v_today_karachi + 7)),
    'overdue', count(*) filter (where status in ('received', 'cutting', 'stitching') and delivery_date < v_today_karachi),
    'outstanding_balance_pkr', coalesce(sum(total_pkr - paid_pkr) filter (where status <> 'cancelled'), 0),
    'created_this_month', count(*) filter (where created_at >= v_month_start_karachi),
    'delivered_this_month', count(*) filter (where status = 'delivered' and closed_at >= v_month_start_karachi),
    'active_consented_customers', (
      select count(distinct customer_id)
      from public.consents
      where shop_id = v_shop_id
        and status = 'active'
        and revoked_at is null
        and (expires_at is null or expires_at > now())
    )
  ) into v_stats
  from public.orders
  where shop_id = v_shop_id;

  return v_stats;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. REVOKE & GRANT PERMISSIONS ON RPCs
-- ----------------------------------------------------------------------------
revoke all on function public.create_order(uuid, uuid, date, int, int, jsonb) from public, anon;
grant execute on function public.create_order(uuid, uuid, date, int, int, jsonb) to authenticated;

revoke all on function public.update_order_status(uuid, text, text) from public, anon;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

revoke all on function public.reschedule_order(uuid, date, text) from public, anon;
grant execute on function public.reschedule_order(uuid, date, text) to authenticated;

revoke all on function public.change_order_price(uuid, int, text) from public, anon;
grant execute on function public.change_order_price(uuid, int, text) to authenticated;

revoke all on function public.record_payment(uuid, int) from public, anon;
grant execute on function public.record_payment(uuid, int) to authenticated;

revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

revoke all on function public.shop_dashboard_stats() from public, anon;
grant execute on function public.shop_dashboard_stats() to authenticated;

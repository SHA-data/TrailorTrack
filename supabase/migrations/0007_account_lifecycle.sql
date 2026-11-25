-- ============================================================================
-- TailorTrack Migration 0007: Account Lifecycle (Export & Deletion)
-- ============================================================================
-- 1. Updates FK ON DELETE behaviors so customer & tailor deletions cascade or
--    set null cleanly without breaking closed order history.
-- 2. Tightens check_orders_update_rules() for delivered rows (only paid_pkr
--    increase + updated_at) and allows trigger-only ON DELETE SET NULL updates.
-- 3. Narrowly updates append-only / immutability triggers for account deletion
--    (gated by transaction-local GUC AND pg_trigger_depth() > 1).
-- 4. Adds delete_my_account() and export_my_data() SECURITY DEFINER RPCs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FOREIGN KEY & NULLABILITY UPDATES
-- ----------------------------------------------------------------------------

-- 1.1 measurement_sets.shop_id -> ON DELETE SET NULL
alter table public.measurement_sets
  drop constraint if exists measurement_sets_shop_id_fkey;

alter table public.measurement_sets
  add constraint measurement_sets_shop_id_fkey
  foreign key (shop_id)
  references public.tailor_shops(id)
  on delete set null;

-- 1.2 orders.shop_id -> nullable + ON DELETE SET NULL (closed orders stay for customers)
alter table public.orders
  alter column shop_id drop not null;

alter table public.orders
  drop constraint if exists orders_shop_id_fkey;

alter table public.orders
  add constraint orders_shop_id_fkey
  foreign key (shop_id)
  references public.tailor_shops(id)
  on delete set null;

-- 1.3 orders.family_member_id -> single-column FK ON DELETE SET NULL
-- (avoids composite ON DELETE SET NULL trying to null NOT NULL customer_id)
alter table public.orders
  drop constraint if exists fk_orders_family_member;

alter table public.orders
  add constraint fk_orders_family_member
  foreign key (family_member_id)
  references public.family_members(id)
  on delete set null;

-- 1.4 order_events.actor_user_id -> nullable + ON DELETE SET NULL
alter table public.order_events
  alter column actor_user_id drop not null;

alter table public.order_events
  drop constraint if exists order_events_actor_user_id_fkey;

alter table public.order_events
  add constraint order_events_actor_user_id_fkey
  foreign key (actor_user_id)
  references public.profiles(id)
  on delete set null;

-- ----------------------------------------------------------------------------
-- 2. TRIGGER UPDATES FOR SAFE CASCADE & DELIVERED TIGHTENING
-- ----------------------------------------------------------------------------

-- 2.1 measurement_sets immutability: allow shop_id -> null ONLY during account delete cascade
create or replace function public.enforce_measurement_sets_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('tailortrack.allow_account_delete', true) = 'on'
     and pg_trigger_depth() > 1
     and old.shop_id is not null
     and new.shop_id is null
     and new.id = old.id
     and new.customer_id = old.customer_id
     and new.family_member_id is not distinct from old.family_member_id
     and new.garment_type = old.garment_type
     and new.values = old.values
     and new.fit_preference is not distinct from old.fit_preference
     and new.notes is not distinct from old.notes
     and new.source = old.source
     and new.taken_on = old.taken_on
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;

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

-- 2.2 order_events append-only: allow DELETE / actor_user_id -> null ONLY under bypass + trigger depth > 1
create or replace function public.enforce_order_events_append_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('tailortrack.allow_account_delete', true) = 'on'
     and pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;

    if tg_op = 'UPDATE'
       and old.actor_user_id is not null
       and new.actor_user_id is null
       and new.id = old.id
       and new.order_id = old.order_id
       and new.kind = old.kind
       and new.from_value is not distinct from old.from_value
       and new.to_value is not distinct from old.to_value
       and new.note is not distinct from old.note
       and new.created_at = old.created_at then
      return new;
    end if;
  end if;

  raise exception 'order_events is append-only: updates and deletes are prohibited';
end;
$$;

-- 2.3 orders update rules: allow ON DELETE SET NULL on shop_id/consent_id/family_member_id & tighten delivered
create or replace function public.check_orders_update_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_only_immutable_data_unchanged boolean;
begin
  v_only_immutable_data_unchanged := (
    new.id = old.id
    and new.customer_id = old.customer_id
    and new.order_seq = old.order_seq
    and new.person_label = old.person_label
    and new.shop_name = old.shop_name
    and new.shop_city is not distinct from old.shop_city
    and new.shop_phone is not distinct from old.shop_phone
    and new.status = old.status
    and new.total_pkr = old.total_pkr
    and new.paid_pkr = old.paid_pkr
    and new.delivery_date = old.delivery_date
    and new.created_at = old.created_at
    and new.status_changed_at = old.status_changed_at
    and new.closed_at is not distinct from old.closed_at
  );

  -- Allow FK ON DELETE SET NULL from family_members deletion (family_member_id -> null only)
  if pg_trigger_depth() > 0
     and old.family_member_id is not null
     and new.family_member_id is null
     and new.shop_id is not distinct from old.shop_id
     and new.consent_id is not distinct from old.consent_id
     and v_only_immutable_data_unchanged then
    new.updated_at = now();
    return new;
  end if;

  -- Allow FK ON DELETE SET NULL during account deletion (shop_id / consent_id / family_member_id -> null)
  if current_setting('tailortrack.allow_account_delete', true) = 'on'
     and pg_trigger_depth() > 1
     and v_only_immutable_data_unchanged
     and (new.shop_id is null or new.shop_id is not distinct from old.shop_id)
     and (new.consent_id is null or new.consent_id is not distinct from old.consent_id)
     and (new.family_member_id is null or new.family_member_id is not distinct from old.family_member_id)
     and (
       (old.shop_id is not null and new.shop_id is null)
       or (old.consent_id is not null and new.consent_id is null)
       or (old.family_member_id is not null and new.family_member_id is null)
     ) then
    new.updated_at = now();
    return new;
  end if;

  -- Block modification if already cancelled (terminal)
  if old.status = 'cancelled' then
    raise exception 'Cannot modify order in terminal status cancelled';
  end if;

  -- Delivered orders allow ONLY recording an increase in paid_pkr plus updated_at
  if old.status = 'delivered' then
    if new.status <> 'delivered' then
      raise exception 'Cannot modify status of an order that has already been delivered';
    end if;
    if new.paid_pkr <= old.paid_pkr then
      raise exception 'Delivered order only allows increasing paid_pkr';
    end if;
    if new.total_pkr <> old.total_pkr
       or new.delivery_date <> old.delivery_date
       or new.person_label <> old.person_label
       or new.shop_id is distinct from old.shop_id
       or new.customer_id <> old.customer_id
       or new.order_seq <> old.order_seq
       or new.shop_name <> old.shop_name
       or new.shop_city is distinct from old.shop_city
       or new.shop_phone is distinct from old.shop_phone
       or new.consent_id is distinct from old.consent_id
       or new.family_member_id is distinct from old.family_member_id
       or new.created_at <> old.created_at
       or new.status_changed_at <> old.status_changed_at
       or new.closed_at is distinct from old.closed_at then
      raise exception 'Cannot modify details of a delivered order (only payment recording permitted)';
    end if;

    new.updated_at = now();
    return new;
  end if;

  -- Immutable columns across any normal update
  if new.shop_id is distinct from old.shop_id
     or new.customer_id <> old.customer_id
     or new.order_seq <> old.order_seq
     or new.person_label <> old.person_label
     or new.shop_name <> old.shop_name
     or new.shop_city is distinct from old.shop_city
     or new.shop_phone is distinct from old.shop_phone
     or new.consent_id is distinct from old.consent_id
     or new.family_member_id is distinct from old.family_member_id
     or new.created_at <> old.created_at then
    raise exception 'Attempted to modify immutable order attributes';
  end if;

  -- paid_pkr never decreases
  if new.paid_pkr < old.paid_pkr then
    raise exception 'paid_pkr cannot decrease (attempted % -> %)', old.paid_pkr, new.paid_pkr;
  end if;

  -- Validate status transitions when status changes
  if new.status <> old.status then
    if new.status = 'cancelled' then
      if not public.is_order_open(old.status) then
        raise exception 'Cannot cancel order with current status %', old.status;
      end if;
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

    new.status_changed_at = now();
    if new.status in ('delivered', 'cancelled') then
      new.closed_at = now();
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC: delete_my_account()
-- ----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_role text;
  v_customer_id uuid;
  v_shop_id uuid;
  v_has_open boolean;
begin
  v_uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  );

  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select role into v_role
  from public.profiles
  where id = v_uid;

  if v_role is null then
    raise exception 'not_authenticated';
  end if;

  if v_role = 'customer' then
    select id into v_customer_id
    from public.customers
    where user_id = v_uid
    for update;

    if v_customer_id is not null then
      select exists (
        select 1
        from public.orders o
        where o.customer_id = v_customer_id
          and public.is_order_open(o.status)
      ) into v_has_open;

      if v_has_open then
        raise exception 'open_orders_exist';
      end if;
    end if;
  elsif v_role = 'tailor' then
    select id into v_shop_id
    from public.tailor_shops
    where owner_id = v_uid
    for update;

    if v_shop_id is not null then
      select exists (
        select 1
        from public.orders o
        where o.shop_id = v_shop_id
          and public.is_order_open(o.status)
      ) into v_has_open;

      if v_has_open then
        raise exception 'open_orders_exist';
      end if;
    end if;
  end if;

  perform set_config('tailortrack.allow_account_delete', 'on', true);
  delete from auth.users where id = v_uid;
  perform set_config('tailortrack.allow_account_delete', '', true);
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ----------------------------------------------------------------------------
-- 4. RPC: export_my_data()
-- ----------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_role text;
  v_customer_id uuid;
  v_shop_id uuid;
  v_profile jsonb;
  v_result jsonb;
begin
  v_uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  );

  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select jsonb_build_object(
    'full_name', p.full_name,
    'phone', p.phone,
    'role', p.role,
    'created_at', p.created_at
  ), p.role
  into v_profile, v_role
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'not_authenticated';
  end if;

  if v_role = 'customer' then
    select c.id into v_customer_id
    from public.customers c
    where c.user_id = v_uid;

    v_result := jsonb_build_object(
      'exported_at', now(),
      'role', 'customer',
      'profile', v_profile,
      'customer', (
        select jsonb_build_object(
          'city', c.city,
          'fit_category', c.fit_category,
          'preferred_unit', c.preferred_unit,
          'created_at', c.created_at
        )
        from public.customers c
        where c.id = v_customer_id
      ),
      'family_members', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', fm.id,
          'full_name', fm.full_name,
          'relation', fm.relation,
          'fit_category', fm.fit_category,
          'created_at', fm.created_at
        ) order by fm.created_at asc)
        from public.family_members fm
        where fm.customer_id = v_customer_id
      ), '[]'::jsonb),
      'measurement_sets', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ms.id,
          'family_member_id', ms.family_member_id,
          'garment_type', ms.garment_type,
          'values', ms.values,
          'fit_preference', ms.fit_preference,
          'notes', ms.notes,
          'source', ms.source,
          'taken_on', ms.taken_on,
          'created_at', ms.created_at
        ) order by ms.created_at desc)
        from public.measurement_sets ms
        where ms.customer_id = v_customer_id
      ), '[]'::jsonb),
      'consents', coalesce((
        select jsonb_agg(jsonb_build_object(
          'shop_name', ts.shop_name,
          'scopes', cn.scopes,
          'status', cn.status,
          'granted_at', cn.granted_at,
          'expires_at', cn.expires_at,
          'revoked_at', cn.revoked_at,
          'created_at', cn.created_at
        ) order by cn.created_at desc)
        from public.consents cn
        join public.tailor_shops ts on ts.id = cn.shop_id
        where cn.customer_id = v_customer_id
      ), '[]'::jsonb),
      'orders', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', o.id,
          'order_seq', o.order_seq,
          'person_label', o.person_label,
          'shop_name', o.shop_name,
          'shop_city', o.shop_city,
          'shop_phone', o.shop_phone,
          'status', o.status,
          'total_pkr', o.total_pkr,
          'paid_pkr', o.paid_pkr,
          'delivery_date', o.delivery_date,
          'created_at', o.created_at,
          'closed_at', o.closed_at,
          'items', coalesce((
            select jsonb_agg(jsonb_build_object(
              'position', oi.position,
              'garment_type', oi.garment_type,
              'quantity', oi.quantity,
              'fabric_source', oi.fabric_source,
              'fabric_details', oi.fabric_details,
              'fabric_metres', oi.fabric_metres,
              'design_notes', oi.design_notes,
              'measurements', (
                select jsonb_build_object(
                  'values', oim.values,
                  'fit_preference', oim.fit_preference,
                  'taken_on', oim.taken_on
                )
                from public.order_item_measurements oim
                where oim.item_id = oi.id
              )
            ) order by oi.position asc)
            from public.order_items oi
            where oi.order_id = o.id
          ), '[]'::jsonb),
          'events', coalesce((
            select jsonb_agg(jsonb_build_object(
              'kind', oe.kind,
              'from_value', oe.from_value,
              'to_value', oe.to_value,
              'note', oe.note,
              'created_at', oe.created_at
            ) order by oe.created_at asc)
            from public.order_events oe
            where oe.order_id = o.id
          ), '[]'::jsonb)
        ) order by o.created_at desc)
        from public.orders o
        where o.customer_id = v_customer_id
      ), '[]'::jsonb),
      'access_log', coalesce((
        select jsonb_agg(jsonb_build_object(
          'shop_name', ts.shop_name,
          'action', al.action,
          'created_at', al.created_at
        ) order by al.created_at desc)
        from public.access_log al
        join public.tailor_shops ts on ts.id = al.shop_id
        where al.customer_id = v_customer_id
      ), '[]'::jsonb),
      'notifications', coalesce((
        select jsonb_agg(jsonb_build_object(
          'kind', n.kind,
          'data', n.data,
          'read_at', n.read_at,
          'created_at', n.created_at
        ) order by n.created_at desc)
        from public.notifications n
        where n.user_id = v_uid
      ), '[]'::jsonb)
    );
  elsif v_role = 'tailor' then
    select ts.id into v_shop_id
    from public.tailor_shops ts
    where ts.owner_id = v_uid;

    v_result := jsonb_build_object(
      'exported_at', now(),
      'role', 'tailor',
      'profile', v_profile,
      'shop', (
        select jsonb_build_object(
          'shop_name', ts.shop_name,
          'city', ts.city,
          'address', ts.address,
          'phone', ts.phone,
          'created_at', ts.created_at
        )
        from public.tailor_shops ts
        where ts.id = v_shop_id
      ),
      'consents', coalesce((
        select jsonb_agg(jsonb_build_object(
          'customer_first_name', split_part(trim(coalesce(cp.full_name, 'Customer')), ' ', 1),
          'status', cn.status,
          'scopes', cn.scopes,
          'granted_at', cn.granted_at,
          'expires_at', cn.expires_at,
          'revoked_at', cn.revoked_at,
          'created_at', cn.created_at
        ) order by cn.created_at desc)
        from public.consents cn
        join public.customers c on c.id = cn.customer_id
        join public.profiles cp on cp.id = c.user_id
        where cn.shop_id = v_shop_id
      ), '[]'::jsonb),
      'orders', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', o.id,
          'order_seq', o.order_seq,
          'person_label', o.person_label,
          'status', o.status,
          'total_pkr', o.total_pkr,
          'paid_pkr', o.paid_pkr,
          'delivery_date', o.delivery_date,
          'created_at', o.created_at,
          'closed_at', o.closed_at,
          'items', coalesce((
            select jsonb_agg(jsonb_build_object(
              'position', oi.position,
              'garment_type', oi.garment_type,
              'quantity', oi.quantity,
              'fabric_source', oi.fabric_source,
              'fabric_details', oi.fabric_details,
              'fabric_metres', oi.fabric_metres,
              'design_notes', oi.design_notes,
              'measurements', case
                when public.is_order_open(o.status)
                  or public.has_active_consent(o.shop_id, o.customer_id, 'measurements') then (
                  select jsonb_build_object(
                    'values', oim.values,
                    'fit_preference', oim.fit_preference,
                    'taken_on', oim.taken_on
                  )
                  from public.order_item_measurements oim
                  where oim.item_id = oi.id
                )
                else null
              end
            ) order by oi.position asc)
            from public.order_items oi
            where oi.order_id = o.id
          ), '[]'::jsonb),
          'events', coalesce((
            select jsonb_agg(jsonb_build_object(
              'kind', oe.kind,
              'from_value', oe.from_value,
              'to_value', oe.to_value,
              'note', oe.note,
              'created_at', oe.created_at
            ) order by oe.created_at asc)
            from public.order_events oe
            where oe.order_id = o.id
          ), '[]'::jsonb)
        ) order by o.created_at desc)
        from public.orders o
        where o.shop_id = v_shop_id
      ), '[]'::jsonb)
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

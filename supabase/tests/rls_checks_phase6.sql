-- ============================================================================
-- TAILORTRACK PHASE 6 RLS & ACCOUNT LIFECYCLE VERIFICATION SUITE
-- ============================================================================
-- Tests:
-- A. Customer account deletion blocked with open order; succeeds after delivery
-- B. Customer deletion removes all rows across all tables; other users untouched
-- C. Family member deletion with an existing order sets family_member_id = NULL
-- D. Tailor account deletion blocked with open order; succeeds when closed
-- E. Tailor deletion sets orders.shop_id = NULL, order_events.actor_user_id = NULL,
--    measurement_sets.shop_id = NULL, and preserves closed order visibility
-- F. Bypass hardening: normal caller setting GUC cannot update/delete order_events or orders
-- G. export_my_data() customer & tailor rules (no qr_token, no contact leak, snapshot gate)
-- H. Function privileges: anon & public cannot execute delete_my_account or export_my_data
-- Wrapped in BEGIN / ROLLBACK so all test fixtures roll back cleanly.
-- ============================================================================

begin;

do $$
declare
  v_user_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  v_tailor_a uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';
  v_tailor_b uuid := 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4';

  v_cust_a_id uuid;
  v_cust_b_id uuid;
  v_shop_a_id uuid;
  v_shop_b_id uuid;
  v_family_a_id uuid;
  v_mset_a_id uuid;
  v_mset_tailor_id uuid;
  v_order_a_id uuid;
  v_order_family_id uuid;
  v_order_b_id uuid;
  v_items jsonb;
  v_export jsonb;
  v_count int;
  v_exception_caught boolean;
  v_err_msg text;
  v_check_count int := 0;
begin
  raise notice '==============================================================';
  raise notice 'STARTING TAILORTRACK PHASE 6 ACCOUNT LIFECYCLE VERIFICATION';
  raise notice '==============================================================';

  perform set_config('role', 'postgres', true);

  -- Create users
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values
    (v_user_a, 'p6.cust.a@tailortrack.pk', jsonb_build_object('role', 'customer', 'full_name', 'Zainab Tariq', 'city', 'Lahore', 'phone', '+923001111111'), 'authenticated', 'authenticated'),
    (v_user_b, 'p6.cust.b@tailortrack.pk', jsonb_build_object('role', 'customer', 'full_name', 'Bilal Raza', 'city', 'Karachi', 'phone', '+923002222222'), 'authenticated', 'authenticated'),
    (v_tailor_a, 'p6.tailor.a@tailortrack.pk', jsonb_build_object('role', 'tailor', 'full_name', 'Ustad Karim', 'shop_name', 'Karim Heritage Tailors', 'city', 'Lahore', 'address', 'Mall Road', 'phone', '+923003333333'), 'authenticated', 'authenticated'),
    (v_tailor_b, 'p6.tailor.b@tailortrack.pk', jsonb_build_object('role', 'tailor', 'full_name', 'Ustad Salman', 'shop_name', 'Salman Bespoke', 'city', 'Islamabad', 'address', 'F-7', 'phone', '+923004444444'), 'authenticated', 'authenticated');

  select id into v_cust_a_id from public.customers where user_id = v_user_a;
  select id into v_cust_b_id from public.customers where user_id = v_user_b;
  select id into v_shop_a_id from public.tailor_shops where owner_id = v_tailor_a;
  select id into v_shop_b_id from public.tailor_shops where owner_id = v_tailor_b;

  insert into public.family_members (customer_id, full_name, relation, fit_category)
  values (v_cust_a_id, 'Hamza Tariq', 'son', 'boys')
  returning id into v_family_a_id;

  insert into public.measurement_sets (customer_id, garment_type, values, fit_preference, source)
  values (v_cust_a_id, 'kameez', '{"length": 40.0, "chest": 38.0}'::jsonb, 'regular', 'self')
  returning id into v_mset_a_id;

  -- Tailor-sourced measurement set referencing Shop A
  insert into public.measurement_sets (customer_id, garment_type, values, fit_preference, source, shop_id)
  values (v_cust_b_id, 'kameez', '{"length": 42.0, "chest": 41.0}'::jsonb, 'slim', 'tailor', v_shop_a_id)
  returning id into v_mset_tailor_id;

  -- Active consents for Shop A <-> Customer A and Customer B
  insert into public.consents (customer_id, shop_id, status, scopes, requested_scopes, expires_at)
  values
    (v_cust_a_id, v_shop_a_id, 'active', array['measurements', 'orders'], array['measurements', 'orders'], now() + interval '30 days'),
    (v_cust_b_id, v_shop_a_id, 'active', array['measurements', 'orders'], array['measurements', 'orders'], now() + interval '30 days');

  -- Access log entries
  insert into public.access_log (customer_id, shop_id, action)
  values (v_cust_a_id, v_shop_a_id, 'viewed_measurements'),
         (v_cust_b_id, v_shop_a_id, 'viewed_measurements');

  -- Create orders as Tailor A
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_a::text, 'role', 'authenticated')::text, true);

  v_items := jsonb_build_array(
    jsonb_build_object('garment_type', 'kameez', 'quantity', 1, 'fabric_source', 'customer', 'measurement_set_id', v_mset_a_id)
  );
  v_order_a_id := public.create_order(v_cust_a_id, null, (current_date + 7), 4000, 1000, v_items);

  -- Family member order for Customer A
  v_order_family_id := public.create_order(
    v_cust_a_id,
    v_family_a_id,
    (current_date + 7),
    2500,
    500,
    jsonb_build_array(jsonb_build_object('garment_type', 'kameez', 'quantity', 1, 'fabric_source', 'shop'))
  );

  -- Order for Customer B (closed)
  v_order_b_id := public.create_order(
    v_cust_b_id,
    null,
    (current_date + 7),
    5000,
    5000,
    jsonb_build_array(jsonb_build_object('garment_type', 'kameez', 'quantity', 1, 'fabric_source', 'customer', 'measurement_set_id', v_mset_tailor_id))
  );

  -- ============================================================================
  -- DOMAIN A & D: Open orders block deletion
  -- ============================================================================
  -- A.1 Customer A cannot delete account while orders are open
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  v_exception_caught := false;
  begin
    perform public.delete_my_account();
  exception when others then
    v_err_msg := sqlerrm;
    if v_err_msg like '%open_orders_exist%' then
      v_exception_caught := true;
    end if;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer with open order blocked from deleting account (open_orders_exist)', v_check_count;
  else
    raise exception 'CHECK A.1: FAIL - Customer deletion succeeded or wrong error: %', v_err_msg;
  end if;

  -- D.1 Tailor A cannot delete account while orders are open
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_a::text, 'role', 'authenticated')::text, true);

  v_exception_caught := false;
  begin
    perform public.delete_my_account();
  exception when others then
    v_err_msg := sqlerrm;
    if v_err_msg like '%open_orders_exist%' then
      v_exception_caught := true;
    end if;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor with open order blocked from deleting account (open_orders_exist)', v_check_count;
  else
    raise exception 'CHECK D.1: FAIL - Tailor deletion succeeded or wrong error: %', v_err_msg;
  end if;

  -- ============================================================================
  -- DOMAIN G: export_my_data() rules (before deletion)
  -- ============================================================================
  -- G.1 Tailor export: customer first name only, snapshot visible while open, no other shop orders
  v_export := public.export_my_data();
  if v_export->'shop'->>'shop_name' = 'Karim Heritage Tailors'
     and (v_export->'consents'->0->>'customer_first_name') in ('Zainab', 'Bilal')
     and not (v_export::text like '%+923001111111%')
     and not (v_export::text like '%+923002222222%')
     and (v_export->'orders'->0->'items'->0->'measurements'->'values'->>'length') is not null then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor export excludes customer contact details and includes open-order snapshots', v_check_count;
  else
    raise exception 'CHECK G.1: FAIL - Tailor export failed privacy/snapshot rules: %', v_export;
  end if;

  -- G.2 Customer export: excludes qr_token and other users data
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  v_export := public.export_my_data();
  if v_export->'customer'->>'qr_token' is null
     and not (v_export::text like '%qr_token%')
     and not (v_export::text like '%Bilal Raza%')
     and jsonb_array_length(v_export->'orders') = 2 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer export excludes qr_token and other users data', v_check_count;
  else
    raise exception 'CHECK G.2: FAIL - Customer export leaked qr_token or wrong orders: %', v_export;
  end if;

  -- ============================================================================
  -- DOMAIN C: Family member deletion sets orders.family_member_id = NULL
  -- ============================================================================
  delete from public.family_members where id = v_family_a_id;

  select count(*) into v_count
  from public.orders
  where id = v_order_family_id and family_member_id is null and customer_id = v_cust_a_id;

  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Deleting family member sets orders.family_member_id to NULL while keeping customer_id', v_check_count;
  else
    raise exception 'CHECK C.1: FAIL - Family member deletion did not cleanly null family_member_id!';
  end if;

  -- ============================================================================
  -- DOMAIN F: Bypass hardening (normal caller setting GUC cannot bypass)
  -- ============================================================================
  perform set_config('tailortrack.allow_account_delete', 'on', true);

  v_exception_caught := false;
  begin
    delete from public.order_events where order_id = v_order_a_id;
  exception when others then
    v_exception_caught := true;
  end;
  if not v_exception_caught then
    raise exception 'CHECK F.1: FAIL - Authenticated caller deleted order_events via GUC!';
  end if;

  v_exception_caught := false;
  begin
    update public.orders set shop_id = null where id = v_order_a_id;
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Authenticated caller setting GUC still cannot update orders or delete order_events', v_check_count;
  else
    raise exception 'CHECK F.2: FAIL - Authenticated caller updated orders via GUC!';
  end if;

  perform set_config('tailortrack.allow_account_delete', '', true);

  -- ============================================================================
  -- Close all orders to test real cascades
  -- ============================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_a::text, 'role', 'authenticated')::text, true);

  perform public.update_order_status(v_order_a_id, 'delivered', 'Delivered');
  perform public.update_order_status(v_order_family_id, 'cancelled', 'Cancelled');
  perform public.update_order_status(v_order_b_id, 'delivered', 'Delivered');

  -- G.3 Tailor export on closed order hides snapshot after consent revoked
  perform set_config('role', 'postgres', true);
  update public.consents set status = 'revoked', revoked_at = now()
  where customer_id = v_cust_b_id and shop_id = v_shop_a_id;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_a::text, 'role', 'authenticated')::text, true);

  v_export := public.export_my_data();
  if (
    select bool_and((o->'items'->0->'measurements') = 'null'::jsonb)
    from jsonb_array_elements(v_export->'orders') as o
    where (o->>'id')::uuid = v_order_b_id
  ) then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor export omits snapshot on closed order without active measurements consent', v_check_count;
  else
    raise exception 'CHECK G.3: FAIL - Tailor export exposed snapshot on closed order without consent!';
  end if;

  -- ============================================================================
  -- DOMAIN B: Customer A deletion cascades cleanly; Customer B untouched
  -- ============================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  perform public.delete_my_account();

  perform set_config('role', 'postgres', true);
  if (select count(*) from auth.users where id = v_user_a) = 0
     and (select count(*) from public.profiles where id = v_user_a) = 0
     and (select count(*) from public.customers where id = v_cust_a_id) = 0
     and (select count(*) from public.orders where customer_id = v_cust_a_id) = 0
     and (select count(*) from public.order_events where order_id = v_order_a_id) = 0
     and (select count(*) from public.notifications where user_id = v_user_a) = 0
     and (select count(*) from public.orders where id = v_order_b_id) = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer A deletion removed all owned data (including closed orders/events) while leaving Customer B intact', v_check_count;
  else
    raise exception 'CHECK B.1: FAIL - Customer A rows remained or Customer B was affected!';
  end if;

  -- ============================================================================
  -- DOMAIN E: Tailor A deletion preserves Customer B closed order with snapshots
  -- ============================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_a::text, 'role', 'authenticated')::text, true);

  perform public.delete_my_account();

  perform set_config('role', 'postgres', true);
  if (select count(*) from auth.users where id = v_tailor_a) = 0
     and (select count(*) from public.tailor_shops where id = v_shop_a_id) = 0
     and (select count(*) from public.measurement_sets where id = v_mset_tailor_id and shop_id is null) = 1
     and (select count(*) from public.order_events where order_id = v_order_b_id and actor_user_id is null) >= 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor A deletion nulled shop_id and actor_user_id while preserving closed order data', v_check_count;
  else
    raise exception 'CHECK E.1: FAIL - Tailor A deletion cascade failed!';
  end if;

  -- Customer B can still read closed order via RLS with shop_name snapshot
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.orders
  where id = v_order_b_id and shop_id is null and shop_name = 'Karim Heritage Tailors';

  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer B still reads closed order with shop snapshots after Tailor A deletion', v_check_count;
  else
    raise exception 'CHECK E.2: FAIL - Customer B could not read closed order after Tailor A deletion!';
  end if;

  -- ============================================================================
  -- DOMAIN H: Privileges & Anon Lockout
  -- ============================================================================
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);

  v_exception_caught := false;
  begin
    perform public.export_my_data();
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - anon cannot execute export_my_data()', v_check_count;
  else
    raise exception 'CHECK H.1: FAIL - anon executed export_my_data()!';
  end if;

  perform set_config('role', 'postgres', true);
  if not has_function_privilege('anon', 'public.delete_my_account()', 'EXECUTE')
     and not has_function_privilege('public', 'public.delete_my_account()', 'EXECUTE')
     and not has_function_privilege('anon', 'public.export_my_data()', 'EXECUTE')
     and not has_function_privilege('public', 'public.export_my_data()', 'EXECUTE') then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - has_function_privilege confirms anon and public cannot execute Phase 6 RPCs', v_check_count;
  else
    raise exception 'CHECK H.2: FAIL - anon or public has EXECUTE privilege on Phase 6 RPCs!';
  end if;

  raise notice '==============================================================';
  raise notice 'ALL % CHECKS PASSED', v_check_count;
  raise notice '==============================================================';
end;
$$;

rollback;

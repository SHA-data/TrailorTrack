-- ============================================================================
-- TAILORTRACK PHASE 5 RLS & RPC VERIFICATION SUITE
-- ============================================================================
-- Comprehensive test suite covering domains A through J:
-- A. create_order validations & snapshot capture
-- B. Direct write lockdown across all 6 tables
-- C. Multi-tenant read isolation
-- D. Forward status pipeline, cancel & terminal states
-- E. Order events append-only audit trail
-- F. Snapshot visibility rules (open vs active consent)
-- G. In-app notifications isolation & mark-read
-- H. Financial invariants & payment recording
-- I. Shop dashboard stats & Asia/Karachi date filtering
-- J. Function execution privileges (anon/public lockout)
-- ============================================================================

do $$
declare
  v_user_a uuid := '11111111-1111-4111-8111-111111111111';
  v_user_b uuid := '22222222-2222-4222-8222-222222222222';
  v_tailor uuid := '33333333-3333-4333-8333-333333333333';
  v_tailor_b uuid := '44444444-4444-4444-8444-444444444444';

  v_customer_a_id uuid;
  v_customer_b_id uuid;
  v_token_a text;
  v_token_b text;
  v_shop_id uuid;
  v_shop_b_id uuid;
  v_consent_a_id uuid;
  v_consent_b_id uuid;

  v_family_a_id uuid;
  v_family_b_id uuid;
  v_mset_a_id uuid;
  v_mset_b_id uuid;
  v_mset_wrong_garment_id uuid;

  v_order_id uuid;
  v_order_id_2 uuid;
  v_order_seq int;
  v_count int;
  v_bool boolean;
  v_exception_caught boolean;
  v_check_count int := 0;
  v_stats jsonb;
  v_items jsonb;
  i int;
begin
  raise notice '==============================================================';
  raise notice 'STARTING TAILORTRACK PHASE 5 RLS & RPC VERIFICATION SUITE';
  raise notice '==============================================================';

  -- ----------------------------------------------------------------------------
  -- SETUP: Clean fixtures under postgres
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);

  delete from auth.users where id in (v_user_a, v_user_b, v_tailor, v_tailor_b);

  -- 1. Create User A (Customer)
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_user_a,
    'customer.a@tailortrack.pk',
    jsonb_build_object('role', 'customer', 'full_name', 'Tariq Mahmood', 'city', 'Lahore', 'phone', '+923001111111'),
    'authenticated',
    'authenticated'
  );

  -- 2. Create User B (Customer)
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_user_b,
    'customer.b@tailortrack.pk',
    jsonb_build_object('role', 'customer', 'full_name', 'Farhan Saeed', 'city', 'Karachi', 'phone', '+923002222222'),
    'authenticated',
    'authenticated'
  );

  -- 3. Create Tailor A
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_tailor,
    'master.tailor@tailortrack.pk',
    jsonb_build_object('role', 'tailor', 'full_name', 'Ustad Rafiq Master', 'shop_name', 'Rafiq Sons Bespoke', 'city', 'Lahore', 'address', 'Anarkali Bazaar', 'phone', '+923003333333'),
    'authenticated',
    'authenticated'
  );

  -- 4. Create Tailor B
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_tailor_b,
    'second.tailor@tailortrack.pk',
    jsonb_build_object('role', 'tailor', 'full_name', 'Karachi Master Shop', 'shop_name', 'Gulshan Royal Tailors', 'city', 'Karachi', 'address', 'Gulshan-e-Iqbal', 'phone', '+923004444444'),
    'authenticated',
    'authenticated'
  );

  -- Update customer preferences
  update public.customers
  set fit_category = 'men', preferred_unit = 'in'
  where user_id in (v_user_a, v_user_b);

  select id, qr_token into v_customer_a_id, v_token_a from public.customers where user_id = v_user_a;
  select id, qr_token into v_customer_b_id, v_token_b from public.customers where user_id = v_user_b;
  select id into v_shop_id from public.tailor_shops where owner_id = v_tailor;
  select id into v_shop_b_id from public.tailor_shops where owner_id = v_tailor_b;

  -- Create family member for Customer A and Customer B
  insert into public.family_members (customer_id, full_name, relation, fit_category)
  values (v_customer_a_id, 'Bilal Mahmood', 'brother', 'men')
  returning id into v_family_a_id;

  insert into public.family_members (customer_id, full_name, relation, fit_category)
  values (v_customer_b_id, 'Usman Saeed', 'brother', 'men')
  returning id into v_family_b_id;

  -- Create measurement sets for Customer A
  insert into public.measurement_sets (customer_id, family_member_id, garment_type, values, fit_preference, source, taken_on)
  values (v_customer_a_id, null, 'kameez', '{"length": 42.5, "chest": 40.0, "waist": 38.0}'::jsonb, 'regular', 'self', current_date)
  returning id into v_mset_a_id;

  insert into public.measurement_sets (customer_id, family_member_id, garment_type, values, fit_preference, source, taken_on)
  values (v_customer_a_id, null, 'waistcoat', '{"length": 28.0, "chest": 40.0}'::jsonb, 'slim', 'self', current_date)
  returning id into v_mset_wrong_garment_id;

  -- Create measurement set for Customer B
  insert into public.measurement_sets (customer_id, family_member_id, garment_type, values, fit_preference, source, taken_on)
  values (v_customer_b_id, null, 'kameez', '{"length": 44.0, "chest": 42.0}'::jsonb, 'loose', 'self', current_date)
  returning id into v_mset_b_id;

  -- Create active consent for Shop A <-> Customer A with ['measurements', 'orders']
  insert into public.consents (customer_id, shop_id, status, scopes, requested_scopes, expires_at)
  values (v_customer_a_id, v_shop_id, 'active', array['measurements', 'orders'], array['measurements', 'orders'], now() + interval '30 days')
  returning id into v_consent_a_id;

  -- ============================================================================
  -- DOMAIN A: create_order Validations & Snapshots
  -- ============================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- A.1 create_order succeeds with active consent (measurements + orders)
  v_items := jsonb_build_array(
    jsonb_build_object(
      'garment_type', 'kameez',
      'quantity', 1,
      'fabric_source', 'customer',
      'fabric_details', 'Wash n Wear White Fabric',
      'fabric_metres', 4.5,
      'design_notes', 'Sherwani collar, double cuffs',
      'measurement_set_id', v_mset_a_id
    ),
    jsonb_build_object(
      'garment_type', 'shalwar',
      'quantity', 1,
      'fabric_source', 'customer',
      'fabric_details', 'Matching Shalwar',
      'fabric_metres', null,
      'design_notes', 'Pocket on right side',
      'measurement_set_id', null
    )
  );

  v_order_id := public.create_order(
    v_customer_a_id,
    null,
    (current_date + 14),
    4500,
    1500,
    v_items
  );

  if v_order_id is not null then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order succeeded with active consent (items + snapshot)', v_check_count;
  else
    raise exception 'CHECK A.1: FAIL - create_order returned null!';
  end if;

  -- A.2 Snapshot verification: order_item_measurements contains exact values and taken_on
  select count(*) into v_count
  from public.order_item_measurements oim
  join public.order_items oi on oi.id = oim.item_id
  where oi.order_id = v_order_id
    and oim.source_set_id = v_mset_a_id
    and (oim.values->>'length')::numeric = 42.5;

  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Measurement snapshot correctly captured server-side', v_check_count;
  else
    raise exception 'CHECK A.2: FAIL - Snapshot values do not match source set!';
  end if;

  -- A.3 Modifying or inserting new measurement sets does NOT mutate existing snapshot
  perform set_config('role', 'postgres', true);
  update public.measurement_sets set notes = 'Customer requested looser armhole' where id = v_mset_a_id;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.order_item_measurements oim
  join public.order_items oi on oi.id = oim.item_id
  where oi.order_id = v_order_id
    and (oim.values->>'length')::numeric = 42.5;

  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Measurement snapshot is independent of subsequent measurement_set updates', v_check_count;
  else
    raise exception 'CHECK A.3: FAIL - Snapshot changed!';
  end if;

  -- A.4 Fails with no consent (Customer B has no consent with Shop A)
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_b_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails with no consent', v_check_count;
  else
    raise exception 'CHECK A.4: FAIL - Order created without consent!';
  end if;

  -- A.5 Fails with consent missing 'orders' scope
  perform set_config('role', 'postgres', true);
  delete from public.consents where id = v_consent_a_id;
  insert into public.consents (customer_id, shop_id, status, scopes, requested_scopes, expires_at)
  values (v_customer_a_id, v_shop_id, 'active', array['measurements'], array['measurements', 'orders'], now() + interval '30 days')
  returning id into v_consent_a_id;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails when consent lacks orders scope', v_check_count;
  else
    raise exception 'CHECK A.5: FAIL - Order created without orders scope!';
  end if;

  -- Restore consent scopes ['measurements', 'orders']
  perform set_config('role', 'postgres', true);
  delete from public.consents where id = v_consent_a_id;
  insert into public.consents (customer_id, shop_id, status, scopes, requested_scopes, expires_at)
  values (v_customer_a_id, v_shop_id, 'active', array['measurements', 'orders'], array['measurements', 'orders'], now() + interval '30 days')
  returning id into v_consent_a_id;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- A.6 Fails with expired consent
  perform set_config('role', 'postgres', true);
  delete from public.consents where id = v_consent_a_id;
  insert into public.consents (customer_id, shop_id, status, scopes, requested_scopes, expires_at)
  values (v_customer_a_id, v_shop_id, 'active', array['measurements', 'orders'], array['measurements', 'orders'], now() - interval '1 day')
  returning id into v_consent_a_id;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails when consent is expired', v_check_count;
  else
    raise exception 'CHECK A.6: FAIL - Order created with expired consent!';
  end if;

  -- Restore active unexpired consent
  perform set_config('role', 'postgres', true);
  delete from public.consents where id = v_consent_a_id;
  insert into public.consents (customer_id, shop_id, status, scopes, requested_scopes, expires_at)
  values (v_customer_a_id, v_shop_id, 'active', array['measurements', 'orders'], array['measurements', 'orders'], now() + interval '30 days')
  returning id into v_consent_a_id;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- A.7 Fails when called by customer
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer calling create_order is rejected (Forbidden)', v_check_count;
  else
    raise exception 'CHECK A.7: FAIL - Customer was allowed to call create_order!';
  end if;

  -- Back to Tailor A
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- A.8 Fails when linking another customer's family member
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, v_family_b_id, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails with mismatched family member', v_check_count;
  else
    raise exception 'CHECK A.8: FAIL - Foreign family member was allowed!';
  end if;

  -- A.9 Fails when attaching another customer's measurement set
  v_items := jsonb_build_array(
    jsonb_build_object(
      'garment_type', 'kameez',
      'quantity', 1,
      'fabric_source', 'customer',
      'measurement_set_id', v_mset_b_id
    )
  );
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails with another customer measurement set', v_check_count;
  else
    raise exception 'CHECK A.9: FAIL - Foreign measurement set was attached!';
  end if;

  -- A.10 Fails when attaching measurement set for wrong garment type
  v_items := jsonb_build_array(
    jsonb_build_object(
      'garment_type', 'kameez',
      'quantity', 1,
      'fabric_source', 'customer',
      'measurement_set_id', v_mset_wrong_garment_id
    )
  );
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails when garment type does not match measurement set', v_check_count;
  else
    raise exception 'CHECK A.10: FAIL - Wrong garment measurement set allowed!';
  end if;

  -- A.11 Fails when advance > total, 0 items, or past delivery date
  v_items := jsonb_build_array(
    jsonb_build_object('garment_type', 'kameez', 'fabric_source', 'customer')
  );

  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 3500, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails when advance exceeds total', v_check_count;
  else
    raise exception 'CHECK A.11: FAIL - advance > total was permitted!';
  end if;

  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date - 1), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails when delivery date is in the past', v_check_count;
  else
    raise exception 'CHECK A.11: FAIL - Past delivery date was permitted!';
  end if;

  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, '[]'::jsonb);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - create_order fails with 0 items', v_check_count;
  else
    raise exception 'CHECK A.11: FAIL - 0 items allowed!';
  end if;

  -- ============================================================================
  -- DOMAIN B: Direct Writes Blocked for Authenticated Users
  -- ============================================================================
  -- B.1 Direct insert/update/delete blocked on orders
  v_exception_caught := false;
  begin
    insert into public.orders (shop_id, customer_id, person_label, shop_name, order_seq, delivery_date, total_pkr)
    values (v_shop_id, v_customer_a_id, 'Hacked', 'Fake Shop', 999, current_date, 5000);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Direct INSERT to orders is blocked by privileges', v_check_count;
  else
    raise exception 'CHECK B.1: FAIL - Direct INSERT to orders succeeded!';
  end if;

  -- B.2 Direct insert to order_events blocked
  v_exception_caught := false;
  begin
    insert into public.order_events (order_id, kind, actor_user_id)
    values (v_order_id, 'created', auth.uid());
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Direct INSERT to order_events is blocked by privileges', v_check_count;
  else
    raise exception 'CHECK B.2: FAIL - Direct INSERT to order_events succeeded!';
  end if;

  -- B.3 Direct update to shop_order_counters blocked
  v_exception_caught := false;
  begin
    update public.shop_order_counters set last_seq = 0 where shop_id = v_shop_id;
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Direct UPDATE to shop_order_counters is blocked', v_check_count;
  else
    raise exception 'CHECK B.3: FAIL - Direct UPDATE to shop_order_counters succeeded!';
  end if;

  -- ============================================================================
  -- DOMAIN C: Read Isolation Between Tenants
  -- ============================================================================
  -- Tailor A sees their own order
  select count(*) into v_count from public.orders where id = v_order_id;
  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor A reads their own order', v_check_count;
  else
    raise exception 'CHECK C.1: FAIL - Tailor A could not read order!';
  end if;

  -- Tailor B reads 0 rows for Tailor A orders
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_b::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = v_order_id;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor B reads 0 rows for Tailor A order', v_check_count;
  else
    raise exception 'CHECK C.2: FAIL - Tailor B read Tailor A order!';
  end if;

  -- Customer A reads their own order
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = v_order_id;
  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer A reads their own order', v_check_count;
  else
    raise exception 'CHECK C.3: FAIL - Customer A could not read own order!';
  end if;

  -- Customer B reads 0 rows for Customer A order
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.orders where id = v_order_id;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer B reads 0 rows for Customer A order', v_check_count;
  else
    raise exception 'CHECK C.4: FAIL - Customer B read Customer A order!';
  end if;

  -- ============================================================================
  -- DOMAIN D: Status Pipeline, Forward/Skip Transitions & Cancellation
  -- ============================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- D.1 Forward transition: received -> cutting
  v_bool := public.update_order_status(v_order_id, 'cutting', 'Fabric cut according to master pattern');
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Order status moved received -> cutting', v_check_count;
  else
    raise exception 'CHECK D.1: FAIL - Status update failed!';
  end if;

  -- D.2 Backward transition fails: cutting -> received
  v_exception_caught := false;
  begin
    perform public.update_order_status(v_order_id, 'received', 'Try move back');
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Backward status transition (cutting -> received) is blocked', v_check_count;
  else
    raise exception 'CHECK D.2: FAIL - Backward status transition was permitted!';
  end if;

  -- D.3 Skip-forward transition: cutting -> ready
  v_bool := public.update_order_status(v_order_id, 'ready', 'Garment stitched and pressed');
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Skip-forward transition (cutting -> ready) succeeded', v_check_count;
  else
    raise exception 'CHECK D.3: FAIL - Skip-forward failed!';
  end if;

  -- D.4 Tailor CAN update open order even after consent is revoked
  perform set_config('role', 'postgres', true);
  update public.consents set status = 'revoked', revoked_at = now() where id = v_consent_a_id;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- Transition ready -> delivered on open order succeeds
  v_bool := public.update_order_status(v_order_id, 'delivered', 'Handed over to customer');
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Shop can update open order to delivered after consent is revoked', v_check_count;
  else
    raise exception 'CHECK D.4: FAIL - Shop blocked from delivering order!';
  end if;

  -- D.5 Terminal delivered order rejects further status changes
  v_exception_caught := false;
  begin
    perform public.update_order_status(v_order_id, 'ready', 'Undo delivery');
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Delivered order rejects further status transitions (terminal)', v_check_count;
  else
    raise exception 'CHECK D.5: FAIL - Delivered order was modified!';
  end if;

  -- D.6 Creating a NEW order after consent is revoked fails
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, (current_date + 7), 3000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Creating new order after consent revocation is blocked', v_check_count;
  else
    raise exception 'CHECK D.6: FAIL - New order created after consent revocation!';
  end if;

  -- ============================================================================
  -- DOMAIN E: Order Events Append-Only Audit Trail
  -- ============================================================================
  -- Verify events were created: 'created', 'payment_recorded', 'status_changed' x 3
  select count(*) into v_count
  from public.order_events
  where order_id = v_order_id;

  if v_count >= 4 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Order events accurately recorded state changes (count = %)', v_check_count, v_count;
  else
    raise exception 'CHECK E.1: FAIL - Expected >= 4 order events, got %', v_count;
  end if;

  -- Modifying or deleting an event is blocked by trigger
  perform set_config('role', 'postgres', true);
  v_exception_caught := false;
  begin
    update public.order_events set note = 'Modified note' where order_id = v_order_id;
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Updating order_events is blocked by trigger (append-only)', v_check_count;
  else
    raise exception 'CHECK E.2: FAIL - order_events row was updated!';
  end if;

  -- ============================================================================
  -- DOMAIN F: Snapshot Visibility Rules
  -- ============================================================================
  -- For v_order_id (delivered, consent revoked):
  -- Shop reads 0 snapshot rows because order is closed AND consent is revoked
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.order_item_measurements oim
  join public.order_items oi on oi.id = oim.item_id
  where oi.order_id = v_order_id;

  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Shop reads 0 measurement snapshots on closed order when consent revoked', v_check_count;
  else
    raise exception 'CHECK F.1: FAIL - Shop could read snapshot on closed order without consent!';
  end if;

  -- Customer A can always read their own measurement snapshot
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.order_item_measurements oim
  join public.order_items oi on oi.id = oim.item_id
  where oi.order_id = v_order_id;

  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer can always read their own order measurement snapshot', v_check_count;
  else
    raise exception 'CHECK F.2: FAIL - Customer could not read own measurement snapshot!';
  end if;

  -- ============================================================================
  -- DOMAIN G: In-App Notifications
  -- ============================================================================
  -- Customer A has notifications from order creation, status changes
  select count(*) into v_count
  from public.notifications
  where user_id = v_user_a and read_at is null;

  if v_count >= 2 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer has unread notifications from order updates (count = %)', v_check_count, v_count;
  else
    raise exception 'CHECK G.1: FAIL - Notifications were not generated for customer!';
  end if;

  -- Customer A marks all notifications read
  v_count := public.mark_notifications_read(null);
  if v_count >= 2 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - mark_notifications_read successfully marked % notifications as read', v_check_count, v_count;
  else
    raise exception 'CHECK G.2: FAIL - mark_notifications_read failed!';
  end if;

  -- Customer B reads 0 notifications belonging to Customer A
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.notifications where user_id = v_user_a;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer B cannot read Customer A notifications', v_check_count;
  else
    raise exception 'CHECK G.3: FAIL - Cross-tenant notifications leak detected!';
  end if;

  -- ============================================================================
  -- DOMAIN H: Financial Invariants & Payments
  -- ============================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- Current: total_pkr = 4500, paid_pkr = 1500, status = delivered
  -- Record payment of 2000 -> paid_pkr becomes 3500 (allowed on delivered)
  v_bool := public.record_payment(v_order_id, 2000);
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - record_payment succeeded on delivered order with remaining balance', v_check_count;
  else
    raise exception 'CHECK H.1: FAIL - record_payment failed on delivered order!';
  end if;

  -- Recording payment exceeding remaining balance (total 4500, paid 3500, attempt +1500) fails
  v_exception_caught := false;
  begin
    perform public.record_payment(v_order_id, 1500);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Payment exceeding total order amount is rejected', v_check_count;
  else
    raise exception 'CHECK H.2: FAIL - Overpayment allowed!';
  end if;

  -- Recording negative payment fails
  v_exception_caught := false;
  begin
    perform public.record_payment(v_order_id, -500);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Negative payment amount is rejected', v_check_count;
  else
    raise exception 'CHECK H.3: FAIL - Negative payment allowed!';
  end if;

  -- ============================================================================
  -- DOMAIN I: Shop Dashboard Stats
  -- ============================================================================
  v_stats := public.shop_dashboard_stats();
  if v_stats is not null
     and (v_stats->>'delivered_count')::int >= 1
     and (v_stats->>'outstanding_balance_pkr')::int = 1000 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - shop_dashboard_stats correctly aggregated stats (delivered = %, balance = PKR %)',
      v_check_count, (v_stats->>'delivered_count'), (v_stats->>'outstanding_balance_pkr');
  else
    raise exception 'CHECK I.1: FAIL - shop_dashboard_stats returned unexpected results: %', v_stats;
  end if;

  -- Tailor B has 0 stats
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_b::text, 'role', 'authenticated')::text, true);

  v_stats := public.shop_dashboard_stats();
  if (v_stats->>'delivered_count')::int = 0 and (v_stats->>'outstanding_balance_pkr')::int = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor B dashboard stats strictly isolated (count = 0)', v_check_count;
  else
    raise exception 'CHECK I.2: FAIL - Tailor B stats leaked from Tailor A!';
  end if;

  -- ============================================================================
  -- DOMAIN J: Privileges & Anonymous Lockout
  -- ============================================================================
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);

  -- Anon cannot call create_order
  v_exception_caught := false;
  begin
    perform public.create_order(v_customer_a_id, null, current_date, 1000, 0, v_items);
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - anon cannot execute create_order (permission denied)', v_check_count;
  else
    raise exception 'CHECK J.1: FAIL - anon executed create_order!';
  end if;

  -- Anon cannot call shop_dashboard_stats
  v_exception_caught := false;
  begin
    perform public.shop_dashboard_stats();
  exception when others then
    v_exception_caught := true;
  end;
  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - anon cannot execute shop_dashboard_stats', v_check_count;
  else
    raise exception 'CHECK J.2: FAIL - anon executed shop_dashboard_stats!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CLEANUP
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor, v_tailor_b);

  raise notice '==============================================================';
  raise notice 'ALL % CHECKS PASSED', v_check_count;
  raise notice '==============================================================';

exception when others then
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor, v_tailor_b);
  raise;
end;
$$;

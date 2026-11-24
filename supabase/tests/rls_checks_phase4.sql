-- ============================================================================
-- TAILORTRACK PHASE 4 RLS & RPC VERIFICATION SUITE (UPDATED)
-- ============================================================================
-- Tests complete zero-knowledge passport lookup, rate limiting, decline cooldown,
-- consent state machine, scope granular isolation, access audit logging,
-- and anonymous role lockout.
-- Impersonation simulates PostgREST behavior by populating request.jwt.claims
-- with 'sub' and 'role' alongside request.jwt.claim.sub and role.
-- Uses a dynamic counter to report exact pass count.
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

  v_consent_id uuid;
  v_lookup_result jsonb;
  v_customer_detail jsonb;
  v_consent_status jsonb;
  v_count int;
  v_bool boolean;
  v_exception_caught boolean;
  v_check_count int := 0;
  i int;
begin
  raise notice '==============================================================';
  raise notice 'STARTING TAILORTRACK PHASE 4 RLS & RPC VERIFICATION SUITE';
  raise notice '==============================================================';

  -- ----------------------------------------------------------------------------
  -- SETUP: Create clean fixtures under postgres
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

  -- Update customer preferences populated after onboarding
  update public.customers
  set fit_category = 'men', preferred_unit = 'in'
  where user_id in (v_user_a, v_user_b);

  -- Fetch generated IDs and tokens
  select id, qr_token into v_customer_a_id, v_token_a from public.customers where user_id = v_user_a;
  select id, qr_token into v_customer_b_id, v_token_b from public.customers where user_id = v_user_b;
  select id into v_shop_id from public.tailor_shops where owner_id = v_tailor;
  select id into v_shop_b_id from public.tailor_shops where owner_id = v_tailor_b;

  -- Insert a measurement set and family member for Customer A to verify scope enforcement
  insert into public.measurement_sets (customer_id, garment_type, values, source)
  values (v_customer_a_id, 'kameez', '{"length": 42.0, "chest": 40.5}'::jsonb, 'self');

  insert into public.family_members (customer_id, full_name, relation, fit_category)
  values (v_customer_a_id, 'Bilal Mahmood', 'brother', 'men');

  -- ----------------------------------------------------------------------------
  -- CHECK 1: lookup_passport returns masked name + relationship, never customer_id
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- 1.1 Valid token lookup
  v_lookup_result := public.lookup_passport(v_token_a);
  if v_lookup_result is not null
     and (v_lookup_result->>'masked_name') = 'Tariq M.'
     and (v_lookup_result->>'status') = 'none'
     and not (v_lookup_result ? 'customer_id') then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - lookup_passport returned masked name ("%") and status ("none") with zero customer_id', v_check_count, (v_lookup_result->>'masked_name');
  else
    raise exception 'CHECK 1.1: FAIL - lookup_passport returned unexpected payload: %', v_lookup_result;
  end if;

  -- 1.2 Invalid token returns null and logs failure
  v_lookup_result := public.lookup_passport('completely_invalid_token_xyz');
  if v_lookup_result is null then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - lookup_passport returned null for invalid token', v_check_count;
  else
    raise exception 'CHECK 1.2: FAIL - lookup_passport did not return null for invalid token!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 2: Rate limit throttle (15 failed lookups blocks the 16th)
  -- ----------------------------------------------------------------------------
  -- We already have 1 failure from 1.2. Add 14 more failures to reach 15.
  for i in 1..14 loop
    v_lookup_result := public.lookup_passport('invalid_token_' || i);
  end loop;

  -- The 16th attempt should be rejected by the throttle trigger
  v_exception_caught := false;
  begin
    v_lookup_result := public.lookup_passport('invalid_token_16');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - 16th lookup attempt was rate-limited (throttle enforced)', v_check_count;
  else
    raise exception 'CHECK 2.1: FAIL - 16th lookup was not blocked by throttle!';
  end if;

  -- Clean up throttle logs so subsequent checks can proceed
  perform set_config('role', 'postgres', true);
  delete from public.qr_lookup_attempts where shop_id = v_shop_id;

  -- 2.2 Calling lookup_passport as customer raises Forbidden
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
  v_exception_caught := false;
  begin
    perform public.lookup_passport(v_token_b);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer cannot call lookup_passport', v_check_count;
  else
    raise exception 'CHECK 2.2: FAIL - Customer was allowed to call lookup_passport!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 3: request_access creates pending consent with scopes
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  v_consent_id := public.request_access(v_token_a, array['measurements', 'orders']);
  if v_consent_id is not null then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor created pending consent for own shop', v_check_count;
  else
    raise exception 'CHECK 3.1: FAIL - request_access failed to create consent!';
  end if;

  -- Duplicate request while pending should raise exception
  v_exception_caught := false;
  begin
    perform public.request_access(v_token_a, array['measurements']);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Duplicate request while pending is blocked', v_check_count;
  else
    raise exception 'CHECK 3.2: FAIL - Duplicate request was allowed while pending!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 4: Customer responds to consent (Decline & 3-Day Cooldown)
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  -- Customer declines request
  v_bool := public.respond_to_consent(v_consent_id, 'decline', null, 30);
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer declined consent', v_check_count;
  else
    raise exception 'CHECK 4.1: FAIL - Customer could not decline consent!';
  end if;

  -- Direct update or modification of declined status must fail (terminal state)
  v_exception_caught := false;
  begin
    perform set_config('role', 'postgres', true);
    update public.consents set status = 'active' where id = v_consent_id;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - State machine blocked reviving declined consent', v_check_count;
  else
    raise exception 'CHECK 4.2: FAIL - Declined consent was updated to active!';
  end if;

  -- Tailor re-requesting within 3 days is blocked by decline cooldown
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);
  v_exception_caught := false;
  begin
    perform public.request_access(v_token_a, array['measurements']);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - 3-day decline cooldown blocked new request', v_check_count;
  else
    raise exception 'CHECK 4.3: FAIL - Cooldown was bypassed!';
  end if;

  -- Test genuine cooldown expiration with a separate pre-declined row:
  -- Since trg_consents_state_machine is a BEFORE UPDATE trigger, inserting directly with
  -- status = 'declined' and responded_at = now() - interval '4 days' does not trip update rules.
  perform set_config('role', 'postgres', true);
  insert into public.consents (customer_id, shop_id, status, requested_scopes, scopes, responded_at)
  values (v_customer_b_id, v_shop_id, 'declined', array['measurements', 'orders'], array['measurements', 'orders'], now() - interval '4 days');

  -- Tailor requests access for Customer B (whose cooldown is expired) -> must succeed!
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);
  v_consent_id := public.request_access(v_token_b, array['measurements', 'orders']);
  if v_consent_id is not null then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Separate pre-declined row older than 3 days allows new request', v_check_count;
  else
    raise exception 'CHECK 4.4: FAIL - Request after cooldown expiration failed!';
  end if;

  -- Fast-forward Customer A by clearing the recent decline and creating a new pending request
  perform set_config('role', 'postgres', true);
  delete from public.consents where customer_id = v_customer_a_id and shop_id = v_shop_id;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);
  v_consent_id := public.request_access(v_token_a, array['measurements', 'orders']);

  -- Customer A attempts to approve with invalid scope (not requested: 'saved_looks')
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
  v_exception_caught := false;
  begin
    perform public.respond_to_consent(v_consent_id, 'approve', array['saved_looks'], 30);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Approving unrequested scope was rejected', v_check_count;
  else
    raise exception 'CHECK 4.5: FAIL - Scope widening was allowed!';
  end if;

  -- Customer A attempts to approve with invalid duration (e.g. 500 days)
  v_exception_caught := false;
  begin
    perform public.respond_to_consent(v_consent_id, 'approve', array['measurements'], 500);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Expiry duration > 365 days was rejected', v_check_count;
  else
    raise exception 'CHECK 4.6: FAIL - Invalid duration was allowed!';
  end if;

  -- Customer A approves valid subset: ['measurements'] for 30 days
  v_bool := public.respond_to_consent(v_consent_id, 'approve', array['measurements'], 30);
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer approved subset scope for 30 days', v_check_count;
  else
    raise exception 'CHECK 4.7: FAIL - Valid approval failed!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 5: Cross-customer isolation (Customer B cannot touch Customer A consent)
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);

  v_exception_caught := false;
  begin
    perform public.revoke_consent(v_consent_id);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer B cannot revoke Customer A consent', v_check_count;
  else
    raise exception 'CHECK 5.1: FAIL - Customer B revoked Customer A consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 6: Tailor cannot approve or decline consent
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  v_exception_caught := false;
  begin
    perform public.respond_to_consent(v_consent_id, 'approve', array['measurements'], 30);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor cannot call respond_to_consent', v_check_count;
  else
    raise exception 'CHECK 6.1: FAIL - Tailor called respond_to_consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 7: Tailor reads active consent status & customer detail
  -- ----------------------------------------------------------------------------
  v_consent_status := public.my_consent_status(v_consent_id);
  if v_consent_status is not null
     and (v_consent_status->>'status') = 'active'
     and (v_consent_status->>'customer_id') = v_customer_a_id::text then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - my_consent_status returned active status and customer_id', v_check_count;
  else
    raise exception 'CHECK 7.1: FAIL - my_consent_status returned unexpected status: %', v_consent_status;
  end if;

  -- list_my_consented_customers includes Customer A
  select count(*) into v_count from public.list_my_consented_customers();
  if v_count >= 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - list_my_consented_customers returned active customer(s)', v_check_count;
  else
    raise exception 'CHECK 7.2: FAIL - list_my_consented_customers returned 0 rows!';
  end if;

  -- get_consented_customer returns profile data
  v_customer_detail := public.get_consented_customer(v_customer_a_id);
  if v_customer_detail is not null
     and (v_customer_detail->>'full_name') = 'Tariq Mahmood'
     and (v_customer_detail->>'phone') = '+923001111111'
     and (v_customer_detail->>'city') = 'Lahore' then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - get_consented_customer returned full details under active consent', v_check_count;
  else
    raise exception 'CHECK 7.3: FAIL - get_consented_customer failed or returned incorrect data: %', v_customer_detail;
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 8: Access audit logging (30-min de-duplication)
  -- ----------------------------------------------------------------------------
  -- Calling get_consented_customer again immediately must NOT write a second log entry
  perform public.get_consented_customer(v_customer_a_id);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.access_log
  where customer_id = v_customer_a_id
    and shop_id = v_shop_id
    and action = 'viewed_profile';

  if v_count = 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - access_log recorded exactly 1 entry (30-min de-duplication verified)', v_check_count;
  else
    raise exception 'CHECK 8.1: FAIL - access_log recorded % entries instead of 1!', v_count;
  end if;

  -- Direct client INSERT to access_log is blocked by RLS
  v_exception_caught := false;
  begin
    insert into public.access_log (customer_id, shop_id, action)
    values (v_customer_a_id, v_shop_id, 'fake_action');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Direct client INSERT to access_log is blocked', v_check_count;
  else
    raise exception 'CHECK 8.2: FAIL - Direct client INSERT to access_log succeeded!';
  end if;

  -- Customer B cannot read Customer A access logs
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.access_log
  where customer_id = v_customer_a_id;

  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Customer B cannot read Customer A access logs', v_check_count;
  else
    raise exception 'CHECK 8.3: FAIL - Customer B read Customer A access logs!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 9: Scope & Expiry Matrix on Measurements and Family Members
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  -- Tailor logs measurement view
  v_bool := public.log_measurement_view(v_customer_a_id, 'viewed_measurements');
  if v_bool = true then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - log_measurement_view succeeded with active measurements scope', v_check_count;
  else
    raise exception 'CHECK 9.1: FAIL - log_measurement_view failed!';
  end if;

  -- 9.2 Tailor reads Customer A measurements via RLS policy (active consent has 'measurements')
  select count(*) into v_count
  from public.measurement_sets
  where customer_id = v_customer_a_id;

  if v_count >= 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor with active measurement consent reads measurement sets', v_check_count;
  else
    raise exception 'CHECK 9.2: FAIL - Tailor could not read measurement sets!';
  end if;

  -- 9.3 Tailor reads Customer A family members via RLS policy (active consent has 'measurements')
  select count(*) into v_count
  from public.family_members
  where customer_id = v_customer_a_id;

  if v_count >= 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor with active measurement consent reads family members', v_check_count;
  else
    raise exception 'CHECK 9.3: FAIL - Tailor could not read family members!';
  end if;

  -- 9.4 Tailor B (no consent) reads 0 measurement sets and 0 family members
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_b::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count
  from public.measurement_sets
  where customer_id = v_customer_a_id;

  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor B with NO consent reads 0 measurement sets', v_check_count;
  else
    raise exception 'CHECK 9.4: FAIL - Tailor B read measurement sets without consent!';
  end if;

  select count(*) into v_count
  from public.family_members
  where customer_id = v_customer_a_id;

  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Tailor B with NO consent reads 0 family members', v_check_count;
  else
    raise exception 'CHECK 9.5: FAIL - Tailor B read family members without consent!';
  end if;

  -- 9.5 Scope matrix: consent with ONLY 'orders' scope cannot read measurements or family members
  perform set_config('role', 'postgres', true);
  update public.consents
  set scopes = array['orders']
  where id = v_consent_id;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.measurement_sets where customer_id = v_customer_a_id;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Consent with ONLY orders scope cannot read measurement_sets', v_check_count;
  else
    raise exception 'CHECK 9.6: FAIL - Orders-only consent allowed reading measurement sets!';
  end if;

  select count(*) into v_count from public.family_members where customer_id = v_customer_a_id;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Consent with ONLY orders scope cannot read family_members', v_check_count;
  else
    raise exception 'CHECK 9.7: FAIL - Orders-only consent allowed reading family members!';
  end if;

  -- 9.6 Expiry matrix: expired consent (status active, expires_at in the past) cannot read measurements or family members
  perform set_config('role', 'postgres', true);
  update public.consents
  set scopes = array['measurements', 'orders'],
      expires_at = now() - interval '1 hour'
  where id = v_consent_id;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.measurement_sets where customer_id = v_customer_a_id;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Expired active consent cannot read measurement_sets', v_check_count;
  else
    raise exception 'CHECK 9.8: FAIL - Expired consent allowed reading measurement sets!';
  end if;

  select count(*) into v_count from public.family_members where customer_id = v_customer_a_id;
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Expired active consent cannot read family_members', v_check_count;
  else
    raise exception 'CHECK 9.9: FAIL - Expired consent allowed reading family members!';
  end if;

  -- Restore active consent for revocation and rotation tests
  perform set_config('role', 'postgres', true);
  update public.consents
  set scopes = array['measurements', 'orders'],
      expires_at = now() + interval '30 days'
  where id = v_consent_id;

  -- ----------------------------------------------------------------------------
  -- CHECK 10: Token rotation invalidates old QR while existing consent remains active
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  -- Customer A rotates QR token
  perform public.rotate_my_qr_token();

  -- Tailor attempts to lookup using old token -> returns null
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  v_lookup_result := public.lookup_passport(v_token_a);
  if v_lookup_result is null then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Old QR token returned null after rotation', v_check_count;
  else
    raise exception 'CHECK 10.1: FAIL - Old QR token still returned customer data after rotation!';
  end if;

  -- Clean up throttle logs from rotation test
  perform set_config('role', 'postgres', true);
  delete from public.qr_lookup_attempts where shop_id = v_shop_id;

  -- Existing active consent remains valid after rotation
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.list_my_consented_customers();
  if v_count >= 1 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Existing active consent remains valid after token rotation', v_check_count;
  else
    raise exception 'CHECK 10.2: FAIL - Existing consent was lost after token rotation!';
  end if;

  -- Customer A revokes consent
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
  perform public.revoke_consent(v_consent_id);

  -- Tailor now reads 0 customers from list_my_consented_customers
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.list_my_consented_customers();
  if v_count = 0 then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - Revoked consent immediately removes tailor access', v_check_count;
  else
    raise exception 'CHECK 10.3: FAIL - Tailor still had access after revocation!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 11: Anonymous role is blocked from calling any of these RPCs
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);

  v_exception_caught := false;
  begin
    perform public.lookup_passport(v_token_b);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    v_check_count := v_check_count + 1;
    raise notice 'CHECK %: PASS - anon cannot execute lookup_passport (permission denied)', v_check_count;
  else
    raise exception 'CHECK 11.1: FAIL - anon executed lookup_passport!';
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

-- ============================================================================
-- TAILORTRACK PHASE 4 RLS & RPC VERIFICATION SUITE
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

  -- Insert a measurement set for Customer A to verify scope enforcement
  insert into public.measurement_sets (customer_id, garment_type, values, source)
  values (v_customer_a_id, 'kameez', '{"length": 42.0, "chest": 40.5}'::jsonb, 'self');

  -- ----------------------------------------------------------------------------
  -- CHECK 1: lookup_passport returns masked name + relationship, never customer_id
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  -- 1.1 Valid token lookup
  v_lookup_result := public.lookup_passport(v_token_a);
  if v_lookup_result is not null
     and (v_lookup_result->>'masked_name') = 'Tariq M.'
     and (v_lookup_result->>'status') = 'none'
     and not (v_lookup_result ? 'customer_id') then
    raise notice 'CHECK 1.1: PASS - lookup_passport returned masked name ("%") and status ("none") with zero customer_id', (v_lookup_result->>'masked_name');
  else
    raise exception 'CHECK 1.1: FAIL - lookup_passport returned unexpected payload: %', v_lookup_result;
  end if;

  -- 1.2 Invalid token returns null and logs failure
  v_lookup_result := public.lookup_passport('completely_invalid_token_xyz');
  if v_lookup_result is null then
    raise notice 'CHECK 1.2: PASS - lookup_passport returned null for invalid token';
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
    raise notice 'CHECK 2.1: PASS - 16th lookup attempt was rate-limited (throttle enforced)';
  else
    raise exception 'CHECK 2.1: FAIL - 16th lookup was not blocked by throttle!';
  end if;

  -- Clean up throttle logs so subsequent checks can proceed
  perform set_config('role', 'postgres', true);
  delete from public.qr_lookup_attempts where shop_id = v_shop_id;

  -- Customer or anon cannot call lookup_passport
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);
  v_exception_caught := false;
  begin
    v_lookup_result := public.lookup_passport(v_token_b);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 2.2: PASS - Customer cannot call lookup_passport';
  else
    raise exception 'CHECK 2.2: FAIL - Customer was able to call lookup_passport!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 3: request_access creates pending consent only for own shop & enforces cooldown
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  -- Tailor requests access to Customer A
  v_consent_id := public.request_access(v_token_a, array['measurements', 'orders']);
  if v_consent_id is not null then
    raise notice 'CHECK 3.1: PASS - Tailor created pending consent for own shop (id %)', v_consent_id;
  else
    raise exception 'CHECK 3.1: FAIL - Tailor could not create pending consent!';
  end if;

  -- Duplicate pending request is blocked
  v_exception_caught := false;
  begin
    perform public.request_access(v_token_a, array['measurements']);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 3.2: PASS - Duplicate request while pending is blocked';
  else
    raise exception 'CHECK 3.2: FAIL - Duplicate request was allowed!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 4: State machine integrity (Terminal states, scope subset, expiry bounds)
  -- ----------------------------------------------------------------------------
  -- Customer A declines request
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  v_bool := public.respond_to_consent(v_consent_id, 'decline', null, 30);
  if v_bool = true then
    raise notice 'CHECK 4.1: PASS - Customer declined consent';
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
    raise notice 'CHECK 4.2: PASS - State machine blocked reviving declined consent';
  else
    raise exception 'CHECK 4.2: FAIL - Declined consent was updated to active!';
  end if;

  -- Tailor re-requesting within 3 days is blocked by decline cooldown
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);
  v_exception_caught := false;
  begin
    perform public.request_access(v_token_a, array['measurements']);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 4.3: PASS - 3-day decline cooldown blocked new request';
  else
    raise exception 'CHECK 4.3: FAIL - Cooldown was bypassed!';
  end if;

  -- Fast-forward the declined consent to 4 days ago to test new request and approval
  perform set_config('role', 'postgres', true);
  update public.consents
  set responded_at = now() - interval '4 days'
  where id = v_consent_id;

  -- Tailor creates new request with scopes ['measurements', 'orders']
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);
  v_consent_id := public.request_access(v_token_a, array['measurements', 'orders']);

  -- Customer A attempts to approve with invalid scope (not requested: 'saved_looks')
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);
  v_exception_caught := false;
  begin
    perform public.respond_to_consent(v_consent_id, 'approve', array['saved_looks'], 30);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 4.4: PASS - Approving unrequested scope was rejected';
  else
    raise exception 'CHECK 4.4: FAIL - Scope widening was allowed!';
  end if;

  -- Customer A attempts to approve with invalid duration (e.g. 500 days)
  v_exception_caught := false;
  begin
    perform public.respond_to_consent(v_consent_id, 'approve', array['measurements'], 500);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 4.5: PASS - Expiry duration > 365 days was rejected';
  else
    raise exception 'CHECK 4.5: FAIL - Invalid duration was allowed!';
  end if;

  -- Customer A approves valid subset: ['measurements'] for 30 days
  v_bool := public.respond_to_consent(v_consent_id, 'approve', array['measurements'], 30);
  if v_bool = true then
    raise notice 'CHECK 4.6: PASS - Customer approved subset scope for 30 days';
  else
    raise exception 'CHECK 4.6: FAIL - Valid approval failed!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 5: Cross-customer isolation (Customer B cannot touch Customer A consent)
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text)::text, true);

  v_exception_caught := false;
  begin
    perform public.revoke_consent(v_consent_id);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 5.1: PASS - Customer B cannot revoke Customer A consent';
  else
    raise exception 'CHECK 5.1: FAIL - Customer B revoked Customer A consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 6: Tailor cannot approve or call customer-only RPCs
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  v_exception_caught := false;
  begin
    perform public.respond_to_consent(v_consent_id, 'approve', array['measurements'], 30);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 6.1: PASS - Tailor cannot call respond_to_consent';
  else
    raise exception 'CHECK 6.1: FAIL - Tailor called respond_to_consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 7: Tailor view permissions with active consent vs inactive
  -- ----------------------------------------------------------------------------
  -- Tailor polls my_consent_status
  v_consent_status := public.my_consent_status(v_consent_id);
  if (v_consent_status->>'status') = 'active'
     and (v_consent_status->>'customer_id') = v_customer_a_id::text then
    raise notice 'CHECK 7.1: PASS - my_consent_status returned active status and customer_id';
  else
    raise exception 'CHECK 7.1: FAIL - my_consent_status returned unexpected: %', v_consent_status;
  end if;

  -- Tailor lists consented customers
  select count(*) into v_count from public.list_my_consented_customers();
  if v_count = 1 then
    raise notice 'CHECK 7.2: PASS - list_my_consented_customers returned 1 active customer';
  else
    raise exception 'CHECK 7.2: FAIL - list_my_consented_customers returned % rows!', v_count;
  end if;

  -- Tailor gets customer details (and triggers access_log)
  v_customer_detail := public.get_consented_customer(v_customer_a_id);
  if (v_customer_detail->>'phone') = '+923001111111'
     and (v_customer_detail->>'city') = 'Lahore' then
    raise notice 'CHECK 7.3: PASS - get_consented_customer returned full details under active consent';
  else
    raise exception 'CHECK 7.3: FAIL - get_consented_customer failed: %', v_customer_detail;
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 8: access_log audit logging and 30-min de-duplication
  -- ----------------------------------------------------------------------------
  -- Call get_consented_customer a second time immediately
  perform public.get_consented_customer(v_customer_a_id);

  -- Customer A checks their access log
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  select count(*) into v_count
  from public.access_log
  where customer_id = v_customer_a_id
    and shop_id = v_shop_id
    and action = 'viewed_profile';

  if v_count = 1 then
    raise notice 'CHECK 8.1: PASS - access_log recorded exactly 1 entry (30-min de-duplication verified)';
  else
    raise exception 'CHECK 8.1: FAIL - Expected 1 access_log entry, found %', v_count;
  end if;

  -- Direct client insert into access_log must be blocked
  v_exception_caught := false;
  begin
    insert into public.access_log (customer_id, shop_id, action)
    values (v_customer_a_id, v_shop_id, 'viewed_profile');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 8.2: PASS - Direct client INSERT to access_log is blocked';
  else
    raise exception 'CHECK 8.2: FAIL - Client was able to directly insert to access_log!';
  end if;

  -- Customer B cannot read Customer A's access log
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_b::text)::text, true);

  select count(*) into v_count
  from public.access_log
  where customer_id = v_customer_a_id;

  if v_count = 0 then
    raise notice 'CHECK 8.3: PASS - Customer B cannot read Customer A access logs';
  else
    raise exception 'CHECK 8.3: FAIL - Customer B read Customer A access logs!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 9: Phase 3 measurement visibility follows active consent scope
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  -- Tailor logs measurement view
  v_bool := public.log_measurement_view(v_customer_a_id, 'viewed_measurements');
  if v_bool = true then
    raise notice 'CHECK 9.1: PASS - log_measurement_view succeeded with active measurements scope';
  else
    raise exception 'CHECK 9.1: FAIL - log_measurement_view failed!';
  end if;

  -- Tailor reads Customer A measurements via RLS policy
  select count(*) into v_count
  from public.measurement_sets
  where customer_id = v_customer_a_id;

  if v_count >= 1 then
    raise notice 'CHECK 9.2: PASS - Tailor with active measurement consent reads measurement sets (%)', v_count;
  else
    raise exception 'CHECK 9.2: FAIL - Tailor could not read measurement sets!';
  end if;

  -- Tailor B (no consent) reads 0 measurement sets
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor_b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor_b::text)::text, true);

  select count(*) into v_count
  from public.measurement_sets
  where customer_id = v_customer_a_id;

  if v_count = 0 then
    raise notice 'CHECK 9.3: PASS - Tailor B with NO consent reads 0 measurement sets';
  else
    raise exception 'CHECK 9.3: FAIL - Tailor B read measurement sets without consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 10: Token rotation invalidates old QR while existing consent remains active
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  -- Customer A rotates QR token
  perform public.rotate_my_qr_token();

  -- Tailor attempts to lookup using old token -> returns null
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  v_lookup_result := public.lookup_passport(v_token_a);
  if v_lookup_result is null then
    raise notice 'CHECK 10.1: PASS - Old QR token returned null after rotation';
  else
    raise exception 'CHECK 10.1: FAIL - Old token still returned data after rotation!';
  end if;

  -- But existing active consent for this tailor still works!
  v_customer_detail := public.get_consented_customer(v_customer_a_id);
  if v_customer_detail is not null then
    raise notice 'CHECK 10.2: PASS - Existing active consent remains valid after token rotation';
  else
    raise exception 'CHECK 10.2: FAIL - Token rotation broke existing consent!';
  end if;

  -- Customer revokes consent
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);
  perform public.revoke_consent(v_consent_id);

  -- Tailor now reads 0 customers from list_my_consented_customers
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_tailor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);
  select count(*) into v_count from public.list_my_consented_customers();
  if v_count = 0 then
    raise notice 'CHECK 10.3: PASS - Revoked consent immediately removes tailor access';
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
    raise notice 'CHECK 11.1: PASS - anon cannot execute lookup_passport (permission denied)';
  else
    raise exception 'CHECK 11.1: FAIL - anon executed lookup_passport!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CLEANUP
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor, v_tailor_b);

  raise notice '==============================================================';
  raise notice 'ALL 11 PHASE 4 RLS & RPC CHECKS PASSED (100%% VERIFIED)';
  raise notice '==============================================================';

exception when others then
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor, v_tailor_b);
  raise;
end;
$$;

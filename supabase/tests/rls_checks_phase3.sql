-- ==============================================================================
-- TailorTrack Phase 3: Row Level Security (RLS) & Integrity Test Suite
-- Run this script in the Supabase SQL Editor AFTER running 0002_measurements.sql.
-- All created records are cleaned up automatically in the cleanup block.
-- ==============================================================================

do $$
declare
  -- Test user IDs
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_tailor uuid := '33333333-3333-3333-3333-333333333333';

  -- Entity IDs
  v_customer_a_id uuid;
  v_customer_b_id uuid;
  v_shop_id uuid;
  v_fam_a1_id uuid;
  v_fam_b1_id uuid;
  v_set_a1_id uuid;
  v_consent_id uuid;

  -- Test verification counters and flags
  v_count int;
  v_exception_caught boolean;
  v_notes_test text;
begin
  raise notice '==============================================================';
  raise notice 'TAILORTRACK PHASE 3 RLS & INTEGRITY TEST SUITE';
  raise notice '==============================================================';

  -- ----------------------------------------------------------------------------
  -- SETUP: Clean existing test users and insert fresh fixtures
  -- ----------------------------------------------------------------------------
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor);

  -- 1. Create Customer A
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_user_a,
    'cust_a_p3@test.com',
    jsonb_build_object('role', 'customer', 'full_name', 'Customer A', 'city', 'Lahore'),
    'authenticated',
    'authenticated'
  );

  -- 2. Create Customer B
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_user_b,
    'cust_b_p3@test.com',
    jsonb_build_object('role', 'customer', 'full_name', 'Customer B', 'city', 'Karachi'),
    'authenticated',
    'authenticated'
  );

  -- 3. Create Tailor
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_tailor,
    'tailor_p3@test.com',
    jsonb_build_object('role', 'tailor', 'full_name', 'Master Tailor P3', 'shop_name', 'Boutique Studio', 'city', 'Lahore'),
    'authenticated',
    'authenticated'
  );

  -- Resolve entity IDs
  select id into v_customer_a_id from public.customers where user_id = v_user_a;
  select id into v_customer_b_id from public.customers where user_id = v_user_b;
  select id into v_shop_id from public.tailor_shops where owner_id = v_tailor;

  -- Populate initial family member for A and B as admin/system
  insert into public.family_members (customer_id, full_name, relation, fit_category)
  values (v_customer_a_id, 'Brother Tariq', 'brother', 'men')
  returning id into v_fam_a1_id;

  insert into public.family_members (customer_id, full_name, relation, fit_category)
  values (v_customer_b_id, 'Son Hamza', 'son', 'boys')
  returning id into v_fam_b1_id;

  -- Populate initial measurement set for A
  insert into public.measurement_sets (customer_id, family_member_id, garment_type, values, fit_preference, notes)
  values (
    v_customer_a_id,
    v_fam_a1_id,
    'kameez',
    jsonb_build_object('length', 40.5, 'chest', 38.0, 'shoulder', 17.5),
    'regular',
    'Initial trial fit'
  )
  returning id into v_set_a1_id;

  raise notice 'SETUP COMPLETE: Customer A (%), Customer B (%), Shop (%)',
    v_customer_a_id, v_customer_b_id, v_shop_id;

  -- ----------------------------------------------------------------------------
  -- CHECK 1: Customer A cannot read, insert, update or delete Customer B data
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  -- 1.1 Select isolation
  select count(*) into v_count from public.family_members where customer_id = v_customer_b_id;
  if v_count = 0 then
    raise notice 'CHECK 1.1: PASS - Customer A cannot select Customer B family members';
  else
    raise exception 'CHECK 1.1: FAIL - Customer A selected Customer B family members!';
  end if;

  select count(*) into v_count from public.measurement_sets where customer_id = v_customer_b_id;
  if v_count = 0 then
    raise notice 'CHECK 1.2: PASS - Customer A cannot select Customer B measurement sets';
  else
    raise exception 'CHECK 1.2: FAIL - Customer A selected Customer B measurement sets!';
  end if;

  -- 1.2 Insert isolation
  v_exception_caught := false;
  begin
    insert into public.family_members (customer_id, full_name, relation, fit_category)
    values (v_customer_b_id, 'Hacked Member', 'other', 'men');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 1.3: PASS - Customer A cannot insert family member for Customer B';
  else
    raise exception 'CHECK 1.3: FAIL - Customer A was able to insert family member for Customer B!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 2: Customer cannot insert a set with source='tailor' or a shop_id
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  v_exception_caught := false;
  begin
    insert into public.measurement_sets (customer_id, garment_type, values, source)
    values (v_customer_a_id, 'kameez', jsonb_build_object('length', 42.0), 'tailor');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 2.1: PASS - Customer cannot insert set with source=tailor';
  else
    raise exception 'CHECK 2.1: FAIL - Customer inserted set with source=tailor!';
  end if;

  v_exception_caught := false;
  begin
    insert into public.measurement_sets (customer_id, garment_type, values, source, shop_id)
    values (v_customer_a_id, 'kameez', jsonb_build_object('length', 42.0), 'self', v_shop_id);
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 2.2: PASS - Customer cannot insert set with shop_id set';
  else
    raise exception 'CHECK 2.2: FAIL - Customer inserted set with shop_id set!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 3: Customer cannot attach measurement set to another customer family member
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  v_exception_caught := false;
  begin
    insert into public.measurement_sets (customer_id, family_member_id, garment_type, values)
    values (v_customer_a_id, v_fam_b1_id, 'kameez', jsonb_build_object('length', 40.0));
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 3: PASS - Composite foreign key blocks attaching to another customer family member';
  else
    raise exception 'CHECK 3: FAIL - Measurement set attached across customer boundary!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 4: The 11th family member is rejected by trigger
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  -- Currently Customer A has 1 family member. Insert 9 more to reach 10.
  for i in 2..10 loop
    insert into public.family_members (customer_id, full_name, relation, fit_category)
    values (v_customer_a_id, 'Member ' || i::text, 'other', 'men');
  end loop;

  -- 11th member should throw exception
  v_exception_caught := false;
  begin
    insert into public.family_members (customer_id, full_name, relation, fit_category)
    values (v_customer_a_id, 'Member 11 Forbidden', 'other', 'men');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 4: PASS - 11th family member rejected by enforce_family_members_cap trigger';
  else
    raise exception 'CHECK 4: FAIL - Able to insert more than 10 family members!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 5: Measurement values cannot be edited, but notes can
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  -- Try editing values
  v_exception_caught := false;
  begin
    update public.measurement_sets
    set values = jsonb_build_object('length', 99.0)
    where id = v_set_a1_id;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 5.1: PASS - Direct UPDATE of measurement values blocked by immutability trigger';
  else
    raise exception 'CHECK 5.1: FAIL - Measurement values were overwritten!';
  end if;

  -- Edit notes
  update public.measurement_sets
  set notes = 'Updated fitting note after trial'
  where id = v_set_a1_id;

  select notes into v_notes_test from public.measurement_sets where id = v_set_a1_id;
  if v_notes_test = 'Updated fitting note after trial' then
    raise notice 'CHECK 5.2: PASS - Notes column is cleanly editable';
  else
    raise exception 'CHECK 5.2: FAIL - Could not update notes on measurement set';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 6: Tailor consent matrix
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  -- 6.1 No consent -> 0 rows
  select count(*) into v_count from public.family_members where customer_id = v_customer_a_id;
  if v_count = 0 then
    raise notice 'CHECK 6.1: PASS - Tailor with NO consent reads 0 family members';
  else
    raise exception 'CHECK 6.1: FAIL - Tailor with NO consent read % family members!', v_count;
  end if;

  select count(*) into v_count from public.measurement_sets where customer_id = v_customer_a_id;
  if v_count = 0 then
    raise notice 'CHECK 6.2: PASS - Tailor with NO consent reads 0 measurement sets';
  else
    raise exception 'CHECK 6.2: FAIL - Tailor with NO consent read % sets!', v_count;
  end if;

  -- 6.2 Create active consent for measurements
  insert into public.consents (customer_id, shop_id, scopes, status, granted_at, expires_at)
  values (
    v_customer_a_id,
    v_shop_id,
    array['measurements'],
    'active',
    now(),
    now() + interval '30 days'
  )
  returning id into v_consent_id;

  -- Tailor now selects with active consent
  select count(*) into v_count from public.family_members where customer_id = v_customer_a_id;
  if v_count = 10 then
    raise notice 'CHECK 6.3: PASS - Tailor with ACTIVE consent reads Customer A family members (%)', v_count;
  else
    raise exception 'CHECK 6.3: FAIL - Tailor with ACTIVE consent expected 10 family members, got %', v_count;
  end if;

  select count(*) into v_count from public.measurement_sets where customer_id = v_customer_a_id;
  if v_count >= 1 then
    raise notice 'CHECK 6.4: PASS - Tailor with ACTIVE consent reads Customer A measurement sets (%)', v_count;
  else
    raise exception 'CHECK 6.4: FAIL - Tailor with ACTIVE consent could not read sets!';
  end if;

  -- 6.3 Revoked consent -> reads 0
  update public.consents
  set status = 'revoked', revoked_at = now()
  where id = v_consent_id;

  select count(*) into v_count from public.measurement_sets where customer_id = v_customer_a_id;
  if v_count = 0 then
    raise notice 'CHECK 6.5: PASS - Tailor reads 0 sets when consent is REVOKED';
  else
    raise exception 'CHECK 6.5: FAIL - Tailor read sets under revoked consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 7: anon role reads nothing
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{}', true);

  v_exception_caught := false;
  v_count := 0;
  begin
    select count(*) into v_count from public.family_members;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught or v_count = 0 then
    raise notice 'CHECK 7.1: PASS - anon cannot select family_members (access denied)';
  else
    raise exception 'CHECK 7.1: FAIL - anon selected from family_members!';
  end if;

  v_exception_caught := false;
  v_count := 0;
  begin
    select count(*) into v_count from public.measurement_sets;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught or v_count = 0 then
    raise notice 'CHECK 7.2: PASS - anon cannot select measurement_sets (access denied)';
  else
    raise exception 'CHECK 7.2: FAIL - anon selected from measurement_sets!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CLEANUP
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor);

  raise notice '==============================================================';
  raise notice 'ALL 7 PHASE 3 RLS & INTEGRITY CHECKS PASSED (100%% VERIFIED)';
  raise notice '==============================================================';

exception when others then
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor);
  raise;
end;
$$;

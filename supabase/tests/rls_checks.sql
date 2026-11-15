-- ==============================================================================
-- TailorTrack Phase 2: Row Level Security (RLS) Verification Test Suite
-- Run this script in the Supabase SQL Editor.
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
  v_other_shop_id uuid := '44444444-4444-4444-4444-444444444444';
  v_consent_id uuid;

  -- Test verification counters
  v_count int;
  v_bool boolean;
  v_exception_caught boolean;
  v_new_qr text;
begin
  raise notice '==============================================================';
  raise notice 'TAILORTRACK RLS VERIFICATION TEST SUITE';
  raise notice '==============================================================';

  -- ----------------------------------------------------------------------------
  -- SETUP: Create clean test fixtures in auth.users and let trigger populate
  -- ----------------------------------------------------------------------------
  -- Cleanup any leftover test rows first
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor);

  -- 1. Create Customer A
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_user_a,
    'customer_a@test.com',
    jsonb_build_object('role', 'customer', 'full_name', 'Customer A', 'city', 'Lahore'),
    'authenticated',
    'authenticated'
  );

  -- 2. Create Customer B
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_user_b,
    'customer_b@test.com',
    jsonb_build_object('role', 'customer', 'full_name', 'Customer B', 'city', 'Karachi'),
    'authenticated',
    'authenticated'
  );

  -- 3. Create Tailor T
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values (
    v_tailor,
    'tailor_t@test.com',
    jsonb_build_object('role', 'tailor', 'full_name', 'Master T', 'shop_name', 'Royal Studio', 'city', 'Lahore'),
    'authenticated',
    'authenticated'
  );

  -- Fetch generated IDs
  select id into v_customer_a_id from public.customers where user_id = v_user_a;
  select id into v_customer_b_id from public.customers where user_id = v_user_b;
  select id into v_shop_id from public.tailor_shops where owner_id = v_tailor;

  raise notice 'SETUP COMPLETE: Created Cust A (%), Cust B (%), Tailor Shop (%)',
    v_customer_a_id, v_customer_b_id, v_shop_id;

  -- ----------------------------------------------------------------------------
  -- CHECK 1: Customer A cannot read Customer B's profile or customer row
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  -- Test select on profiles
  select count(*) into v_count from public.profiles where id = v_user_b;
  if v_count = 0 then
    raise notice 'CHECK 1.1: PASS - Customer A cannot select Customer B profile';
  else
    raise exception 'CHECK 1.1: FAIL - Customer A was able to select Customer B profile!';
  end if;

  -- Test select on customers
  select count(*) into v_count from public.customers where id = v_customer_b_id;
  if v_count = 0 then
    raise notice 'CHECK 1.2: PASS - Customer A cannot select Customer B customer row';
  else
    raise exception 'CHECK 1.2: FAIL - Customer A was able to select Customer B customer row!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 2: A tailor cannot read any customer row or profile with no consent
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  select count(*) into v_count from public.customers;
  if v_count = 0 then
    raise notice 'CHECK 2.1: PASS - Tailor has zero direct select on customers table';
  else
    raise exception 'CHECK 2.1: FAIL - Tailor was able to select % rows from customers!', v_count;
  end if;

  select count(*) into v_count from public.profiles where id = v_user_a;
  if v_count = 0 then
    raise notice 'CHECK 2.2: PASS - Tailor cannot select Customer A profile with no consent';
  else
    raise exception 'CHECK 2.2: FAIL - Tailor was able to select Customer A profile!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 3: A user cannot change their own role or qr_token by direct UPDATE
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  -- Try updating role
  v_exception_caught := false;
  begin
    update public.profiles set role = 'tailor' where id = v_user_a;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 3.1: PASS - Direct UPDATE of profiles.role is blocked by trigger';
  else
    raise exception 'CHECK 3.1: FAIL - User was able to update their role!';
  end if;

  -- Try updating qr_token directly
  v_exception_caught := false;
  begin
    update public.customers set qr_token = 'hacked_token_123' where user_id = v_user_a;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 3.2: PASS - Direct UPDATE of customers.qr_token is blocked';
  else
    raise exception 'CHECK 3.2: FAIL - User was able to directly overwrite qr_token!';
  end if;

  -- Verify rotation via dedicated function works
  v_new_qr := public.rotate_my_qr_token();
  if v_new_qr is not null and length(v_new_qr) = 32 then
    raise notice 'CHECK 3.3: PASS - Dedicated rotate_my_qr_token() generates valid token';
  else
    raise exception 'CHECK 3.3: FAIL - rotate_my_qr_token() failed';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 4: Tailor can create pending consent for own shop, but NOT another shop
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tailor::text)::text, true);

  -- Tailor inserting for own shop
  insert into public.consents (customer_id, shop_id, scopes, status)
  values (v_customer_a_id, v_shop_id, array['measurements', 'orders'], 'pending')
  returning id into v_consent_id;

  if v_consent_id is not null then
    raise notice 'CHECK 4.1: PASS - Tailor can create pending consent for their own shop';
  else
    raise exception 'CHECK 4.1: FAIL - Tailor could not insert consent for own shop!';
  end if;

  -- Tailor attempting to insert for another shop
  v_exception_caught := false;
  begin
    insert into public.consents (customer_id, shop_id, scopes, status)
    values (v_customer_b_id, v_other_shop_id, array['measurements'], 'pending');
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught then
    raise notice 'CHECK 4.2: PASS - Tailor cannot insert consent for another shop';
  else
    raise exception 'CHECK 4.2: FAIL - Tailor was able to insert consent for another shop!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 5: has_active_consent() validation across status & expiry
  -- ----------------------------------------------------------------------------
  -- 5.1 Pending status -> false
  v_bool := public.has_active_consent(v_shop_id, v_customer_a_id, 'measurements');
  if v_bool = false then
    raise notice 'CHECK 5.1: PASS - has_active_consent() is false for pending consent';
  else
    raise exception 'CHECK 5.1: FAIL - has_active_consent() returned true for pending!';
  end if;

  -- 5.2 Customer approves: switch to Customer A who owns consent
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a::text)::text, true);

  update public.consents
  set status = 'active', granted_at = now(), expires_at = now() + interval '30 days'
  where id = v_consent_id;

  v_bool := public.has_active_consent(v_shop_id, v_customer_a_id, 'measurements');
  if v_bool = true then
    raise notice 'CHECK 5.2: PASS - has_active_consent() is true for valid active consent';
  else
    raise exception 'CHECK 5.2: FAIL - has_active_consent() returned false for active consent!';
  end if;

  -- 5.3 Missing scope -> false
  v_bool := public.has_active_consent(v_shop_id, v_customer_a_id, 'saved_looks');
  if v_bool = false then
    raise notice 'CHECK 5.3: PASS - has_active_consent() is false for ungranted scope';
  else
    raise exception 'CHECK 5.3: FAIL - has_active_consent() allowed ungranted scope!';
  end if;

  -- 5.4 Revoked status -> false
  update public.consents
  set status = 'revoked', revoked_at = now()
  where id = v_consent_id;

  v_bool := public.has_active_consent(v_shop_id, v_customer_a_id, 'measurements');
  if v_bool = false then
    raise notice 'CHECK 5.4: PASS - has_active_consent() is false for revoked consent';
  else
    raise exception 'CHECK 5.4: FAIL - has_active_consent() allowed revoked consent!';
  end if;

  -- 5.5 Expired active status -> false
  update public.consents
  set status = 'active', revoked_at = null, expires_at = now() - interval '1 hour'
  where id = v_consent_id;

  v_bool := public.has_active_consent(v_shop_id, v_customer_a_id, 'measurements');
  if v_bool = false then
    raise notice 'CHECK 5.5: PASS - has_active_consent() is false for expired consent';
  else
    raise exception 'CHECK 5.5: FAIL - has_active_consent() allowed expired consent!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CHECK 6: anon role cannot read any of the tables
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{}', true);

  -- 6.1 profiles
  v_exception_caught := false;
  v_count := 0;
  begin
    select count(*) into v_count from public.profiles;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught or v_count = 0 then
    raise notice 'CHECK 6.1: PASS - anon cannot select from profiles (access denied)';
  else
    raise exception 'CHECK 6.1: FAIL - anon selected from profiles!';
  end if;

  -- 6.2 customers
  v_exception_caught := false;
  v_count := 0;
  begin
    select count(*) into v_count from public.customers;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught or v_count = 0 then
    raise notice 'CHECK 6.2: PASS - anon cannot select from customers (access denied)';
  else
    raise exception 'CHECK 6.2: FAIL - anon selected from customers!';
  end if;

  -- 6.3 tailor_shops
  v_exception_caught := false;
  v_count := 0;
  begin
    select count(*) into v_count from public.tailor_shops;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught or v_count = 0 then
    raise notice 'CHECK 6.3: PASS - anon cannot select from tailor_shops (access denied)';
  else
    raise exception 'CHECK 6.3: FAIL - anon selected from tailor_shops!';
  end if;

  -- 6.4 consents
  v_exception_caught := false;
  v_count := 0;
  begin
    select count(*) into v_count from public.consents;
  exception when others then
    v_exception_caught := true;
  end;

  if v_exception_caught or v_count = 0 then
    raise notice 'CHECK 6.4: PASS - anon cannot select from consents (access denied)';
  else
    raise exception 'CHECK 6.4: FAIL - anon selected from consents!';
  end if;

  -- ----------------------------------------------------------------------------
  -- CLEANUP
  -- ----------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor);

  raise notice '==============================================================';
  raise notice 'ALL 6 RLS CHECKS PASSED SUCCESSFULLY (100%% VERIFIED)';
  raise notice '==============================================================';

exception when others then
  -- Ensure cleanup runs even on error
  perform set_config('role', 'postgres', true);
  delete from auth.users where id in (v_user_a, v_user_b, v_tailor);
  raise;
end;
$$;

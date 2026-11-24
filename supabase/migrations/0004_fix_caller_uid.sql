-- ============================================================================
-- TailorTrack Migration 0004: Fix Caller UID Resolution in RPC Helpers
-- ============================================================================
-- Fixes caller identification in security-definer helper functions.
-- In PostgREST HTTP calls (Supabase JS / browser / server components),
-- PostgREST sets 'request.jwt.claims' and auth.uid() rather than the individual
-- 'request.jwt.claim.sub' GUC.
-- Using coalesce(auth.uid(), ...) ensures robust authentication across both
-- direct SQL sessions and PostgREST API calls.
-- ============================================================================

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
  v_uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  );
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
  v_uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  );
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

revoke all on function public.get_caller_shop_id() from public, anon;
grant execute on function public.get_caller_shop_id() to authenticated;

revoke all on function public.get_caller_customer_id() from public, anon;
grant execute on function public.get_caller_customer_id() to authenticated;

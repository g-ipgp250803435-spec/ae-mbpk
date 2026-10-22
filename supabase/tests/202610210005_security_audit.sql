-- ae-MBPK Peringkat 2.4: read-only configuration audit
-- Run after the security_hardening migration. This does not simulate user JWTs;
-- follow it with the two-account manual tests in SECURITY_TEST_PLAN.md.

-- 1) Inspect RLS state.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles','classes','students','game_sessions')
order by c.relname;

-- 2) Inspect active policies.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','classes','students','game_sessions')
order by tablename, policyname;

-- 3) Inspect grants. There should be no anon grants on these tables.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles','classes','students','game_sessions')
  and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;

-- 4) Fail fast if core requirements are not met.
do $$
declare
  t text;
begin
  foreach t in array array['profiles','classes','students','game_sessions']
  loop
    if not coalesce((
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t
    ), false) then
      raise exception 'Security audit failed: RLS is not enabled on public.%', t;
    end if;

    if has_table_privilege('anon', format('public.%I', t), 'SELECT')
       or has_table_privilege('anon', format('public.%I', t), 'INSERT')
       or has_table_privilege('anon', format('public.%I', t), 'UPDATE')
       or has_table_privilege('anon', format('public.%I', t), 'DELETE') then
      raise exception 'Security audit failed: anon has direct table privilege on public.%', t;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.game_sessions', 'UPDATE')
     or has_table_privilege('authenticated', 'public.game_sessions', 'DELETE') then
    raise exception 'Security audit failed: authenticated can directly update/delete game_sessions.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='game_sessions'
      and policyname='sessions_select_own_students' and cmd='SELECT'
  ) then
    raise exception 'Security audit failed: expected session SELECT policy is missing.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='game_sessions'
      and policyname='sessions_insert_own_students' and cmd='INSERT'
  ) then
    raise exception 'Security audit failed: expected session INSERT policy is missing.';
  end if;

  raise notice 'Configuration audit passed. Manual two-account/API tests are still required.';
end $$;

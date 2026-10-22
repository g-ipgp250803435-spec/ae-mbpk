-- ae-MBPK Peringkat 4.1: READ-ONLY configuration audit.
-- Run in Supabase SQL Editor after the migrations expected by this project.
-- This query does not modify schema or data. It checks configuration only;
-- it cannot prove policy behaviour for real authenticated users.

with expected(table_name) as (
  values
    ('profiles'),
    ('classes'),
    ('students'),
    ('game_sessions'),
    ('student_accessibility_preferences'),
    ('followup_plans')
),
table_state as (
  select
    e.table_name,
    c.oid is not null as table_exists,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    coalesce(c.relforcerowsecurity, false) as rls_forced,
    coalesce((select count(*) from pg_policies p
              where p.schemaname='public' and p.tablename=e.table_name),0)::int as policy_count,
    coalesce(has_table_privilege('anon', format('public.%I', e.table_name), 'SELECT'), false) as anon_select,
    coalesce(has_table_privilege('anon', format('public.%I', e.table_name), 'INSERT'), false) as anon_insert,
    coalesce(has_table_privilege('anon', format('public.%I', e.table_name), 'UPDATE'), false) as anon_update,
    coalesce(has_table_privilege('anon', format('public.%I', e.table_name), 'DELETE'), false) as anon_delete,
    coalesce(has_table_privilege('authenticated', format('public.%I', e.table_name), 'SELECT'), false) as auth_select,
    coalesce(has_table_privilege('authenticated', format('public.%I', e.table_name), 'INSERT'), false) as auth_insert,
    coalesce(has_table_privilege('authenticated', format('public.%I', e.table_name), 'UPDATE'), false) as auth_update,
    coalesce(has_table_privilege('authenticated', format('public.%I', e.table_name), 'DELETE'), false) as auth_delete
  from expected e
  left join pg_namespace n on n.nspname='public'
  left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind in ('r','p')
),
checks as (
  select table_name, 'TABLE_EXISTS'::text as check_name, table_exists as passed,
         case when table_exists then 'Table exists' else 'Expected table missing; apply the relevant migration' end as details
  from table_state
  union all
  select table_name, 'RLS_ENABLED', rls_enabled,
         case when rls_enabled then 'Row Level Security is enabled' else 'RLS is not enabled' end
  from table_state where table_exists
  union all
  select table_name, 'ANON_NO_TABLE_PRIVILEGES',
         not (anon_select or anon_insert or anon_update or anon_delete),
         case when not (anon_select or anon_insert or anon_update or anon_delete)
              then 'anon has no direct table privileges'
              else concat('Unexpected anon grants: SELECT=',anon_select,', INSERT=',anon_insert,
                          ', UPDATE=',anon_update,', DELETE=',anon_delete) end
  from table_state where table_exists
  union all
  select table_name, 'AUTH_POLICY_PRESENT', policy_count > 0,
         concat(policy_count, ' RLS policy/policies found; review their expressions manually')
  from table_state where table_exists
  union all
  select table_name, 'AUTH_SELECT_GRANT', auth_select,
         case when auth_select then 'authenticated has SELECT grant (RLS must still constrain rows)'
              else 'authenticated lacks SELECT grant; confirm this is intentional' end
  from table_state where table_exists
  union all
  select 'game_sessions', 'NO_AUTH_UPDATE_DELETE_GRANT',
         not (auth_update or auth_delete),
         case when not (auth_update or auth_delete)
              then 'Authenticated client cannot directly update/delete session rows'
              else concat('Unexpected authenticated grants: UPDATE=',auth_update,', DELETE=',auth_delete) end
  from table_state where table_name='game_sessions' and table_exists
)
select
  case when passed then 'PASS' else 'REVIEW' end as result,
  table_name,
  check_name,
  details
from checks
order by case when passed then 1 else 0 end, table_name, check_name;

-- Inspect exact policy expressions in a separate result set.
select
  tablename,
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname='public'
  and tablename in (
    'profiles','classes','students','game_sessions',
    'student_accessibility_preferences','followup_plans'
  )
order by tablename, policyname, cmd;

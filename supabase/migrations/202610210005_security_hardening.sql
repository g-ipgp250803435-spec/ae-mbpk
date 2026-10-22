-- ae-MBPK Peringkat 2.4: security hardening for game session records
-- Run only after migrations 202610210001, 202610210002, and 202610210003.
-- Intended for the current browser client: sessions are inserted and read,
-- but not edited/deleted directly through the authenticated client.
-- Deleting a student can still cascade-delete its sessions via the FK.

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.game_sessions enable row level security;

-- Explicitly remove direct anonymous access.
revoke all on public.profiles from anon;
revoke all on public.classes from anon;
revoke all on public.students from anon;
revoke all on public.game_sessions from anon;

-- Preserve the expected access for the authenticated browser client.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert on public.game_sessions to authenticated;

-- Session rows are evidence records. The current application has no feature
-- that needs to update/delete a session directly. Prevent clients from
-- rewriting history or deleting individual evidence records through the API.
revoke update, delete on public.game_sessions from authenticated;
drop policy if exists "sessions_update_own_students" on public.game_sessions;
drop policy if exists "sessions_delete_own_students" on public.game_sessions;

-- Recreate read/insert policies narrowly. Ownership is derived through the
-- student -> class -> teacher relationship; created_by must match auth.uid().
drop policy if exists "sessions_select_own_students" on public.game_sessions;
create policy "sessions_select_own_students"
on public.game_sessions
for select to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id
      and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "sessions_insert_own_students" on public.game_sessions;
create policy "sessions_insert_own_students"
on public.game_sessions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id
      and c.teacher_id = (select auth.uid())
  )
);

-- Keep session idempotency protection from migration 202610210003.
create unique index if not exists game_sessions_client_session_id_uidx
  on public.game_sessions (client_session_id)
  where client_session_id is not null;

-- Add/retain constraints for non-negative session metrics.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'game_sessions_attempts_nonnegative'
      and conrelid = 'public.game_sessions'::regclass
  ) then
    alter table public.game_sessions
      add constraint game_sessions_attempts_nonnegative check (attempts >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'game_sessions_hints_nonnegative'
      and conrelid = 'public.game_sessions'::regclass
  ) then
    alter table public.game_sessions
      add constraint game_sessions_hints_nonnegative check (hints_used >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'game_sessions_duration_nonnegative'
      and conrelid = 'public.game_sessions'::regclass
  ) then
    alter table public.game_sessions
      add constraint game_sessions_duration_nonnegative
      check (duration_seconds is null or duration_seconds >= 0);
  end if;
end $$;

-- ae-MBPK Peringkat 2.2: idempotent game-session writes.
-- Apply after migrations 202610210001 and 202610210002.
-- Does not relax existing RLS policies.

alter table public.game_sessions
  add column if not exists client_session_id uuid;

create unique index if not exists game_sessions_client_session_id_uidx
  on public.game_sessions (client_session_id)
  where client_session_id is not null;

-- Ensure row-level access remains enabled and anonymous users cannot read/write sessions.
alter table public.game_sessions enable row level security;
revoke all on public.game_sessions from anon;
grant select, insert, update, delete on public.game_sessions to authenticated;

-- Existing session policies from the initial schema still require:
-- 1) created_by = auth.uid() on insert/update; and
-- 2) the referenced student belongs to a class owned by auth.uid().
-- Do not add a broad authenticated policy that bypasses those checks.

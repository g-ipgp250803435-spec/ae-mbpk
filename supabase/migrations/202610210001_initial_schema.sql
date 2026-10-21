-- ae-MBPK Peringkat 2: initial schema and Row Level Security
-- Run in Supabase SQL Editor only after reviewing this migration.
-- This schema deliberately stores no diagnosis or sensitive clinical data.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Guru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 100)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_name_length check (char_length(name) between 1 and 100)
);
create index if not exists classes_teacher_id_idx on public.classes(teacher_id);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  display_name text not null,
  learner_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_display_name_length check (char_length(display_name) between 1 and 80),
  constraint students_learner_code_length check (learner_code is null or char_length(learner_code) between 1 and 32)
);
create index if not exists students_class_id_idx on public.students(class_id);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  game_slug text not null,
  skill_code text,
  score numeric(7,2),
  attempts integer not null default 0,
  hints_used integer not null default 0,
  duration_seconds integer,
  result_summary jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint game_sessions_game_slug_length check (char_length(game_slug) between 1 and 80),
  constraint game_sessions_attempts_nonnegative check (attempts >= 0),
  constraint game_sessions_hints_nonnegative check (hints_used >= 0),
  constraint game_sessions_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint game_sessions_score_nonnegative check (score is null or score >= 0)
);
create index if not exists game_sessions_student_created_idx on public.game_sessions(student_id, created_at desc);

-- New Auth users get a minimal profile. Role is not client-editable.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Guru')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.game_sessions enable row level security;

-- Profile: users can read/update their own profile only.
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Classes: only the owning teacher can access their own class rows.
drop policy if exists "classes_select_own" on public.classes;
create policy "classes_select_own" on public.classes
for select to authenticated using (teacher_id = (select auth.uid()));

drop policy if exists "classes_insert_own" on public.classes;
create policy "classes_insert_own" on public.classes
for insert to authenticated with check (teacher_id = (select auth.uid()));

drop policy if exists "classes_update_own" on public.classes;
create policy "classes_update_own" on public.classes
for update to authenticated using (teacher_id = (select auth.uid()))
with check (teacher_id = (select auth.uid()));

drop policy if exists "classes_delete_own" on public.classes;
create policy "classes_delete_own" on public.classes
for delete to authenticated using (teacher_id = (select auth.uid()));

-- Students: access is granted only through a class owned by the current teacher.
drop policy if exists "students_select_own_classes" on public.students;
create policy "students_select_own_classes" on public.students
for select to authenticated using (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "students_insert_own_classes" on public.students;
create policy "students_insert_own_classes" on public.students
for insert to authenticated with check (
  created_by = (select auth.uid()) and exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "students_update_own_classes" on public.students;
create policy "students_update_own_classes" on public.students
for update to authenticated using (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "students_delete_own_classes" on public.students;
create policy "students_delete_own_classes" on public.students
for delete to authenticated using (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
);

-- Sessions: access only if the referenced student belongs to a class owned by the teacher.
drop policy if exists "sessions_select_own_students" on public.game_sessions;
create policy "sessions_select_own_students" on public.game_sessions
for select to authenticated using (
  exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "sessions_insert_own_students" on public.game_sessions;
create policy "sessions_insert_own_students" on public.game_sessions
for insert to authenticated with check (
  created_by = (select auth.uid()) and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "sessions_update_own_students" on public.game_sessions;
create policy "sessions_update_own_students" on public.game_sessions
for update to authenticated using (
  exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id and c.teacher_id = (select auth.uid())
  )
) with check (
  created_by = (select auth.uid()) and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "sessions_delete_own_students" on public.game_sessions;
create policy "sessions_delete_own_students" on public.game_sessions
for delete to authenticated using (
  exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = game_sessions.student_id and c.teacher_id = (select auth.uid())
  )
);

-- Restrict anonymous access explicitly. RLS remains the primary row-level boundary.
revoke all on public.profiles, public.classes, public.students, public.game_sessions from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.game_sessions to authenticated;

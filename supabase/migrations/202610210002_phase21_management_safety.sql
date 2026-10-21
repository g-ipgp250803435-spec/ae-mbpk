-- ae-MBPK Peringkat 2.1: safer class/profile management.
-- Apply after 202610210001_initial_schema.sql in Supabase SQL Editor.
-- This migration is designed to be re-runnable.

-- Ensure the teacher cannot alter the creator identity when updating a student.
drop policy if exists "students_update_own_classes" on public.students;
create policy "students_update_own_classes" on public.students
for update to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.teacher_id = (select auth.uid())
  )
);

-- Protect class data from accidental cascade deletion through the UI or API.
-- Teachers must remove student profiles first; student deletion intentionally cascades
-- to game_sessions because those sessions belong to that student record.
create or replace function public.prevent_delete_nonempty_class()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.students s where s.class_id = old.id) then
    raise exception 'Cannot delete a class that still has students. Remove student profiles first.';
  end if;
  return old;
end;
$$;

drop trigger if exists prevent_nonempty_class_delete on public.classes;
create trigger prevent_nonempty_class_delete
before delete on public.classes
for each row execute procedure public.prevent_delete_nonempty_class();

-- Keep updated_at current on supported edits.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes
for each row execute procedure public.set_updated_at();

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students
for each row execute procedure public.set_updated_at();

-- Explicitly retain RLS and expected authenticated grants.
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.game_sessions enable row level security;

revoke all on public.profiles, public.classes, public.students, public.game_sessions from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.game_sessions to authenticated;

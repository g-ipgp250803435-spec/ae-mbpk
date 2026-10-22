-- ae-MBPK Peringkat 3.8: teacher-owned follow-up plans and reflections.
-- Apply after the existing ae-MBPK migrations. No service-role key is used by the browser.
create table if not exists public.followup_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  focus_code text not null check (char_length(focus_code) between 1 and 40),
  focus_label text not null check (char_length(focus_label) between 1 and 120),
  support_code text not null check (char_length(support_code) between 1 and 40),
  support_label text not null check (char_length(support_label) between 1 and 120),
  plan_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(plan_payload) = 'object'),
  observation text not null default '' check (char_length(observation) <= 1000),
  status text not null default 'planned'
    check (status in ('planned','in_progress','completed','review')),
  implemented_on date,
  reflection text not null default '' check (char_length(reflection) <= 2000),
  next_step text not null default '' check (char_length(next_step) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists followup_plans_student_created_idx
  on public.followup_plans(student_id, created_at desc);
create index if not exists followup_plans_created_by_idx
  on public.followup_plans(created_by, created_at desc);

create or replace function public.set_followup_plans_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_followup_plans_updated_at on public.followup_plans;
create trigger set_followup_plans_updated_at
before update on public.followup_plans
for each row execute function public.set_followup_plans_updated_at();

alter table public.followup_plans enable row level security;
revoke all on public.followup_plans from anon;
grant select, insert, update, delete on public.followup_plans to authenticated;

drop policy if exists "teachers_read_followup_plans_for_own_students" on public.followup_plans;
create policy "teachers_read_followup_plans_for_own_students"
on public.followup_plans for select to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = followup_plans.student_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "teachers_insert_followup_plans_for_own_students" on public.followup_plans;
create policy "teachers_insert_followup_plans_for_own_students"
on public.followup_plans for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = followup_plans.student_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "teachers_update_followup_plans_for_own_students" on public.followup_plans;
create policy "teachers_update_followup_plans_for_own_students"
on public.followup_plans for update to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = followup_plans.student_id and c.teacher_id = (select auth.uid())
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = followup_plans.student_id and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "teachers_delete_followup_plans_for_own_students" on public.followup_plans;
create policy "teachers_delete_followup_plans_for_own_students"
on public.followup_plans for delete to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = followup_plans.student_id and c.teacher_id = (select auth.uid())
  )
);

comment on table public.followup_plans is
  'Teacher-entered teaching follow-up plans and reflections. Avoid diagnoses and unnecessary sensitive details.';

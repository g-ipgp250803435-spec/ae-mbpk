-- ae-MBPK Peringkat 3.4: per-student accessibility preferences.
-- Run only after the existing ae-MBPK migrations have been applied.
-- Stores UI preferences only; do not put diagnoses, medical notes, or free text here.

create table if not exists public.student_accessibility_preferences (
  student_id uuid primary key references public.students(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint student_accessibility_preferences_object
    check (jsonb_typeof(preferences) = 'object'),
  constraint student_accessibility_preferences_allowed_keys
    check (
      preferences - array[
        'textScale','darkMode','highContrast','reduceMotion',
        'largeTargets','quietMode','calmView'
      ]::text[] = '{}'::jsonb
    ),
  constraint student_accessibility_preferences_text_scale
    check (
      not (preferences ? 'textScale')
      or (
        jsonb_typeof(preferences->'textScale') = 'number'
        and (preferences->>'textScale')::numeric between 1 and 1.5
      )
    ),
  constraint student_accessibility_preferences_boolean_values
    check (
      (not (preferences ? 'darkMode') or jsonb_typeof(preferences->'darkMode') = 'boolean')
      and (not (preferences ? 'highContrast') or jsonb_typeof(preferences->'highContrast') = 'boolean')
      and (not (preferences ? 'reduceMotion') or jsonb_typeof(preferences->'reduceMotion') = 'boolean')
      and (not (preferences ? 'largeTargets') or jsonb_typeof(preferences->'largeTargets') = 'boolean')
      and (not (preferences ? 'quietMode') or jsonb_typeof(preferences->'quietMode') = 'boolean')
      and (not (preferences ? 'calmView') or jsonb_typeof(preferences->'calmView') = 'boolean')
    )
);

create index if not exists student_accessibility_preferences_updated_at_idx
  on public.student_accessibility_preferences(updated_at desc);

alter table public.student_accessibility_preferences enable row level security;
revoke all on public.student_accessibility_preferences from anon;
grant select, insert, update on public.student_accessibility_preferences to authenticated;

drop policy if exists "teacher_select_accessibility_preferences_for_own_students"
  on public.student_accessibility_preferences;
create policy "teacher_select_accessibility_preferences_for_own_students"
on public.student_accessibility_preferences
for select to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_accessibility_preferences.student_id
      and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "teacher_insert_accessibility_preferences_for_own_students"
  on public.student_accessibility_preferences;
create policy "teacher_insert_accessibility_preferences_for_own_students"
on public.student_accessibility_preferences
for insert to authenticated
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_accessibility_preferences.student_id
      and c.teacher_id = (select auth.uid())
  )
);

drop policy if exists "teacher_update_accessibility_preferences_for_own_students"
  on public.student_accessibility_preferences;
create policy "teacher_update_accessibility_preferences_for_own_students"
on public.student_accessibility_preferences
for update to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_accessibility_preferences.student_id
      and c.teacher_id = (select auth.uid())
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_accessibility_preferences.student_id
      and c.teacher_id = (select auth.uid())
  )
);

comment on table public.student_accessibility_preferences is
  'Accessibility UI preferences only. Never store diagnoses or clinical information.';

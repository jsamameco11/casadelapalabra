-- Casa de la Palabra — LINGOBIBLE (progressive bible-learning path).
-- Structure: paths -> units -> lessons -> exercises -> exercise_options.

create table casa_lingobible_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  icon_url text,
  position integer not null default 0,
  status casa_content_status not null default 'draft'
);

create table casa_lingobible_units (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references casa_lingobible_paths (id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0
);

create table casa_lingobible_lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references casa_lingobible_units (id) on delete cascade,
  title text not null,
  xp_reward integer not null default 20,
  position integer not null default 0,
  status casa_content_status not null default 'draft'
);

create table casa_lingobible_exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references casa_lingobible_lessons (id) on delete cascade,
  exercise_type text not null check (exercise_type in (
    'multiple_choice', 'true_false', 'fill_in_blank', 'order_words',
    'match_concept', 'identify', 'bible_reference', 'comprehension', 'memorization'
  )),
  prompt text not null,
  passage_reference text,
  passage_text text,
  correct_answer jsonb not null default '{}'::jsonb, -- shape depends on exercise_type; never sent to client pre-answer
  position integer not null default 0
);

create table casa_lingobible_exercise_options (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references casa_lingobible_exercises (id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position integer not null default 0
);

create index casa_lingobible_exercise_options_exercise_idx on casa_lingobible_exercise_options (exercise_id);

-- Configurable hearts/lives system (spec explicitly says: no monetization yet).
create table casa_lingobible_hearts_config (
  id smallint primary key default 1 check (id = 1),
  hearts_enabled boolean not null default false,
  initial_hearts integer not null default 5,
  max_hearts integer not null default 5,
  minutes_per_heart_regen integer not null default 30,
  updated_at timestamptz not null default now()
);

insert into casa_lingobible_hearts_config (id) values (1);

create trigger casa_lingobible_hearts_config_updated_at before update on casa_lingobible_hearts_config for each row execute function casa_set_updated_at();

create table casa_lingobible_user_hearts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  hearts integer not null default 5,
  last_regen_at timestamptz not null default now()
);

create table casa_lingobible_user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references casa_lingobible_lessons (id) on delete cascade,
  status text not null default 'available' check (status in ('locked', 'available', 'in_progress', 'completed', 'perfect', 'failed')),
  stars integer check (stars between 0 and 3),
  best_score integer not null default 0,
  attempts integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create trigger casa_lingobible_user_progress_updated_at before update on casa_lingobible_user_progress for each row execute function casa_set_updated_at();

create table casa_lingobible_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references casa_lingobible_lessons (id) on delete cascade,
  exercise_id uuid not null references casa_lingobible_exercises (id) on delete cascade,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create index casa_lingobible_answers_user_idx on casa_lingobible_answers (user_id, lesson_id);

create table casa_lingobible_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid references casa_lingobible_lessons (id) on delete set null,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Server-trusted exercise grading + lesson completion.
-- ---------------------------------------------------------------------
create or replace function casa_lingobible_submit_exercise(p_exercise_id uuid, p_answer jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exercise casa_lingobible_exercises%rowtype;
  v_is_correct boolean;
begin
  select * into v_exercise from casa_lingobible_exercises where id = p_exercise_id;
  if v_exercise is null then raise exception 'exercise not found'; end if;

  v_is_correct := (v_exercise.correct_answer = p_answer);

  insert into casa_lingobible_answers (user_id, lesson_id, exercise_id, is_correct)
  values (auth.uid(), v_exercise.lesson_id, p_exercise_id, v_is_correct);

  return v_is_correct;
end;
$$;

revoke all on function casa_lingobible_submit_exercise(uuid, jsonb) from public;
grant execute on function casa_lingobible_submit_exercise(uuid, jsonb) to authenticated;

create or replace function casa_lingobible_complete_lesson(p_lesson_id uuid)
returns casa_lingobible_user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson casa_lingobible_lessons%rowtype;
  v_total integer;
  v_correct integer;
  v_stars integer;
  v_score integer;
  v_status text;
  v_result casa_lingobible_user_progress%rowtype;
begin
  select * into v_lesson from casa_lingobible_lessons where id = p_lesson_id;
  if v_lesson is null then raise exception 'lesson not found'; end if;

  select count(*) into v_total from casa_lingobible_exercises where lesson_id = p_lesson_id;
  select count(*) into v_correct from casa_lingobible_answers
    where lesson_id = p_lesson_id and user_id = auth.uid()
      and answered_at >= now() - interval '2 hours'; -- current attempt window

  v_score := case when v_total > 0 then round((v_correct::numeric / v_total) * 100) else 0 end;
  v_stars := case
    when v_score >= 90 then 3
    when v_score >= 70 then 2
    when v_score >= 40 then 1
    else 0
  end;
  v_status := case when v_stars = 3 then 'perfect' when v_stars >= 1 then 'completed' else 'failed' end;

  insert into casa_lingobible_user_progress (user_id, lesson_id, status, stars, best_score, attempts, completed_at)
  values (auth.uid(), p_lesson_id, v_status, v_stars, v_score, 1, case when v_status <> 'failed' then now() else null end)
  on conflict (user_id, lesson_id) do update
    set status = excluded.status,
        stars = greatest(casa_lingobible_user_progress.stars, excluded.stars),
        best_score = greatest(casa_lingobible_user_progress.best_score, excluded.best_score),
        attempts = casa_lingobible_user_progress.attempts + 1,
        completed_at = coalesce(excluded.completed_at, casa_lingobible_user_progress.completed_at)
  returning * into v_result;

  if v_status <> 'failed' then
    insert into casa_lingobible_rewards (user_id, lesson_id, xp_awarded) values (auth.uid(), p_lesson_id, v_lesson.xp_reward);
    perform casa_award_xp(auth.uid(), v_lesson.xp_reward, 'lingobible_lesson', 'lingobible_lesson', p_lesson_id);
  end if;

  return v_result;
end;
$$;

revoke all on function casa_lingobible_complete_lesson(uuid) from public;
grant execute on function casa_lingobible_complete_lesson(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'casa_lingobible_paths', 'casa_lingobible_units', 'casa_lingobible_lessons',
    'casa_lingobible_exercises', 'casa_lingobible_exercise_options',
    'casa_lingobible_hearts_config', 'casa_lingobible_user_hearts',
    'casa_lingobible_user_progress', 'casa_lingobible_answers', 'casa_lingobible_rewards'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

create policy "casa_lingobible_paths_public_read" on casa_lingobible_paths for select using (status = 'published' or casa_is_staff());
create policy "casa_lingobible_paths_editor_write" on casa_lingobible_paths for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_lingobible_units_public_read" on casa_lingobible_units for select using (true);
create policy "casa_lingobible_units_editor_write" on casa_lingobible_units for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_lingobible_lessons_public_read" on casa_lingobible_lessons for select using (status = 'published' or casa_is_staff());
create policy "casa_lingobible_lessons_editor_write" on casa_lingobible_lessons for all using (casa_is_editor()) with check (casa_is_editor());

-- Exercises are readable (prompt/options), but correct_answer must never
-- reach the client — expose a safe view instead of the raw table.
create policy "casa_lingobible_exercises_staff_read" on casa_lingobible_exercises for select using (casa_is_staff());
create policy "casa_lingobible_exercises_editor_write" on casa_lingobible_exercises for all using (casa_is_editor()) with check (casa_is_editor());

create view casa_lingobible_exercises_public as
  select id, lesson_id, exercise_type, prompt, passage_reference, passage_text, position
  from casa_lingobible_exercises;

create policy "casa_lingobible_exercise_options_public_read" on casa_lingobible_exercise_options for select using (true);
create policy "casa_lingobible_exercise_options_editor_write" on casa_lingobible_exercise_options for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_lingobible_hearts_config_public_read" on casa_lingobible_hearts_config for select using (true);
create policy "casa_lingobible_hearts_config_admin_write" on casa_lingobible_hearts_config for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_lingobible_user_hearts_owner_only" on casa_lingobible_user_hearts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "casa_lingobible_user_progress_owner_read" on casa_lingobible_user_progress for select using (user_id = auth.uid() or casa_is_staff());
-- No client insert/update policy: writes only via casa_lingobible_complete_lesson().

create policy "casa_lingobible_answers_owner_read" on casa_lingobible_answers for select using (user_id = auth.uid() or casa_is_staff());
-- No insert policy: rows only created via casa_lingobible_submit_exercise().

create policy "casa_lingobible_rewards_owner_read" on casa_lingobible_rewards for select using (user_id = auth.uid() or casa_is_staff());

-- exercise_options.is_correct must not leak to anon/authenticated clients
-- while a lesson is in progress — enforce via a public-safe view too.
create view casa_lingobible_exercise_options_public as
  select id, exercise_id, option_text, position from casa_lingobible_exercise_options;

-- Views are owned by the migration role (owner of the base tables), so per
-- Postgres semantics they run with the owner's privileges and bypass the
-- staff-only RLS above — that is intentional: it is how these two views are
-- allowed to expose prompts/options publicly while the base tables stay
-- staff-only. Grant SELECT explicitly rather than relying on the implicit
-- Supabase auto-expose default.
grant select on casa_lingobible_exercises_public to anon, authenticated;
grant select on casa_lingobible_exercise_options_public to anon, authenticated;

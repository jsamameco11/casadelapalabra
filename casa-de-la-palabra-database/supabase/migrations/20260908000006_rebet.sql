-- Casa de la Palabra — REBET (real-time bible trivia game).
-- Scoring is computed server-side only (casa_rebet_submit_answer), never
-- trusted from the client, per the anti-cheat requirements in the spec.

create table casa_rebet_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon_url text,
  position integer not null default 0,
  is_active boolean not null default true
);

create table casa_rebet_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references casa_rebet_categories (id) on delete restrict,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  question text not null,
  explanation text,
  bible_reference text,
  image_url text,
  audio_url text,
  time_limit_seconds integer not null default 20,
  base_points integer not null default 1000,
  status casa_content_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index casa_rebet_questions_category_idx on casa_rebet_questions (category_id, difficulty, status);

create trigger casa_rebet_questions_updated_at before update on casa_rebet_questions for each row execute function casa_set_updated_at();

create table casa_rebet_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references casa_rebet_questions (id) on delete cascade,
  label text not null, -- 'A' | 'B' | 'C' | 'D'
  option_text text not null,
  is_correct boolean not null default false,
  position integer not null default 0
);

create index casa_rebet_question_options_question_idx on casa_rebet_question_options (question_id);

-- Scoring formula parameters — admin-editable, applied by casa_rebet_submit_answer().
create table casa_rebet_scoring_config (
  id smallint primary key default 1 check (id = 1),
  base_points_multiplier numeric not null default 1.0,
  speed_bonus_max integer not null default 500,
  streak_bonus_per_step integer not null default 50,
  streak_bonus_cap integer not null default 500,
  difficulty_multiplier jsonb not null default '{"easy":1,"medium":1.2,"hard":1.5,"expert":2}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into casa_rebet_scoring_config (id) values (1);

create trigger casa_rebet_scoring_config_updated_at before update on casa_rebet_scoring_config for each row execute function casa_set_updated_at();

create table casa_rebet_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. 'BIBLE2026'
  host_user_id uuid references auth.users (id) on delete set null,
  category_id uuid references casa_rebet_categories (id) on delete set null,
  difficulty text check (difficulty in ('easy', 'medium', 'hard', 'expert', 'mixed')),
  question_count integer not null default 10,
  status text not null default 'lobby' check (status in ('lobby', 'starting', 'in_progress', 'finished', 'closed')),
  current_question_index integer not null default 0,
  mode text not null default 'room' check (mode in ('solo', 'challenge', 'room', 'tournament')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table casa_rebet_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references casa_rebet_rooms (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  guest_name text,
  status text not null default 'joined' check (status in ('joined', 'ready', 'playing', 'disconnected', 'left')),
  score integer not null default 0,
  streak integer not null default 0,
  max_streak integer not null default 0,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (room_id, user_id)
);

create table casa_rebet_games (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references casa_game_sessions (id) on delete set null,
  room_id uuid references casa_rebet_rooms (id) on delete set null,
  user_id uuid references auth.users (id) on delete cascade,
  mode text not null default 'solo' check (mode in ('solo', 'challenge', 'room', 'tournament')),
  category_id uuid references casa_rebet_categories (id) on delete set null,
  difficulty text check (difficulty in ('easy', 'medium', 'hard', 'expert', 'mixed')),
  question_ids uuid[] not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress', 'finished', 'abandoned')),
  score integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index casa_rebet_games_user_idx on casa_rebet_games (user_id, started_at desc);

-- One row per answer. `is_correct`/`points_awarded` are always computed
-- server-side inside casa_rebet_submit_answer — never accepted from the client.
create table casa_rebet_answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references casa_rebet_games (id) on delete cascade,
  question_id uuid not null references casa_rebet_questions (id) on delete restrict,
  selected_option_id uuid references casa_rebet_question_options (id) on delete set null,
  is_correct boolean not null,
  response_time_ms integer not null,
  points_awarded integer not null default 0,
  answered_at timestamptz not null default now(),
  unique (game_id, question_id) -- hard block on double-answering the same question
);

create table casa_rebet_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references casa_rebet_games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  total_questions integer not null,
  correct_count integer not null,
  incorrect_count integer not null,
  accuracy numeric not null,
  score integer not null,
  max_streak integer not null,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create view casa_rebet_leaderboard_global as
  select r.user_id, pr.display_name, pr.avatar_url, sum(r.score) as total_score, count(*) as games_played
  from casa_rebet_results r
  join casa_profiles pr on pr.id = r.user_id
  where pr.is_profile_public and pr.show_in_leaderboards
  group by r.user_id, pr.display_name, pr.avatar_url
  order by total_score desc;

grant select on casa_rebet_leaderboard_global to anon, authenticated;

-- ---------------------------------------------------------------------
-- Server-trusted answer submission.
-- Validates: game belongs to caller, question not already answered, time
-- limit respected, question is part of this game's question set. Computes
-- correctness + points using casa_rebet_scoring_config, never from client input.
-- ---------------------------------------------------------------------
create or replace function casa_rebet_submit_answer(
  p_game_id uuid,
  p_question_id uuid,
  p_selected_option_id uuid,
  p_response_time_ms integer
)
returns table (is_correct boolean, points_awarded integer, correct_option_id uuid, explanation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game casa_rebet_games%rowtype;
  v_question casa_rebet_questions%rowtype;
  v_correct_option_id uuid;
  v_is_correct boolean;
  v_time_limit_ms integer;
  v_cfg casa_rebet_scoring_config%rowtype;
  v_diff_mult numeric;
  v_speed_bonus integer := 0;
  v_streak_bonus integer := 0;
  v_points integer := 0;
  v_current_streak integer;
begin
  select * into v_game from casa_rebet_games where id = p_game_id;
  if v_game is null then raise exception 'game not found'; end if;
  if v_game.user_id <> auth.uid() then raise exception 'not your game'; end if;
  if v_game.status <> 'in_progress' then raise exception 'game already finished'; end if;
  if not (p_question_id = any (v_game.question_ids)) then raise exception 'question not in this game'; end if;

  select * into v_question from casa_rebet_questions where id = p_question_id;
  v_time_limit_ms := v_question.time_limit_seconds * 1000;

  select id into v_correct_option_id from casa_rebet_question_options
    where question_id = p_question_id and is_correct = true limit 1;

  v_is_correct := (p_selected_option_id is not null and p_selected_option_id = v_correct_option_id)
                   and p_response_time_ms <= v_time_limit_ms;

  select * into v_cfg from casa_rebet_scoring_config where id = 1;
  v_diff_mult := coalesce((v_cfg.difficulty_multiplier ->> v_question.difficulty)::numeric, 1);

  if v_is_correct then
    v_speed_bonus := greatest(0, round(v_cfg.speed_bonus_max * (1 - (p_response_time_ms::numeric / v_time_limit_ms))));
    v_current_streak := v_game.current_streak + 1;
    v_streak_bonus := least(v_cfg.streak_bonus_cap, v_current_streak * v_cfg.streak_bonus_per_step);
    v_points := round((v_question.base_points * v_cfg.base_points_multiplier + v_speed_bonus + v_streak_bonus) * v_diff_mult);
  else
    v_current_streak := 0;
  end if;

  insert into casa_rebet_answers (game_id, question_id, selected_option_id, is_correct, response_time_ms, points_awarded)
  values (p_game_id, p_question_id, p_selected_option_id, v_is_correct, p_response_time_ms, v_points)
  on conflict (game_id, question_id) do nothing;

  update casa_rebet_games set
    score = score + v_points,
    correct_count = correct_count + case when v_is_correct then 1 else 0 end,
    incorrect_count = incorrect_count + case when v_is_correct then 0 else 1 end,
    current_streak = v_current_streak,
    max_streak = greatest(max_streak, v_current_streak)
  where id = p_game_id;

  return query select v_is_correct, v_points, v_correct_option_id, v_question.explanation;
end;
$$;

revoke all on function casa_rebet_submit_answer(uuid, uuid, uuid, integer) from public;
grant execute on function casa_rebet_submit_answer(uuid, uuid, uuid, integer) to authenticated;

-- Finalize a game: locks it, writes casa_rebet_results and awards XP via casa_award_xp.
create or replace function casa_rebet_finish_game(p_game_id uuid)
returns casa_rebet_results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game casa_rebet_games%rowtype;
  v_total integer;
  v_accuracy numeric;
  v_xp integer;
  v_result casa_rebet_results%rowtype;
begin
  select * into v_game from casa_rebet_games where id = p_game_id;
  if v_game is null then raise exception 'game not found'; end if;
  if v_game.user_id <> auth.uid() then raise exception 'not your game'; end if;
  if v_game.status = 'finished' then
    select * into v_result from casa_rebet_results where game_id = p_game_id;
    return v_result;
  end if;

  v_total := coalesce(array_length(v_game.question_ids, 1), 0);
  v_accuracy := case when v_total > 0 then round((v_game.correct_count::numeric / v_total) * 100, 1) else 0 end;
  v_xp := v_game.correct_count * 20 + (v_game.score / 100);

  update casa_rebet_games set status = 'finished', finished_at = now() where id = p_game_id;

  insert into casa_rebet_results (game_id, user_id, total_questions, correct_count, incorrect_count, accuracy, score, max_streak, xp_awarded)
  values (p_game_id, v_game.user_id, v_total, v_game.correct_count, v_game.incorrect_count, v_accuracy, v_game.score, v_game.max_streak, v_xp)
  returning * into v_result;

  perform casa_award_xp(v_game.user_id, greatest(v_xp, 1), 'rebet_game', 'rebet_game', p_game_id);

  return v_result;
end;
$$;

revoke all on function casa_rebet_finish_game(uuid) from public;
grant execute on function casa_rebet_finish_game(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'casa_rebet_categories', 'casa_rebet_questions', 'casa_rebet_question_options', 'casa_rebet_scoring_config',
    'casa_rebet_rooms', 'casa_rebet_room_players', 'casa_rebet_games', 'casa_rebet_answers', 'casa_rebet_results'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

create policy "casa_rebet_categories_public_read" on casa_rebet_categories for select using (is_active or casa_is_staff());
create policy "casa_rebet_categories_editor_write" on casa_rebet_categories for all using (casa_is_editor()) with check (casa_is_editor());

-- `explanation` reveals the answer, so it must not be readable up front —
-- keep it staff-only on the base table and serve gameplay from the safe view.
create policy "casa_rebet_questions_staff_read" on casa_rebet_questions for select using (casa_is_staff());
create policy "casa_rebet_questions_editor_write" on casa_rebet_questions for all using (casa_is_editor()) with check (casa_is_editor());

create view casa_rebet_questions_public as
  select id, category_id, difficulty, question, bible_reference, image_url, audio_url, time_limit_seconds, base_points, status
  from casa_rebet_questions
  where status = 'published';

grant select on casa_rebet_questions_public to anon, authenticated;

-- is_correct must never reach the client ahead of an answer being graded —
-- keep the base table staff-only and expose a safe view without that column.
create policy "casa_rebet_question_options_staff_read" on casa_rebet_question_options for select using (casa_is_staff());
create policy "casa_rebet_question_options_editor_write" on casa_rebet_question_options for all using (casa_is_editor()) with check (casa_is_editor());

create view casa_rebet_question_options_public as
  select id, question_id, label, option_text, position from casa_rebet_question_options;

-- Owned by the migration role, so (per Postgres view semantics) it bypasses
-- the staff-only RLS above by design and is safe to expose publicly.
grant select on casa_rebet_question_options_public to anon, authenticated;

create policy "casa_rebet_scoring_config_public_read" on casa_rebet_scoring_config for select using (true);
create policy "casa_rebet_scoring_config_admin_write" on casa_rebet_scoring_config for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_rebet_rooms_public_read" on casa_rebet_rooms for select using (true);
create policy "casa_rebet_rooms_host_write" on casa_rebet_rooms for insert with check (auth.uid() is not null);
create policy "casa_rebet_rooms_host_update" on casa_rebet_rooms for update using (host_user_id = auth.uid() or casa_is_staff());

create policy "casa_rebet_room_players_public_read" on casa_rebet_room_players for select using (true);
create policy "casa_rebet_room_players_self_join" on casa_rebet_room_players for insert with check (user_id = auth.uid());
create policy "casa_rebet_room_players_self_update" on casa_rebet_room_players for update using (user_id = auth.uid() or casa_is_staff());

create policy "casa_rebet_games_owner_only" on casa_rebet_games for select using (user_id = auth.uid() or casa_is_staff());
create policy "casa_rebet_games_owner_insert" on casa_rebet_games for insert with check (user_id = auth.uid());
-- No client-side UPDATE policy: score/status are only ever changed via the
-- security-definer RPCs above, which bypass RLS by design.

create policy "casa_rebet_answers_owner_read" on casa_rebet_answers for select using (
  casa_is_staff() or exists (select 1 from casa_rebet_games g where g.id = game_id and g.user_id = auth.uid())
);
-- No insert policy: rows are only created via casa_rebet_submit_answer().

create policy "casa_rebet_results_owner_read" on casa_rebet_results for select using (user_id = auth.uid() or casa_is_staff());

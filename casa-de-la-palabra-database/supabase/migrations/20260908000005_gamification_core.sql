-- Casa de la Palabra — shared gamification core.
-- REBET, LINGOBIBLE and any future game (crosswords, memory, trivia...) all
-- plug into this same XP/levels/badges/streaks/challenges layer instead of
-- each rolling its own, per the product spec's "arquitectura escalable".

create table casa_gamification_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  total_xp integer not null default 0,
  current_level integer not null default 1,
  current_streak_days integer not null default 0,
  longest_streak_days integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create trigger casa_gamification_profiles_updated_at
  before update on casa_gamification_profiles
  for each row execute function casa_set_updated_at();

-- Configurable level ladder (name + XP threshold), editable from the admin.
create table casa_levels (
  level_number integer primary key,
  name text not null,
  min_xp integer not null,
  icon_url text
);

-- XP is only ever written by trusted server-side code (service role via an
-- Edge Function / RPC), never trusted from the client — see casa_award_xp().
create table casa_xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null, -- 'rebet_game', 'lingobible_lesson', 'daily_challenge', 'streak_bonus', ...
  source_type text,      -- 'rebet_game' | 'lingobible_lesson' | 'challenge' | ...
  source_id uuid,
  created_at timestamptz not null default now()
);

create index casa_xp_transactions_user_idx on casa_xp_transactions (user_id, created_at desc);

create table casa_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon_url text,
  criteria jsonb not null default '{}'::jsonb, -- e.g. {"type":"streak_days","value":7}
  is_active boolean not null default true
);

create table casa_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references casa_badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table casa_streak_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create table casa_daily_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  challenge_type text not null, -- 'answer_questions' | 'complete_lesson' | 'read_chapter' | 'memorize_verse'
  target jsonb not null default '{}'::jsonb,
  xp_reward integer not null default 100,
  active_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table casa_weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal jsonb not null default '{}'::jsonb,
  xp_reward integer not null default 500,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now()
);

create table casa_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_type text not null check (challenge_type in ('daily', 'weekly')),
  challenge_id uuid not null,
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_type, challenge_id)
);

-- Generic session envelope any game mode can reuse.
create table casa_game_sessions (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('rebet', 'lingobible')),
  user_id uuid references auth.users (id) on delete cascade,
  mode text, -- rebet: 'solo' | 'challenge' | 'room' | 'tournament'
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  score integer not null default 0,
  xp_awarded integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index casa_game_sessions_user_idx on casa_game_sessions (user_id, started_at desc);

create table casa_game_rewards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references casa_game_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_type text not null check (reward_type in ('xp', 'badge')),
  reward_ref uuid, -- badge id when reward_type = 'badge'
  amount integer,  -- xp amount when reward_type = 'xp'
  created_at timestamptz not null default now()
);

-- Materialized-ish leaderboard view; refresh on a schedule or read directly
-- since casa_gamification_profiles is small and indexed.
create view casa_leaderboard_global as
  select p.user_id, pr.display_name, pr.avatar_url, p.total_xp, p.current_level
  from casa_gamification_profiles p
  join casa_profiles pr on pr.id = p.user_id
  where pr.is_profile_public and pr.show_in_leaderboards
  order by p.total_xp desc;

create view casa_leaderboard_weekly as
  select x.user_id, pr.display_name, pr.avatar_url, sum(x.amount) as weekly_xp
  from casa_xp_transactions x
  join casa_profiles pr on pr.id = x.user_id
  where x.created_at >= date_trunc('week', now())
    and pr.is_profile_public and pr.show_in_leaderboards
  group by x.user_id, pr.display_name, pr.avatar_url
  order by weekly_xp desc;

-- Owned by the migration role, so it bypasses casa_xp_transactions' owner-only
-- RLS by design — that's how a public leaderboard can read aggregate XP
-- without exposing the underlying per-transaction rows.
grant select on casa_leaderboard_global to anon, authenticated;
grant select on casa_leaderboard_weekly to anon, authenticated;

-- ---------------------------------------------------------------------
-- Server-trusted XP award RPC.
-- The client NEVER sends an XP amount — it sends what happened (reason +
-- source) and this function is the only place that decides how much XP
-- that is worth, then applies it, updates streaks/levels and checks badges.
-- Grant EXECUTE to `authenticated`; revoke direct table INSERT on
-- casa_xp_transactions so this RPC is the only write path from the client.
-- ---------------------------------------------------------------------
create or replace function casa_award_xp(p_user_id uuid, p_amount integer, p_reason text, p_source_type text default null, p_source_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_last_activity date;
  v_current_streak integer;
  v_longest_streak integer;
  v_new_total integer;
  v_new_level integer;
begin
  if p_user_id <> auth.uid() and not casa_is_admin() then
    raise exception 'not authorized to award xp for another user';
  end if;
  if p_amount <= 0 or p_amount > 5000 then
    raise exception 'invalid xp amount';
  end if;

  insert into casa_xp_transactions (user_id, amount, reason, source_type, source_id)
  values (p_user_id, p_amount, p_reason, p_source_type, p_source_id);

  insert into casa_gamification_profiles (user_id, total_xp, current_level, last_activity_date, current_streak_days, longest_streak_days)
  values (p_user_id, 0, 1, null, 0, 0)
  on conflict (user_id) do nothing;

  select last_activity_date, current_streak_days, longest_streak_days
    into v_last_activity, v_current_streak, v_longest_streak
    from casa_gamification_profiles where user_id = p_user_id;

  if v_last_activity is null or v_last_activity = v_today then
    -- first-ever award, or already counted today: streak unchanged.
    null;
  elsif v_last_activity = v_today - 1 then
    v_current_streak := v_current_streak + 1;
  else
    v_current_streak := 1;
  end if;
  v_longest_streak := greatest(v_longest_streak, v_current_streak);

  update casa_gamification_profiles
    set total_xp = total_xp + p_amount,
        last_activity_date = v_today,
        current_streak_days = v_current_streak,
        longest_streak_days = v_longest_streak
    where user_id = p_user_id
    returning total_xp into v_new_total;

  select level_number into v_new_level from casa_levels where min_xp <= v_new_total order by min_xp desc limit 1;
  if v_new_level is not null then
    update casa_gamification_profiles set current_level = v_new_level where user_id = p_user_id;
  end if;

  insert into casa_streak_activity (user_id, activity_date) values (p_user_id, v_today)
  on conflict (user_id, activity_date) do nothing;
end;
$$;

revoke all on function casa_award_xp(uuid, integer, text, text, uuid) from public;
grant execute on function casa_award_xp(uuid, integer, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table casa_gamification_profiles enable row level security;
alter table casa_levels enable row level security;
alter table casa_xp_transactions enable row level security;
alter table casa_badges enable row level security;
alter table casa_user_badges enable row level security;
alter table casa_streak_activity enable row level security;
alter table casa_daily_challenges enable row level security;
alter table casa_weekly_challenges enable row level security;
alter table casa_challenge_progress enable row level security;
alter table casa_game_sessions enable row level security;
alter table casa_game_rewards enable row level security;

create policy "casa_gamification_profiles_read" on casa_gamification_profiles for select using (true);
create policy "casa_gamification_profiles_no_direct_write" on casa_gamification_profiles for update using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_levels_public_read" on casa_levels for select using (true);
create policy "casa_levels_admin_write" on casa_levels for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_xp_transactions_owner_read" on casa_xp_transactions for select using (user_id = auth.uid() or casa_is_staff());
-- No insert/update/delete policy on purpose: writes only via casa_award_xp() (security definer).

create policy "casa_badges_public_read" on casa_badges for select using (true);
create policy "casa_badges_admin_write" on casa_badges for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_user_badges_public_read" on casa_user_badges for select using (true);
create policy "casa_user_badges_system_insert" on casa_user_badges for insert with check (casa_is_admin());

create policy "casa_streak_activity_owner_only" on casa_streak_activity for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "casa_daily_challenges_public_read" on casa_daily_challenges for select using (true);
create policy "casa_daily_challenges_admin_write" on casa_daily_challenges for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_weekly_challenges_public_read" on casa_weekly_challenges for select using (true);
create policy "casa_weekly_challenges_admin_write" on casa_weekly_challenges for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_challenge_progress_owner_only" on casa_challenge_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "casa_game_sessions_owner_only" on casa_game_sessions for all using (user_id = auth.uid() or casa_is_staff()) with check (user_id = auth.uid());

create policy "casa_game_rewards_owner_read" on casa_game_rewards for select using (user_id = auth.uid() or casa_is_staff());

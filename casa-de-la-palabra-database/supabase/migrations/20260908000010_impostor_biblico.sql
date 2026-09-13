-- Casa de la Palabra — EL IMPOSTOR BÍBLICO (third game).
-- Reuses the shared gamification core (casa_award_xp, casa_game_sessions);
-- does NOT touch any casa_rebet_* or casa_lingobible_* table. Reversible:
-- a DROP of every casa_impostor_* object + reverting the game check
-- constraint fully undoes this migration.

alter table casa_game_sessions drop constraint if exists casa_game_sessions_game_check;
alter table casa_game_sessions add constraint casa_game_sessions_game_check
  check (game in ('rebet', 'lingobible', 'impostor_biblico'));

create table casa_impostor_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  position integer not null default 0,
  is_active boolean not null default true
);

-- The secret word bank. Never selected directly by players — always served
-- through casa_impostor_random_word() / casa_impostor_get_my_card() so the
-- full bank (and upcoming answers) never reaches the client.
create table casa_impostor_words (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references casa_impostor_categories (id) on delete restrict,
  word text not null,
  related_word text, -- reserved for a future "hard mode" impostor hint
  hint_reference text, -- shown post-reveal for educational value
  status casa_content_status not null default 'published',
  created_at timestamptz not null default now()
);

create index casa_impostor_words_category_idx on casa_impostor_words (category_id, status);

create table casa_impostor_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid references auth.users (id) on delete set null,
  category_id uuid references casa_impostor_categories (id) on delete set null, -- null = mixed
  impostor_count integer not null default 1,
  clue_rounds integer not null default 2,
  status text not null default 'lobby' check (status in ('lobby', 'in_progress', 'voting', 'revealed', 'closed')),
  current_word_id uuid references casa_impostor_words (id) on delete set null,
  current_round integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

-- is_impostor is the crown jewel to protect: RLS below only ever lets a
-- player SELECT their own row from this table. Everyone else's roster info
-- (name/status, never is_impostor) comes from casa_impostor_players_public.
create table casa_impostor_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references casa_impostor_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  is_impostor boolean not null default false,
  status text not null default 'joined' check (status in ('joined', 'playing', 'left', 'kicked')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (room_id, user_id)
);

create index casa_impostor_players_room_idx on casa_impostor_players (room_id);

-- voted_for_player_id is the second secret: hidden until casa_impostor_reveal
-- tallies it. casa_impostor_votes_public exposes only "who has voted".
create table casa_impostor_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references casa_impostor_rooms (id) on delete cascade,
  round integer not null,
  voter_player_id uuid not null references casa_impostor_players (id) on delete cascade,
  voted_for_player_id uuid not null references casa_impostor_players (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (room_id, round, voter_player_id)
);

create view casa_impostor_players_public as
  select id, room_id, user_id, display_name, status, joined_at
  from casa_impostor_players;

create view casa_impostor_votes_public as
  select room_id, round, voter_player_id, created_at
  from casa_impostor_votes;

grant select on casa_impostor_players_public to anon, authenticated;
grant select on casa_impostor_votes_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- RPCs — every state transition and every read of a secret goes through
-- one of these (security definer), never a raw client insert/update/select
-- on the sensitive columns. Mirrors the anti-cheat pattern already used by
-- casa_rebet_submit_answer / casa_lingobible_complete_lesson.
-- ---------------------------------------------------------------------

create or replace function casa_impostor_random_word(p_category_slug text default null)
returns table (word_id uuid, word text, hint_reference text, category_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select w.id, w.word, w.hint_reference, c.name
    from casa_impostor_words w
    join casa_impostor_categories c on c.id = w.category_id
    where w.status = 'published'
      and c.is_active
      and (p_category_slug is null or p_category_slug = 'mixed' or c.slug = p_category_slug)
    order by random()
    limit 1;
end;
$$;

revoke all on function casa_impostor_random_word(text) from public;
grant execute on function casa_impostor_random_word(text) to authenticated;

create or replace function casa_impostor_create_room(
  p_category_slug text default null,
  p_impostor_count integer default 1,
  p_clue_rounds integer default 2
)
returns casa_impostor_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id uuid;
  v_code text;
  v_room casa_impostor_rooms%rowtype;
  v_tokens text[] := array['ARCA','LUZ','FE','REY','PAZ','VID','SOL','MAR','ROCA','MANA'];
  v_attempts integer := 0;
begin
  if p_impostor_count < 1 then
    raise exception 'impostor_count debe ser al menos 1';
  end if;

  if p_category_slug is not null and p_category_slug <> 'mixed' then
    select id into v_category_id from casa_impostor_categories where slug = p_category_slug and is_active;
    if v_category_id is null then raise exception 'categoría no encontrada'; end if;
  end if;

  loop
    v_code := v_tokens[1 + floor(random() * array_length(v_tokens, 1))::int] || floor(random() * 900 + 100)::int;
    exit when not exists (select 1 from casa_impostor_rooms where code = v_code) or v_attempts > 10;
    v_attempts := v_attempts + 1;
  end loop;

  insert into casa_impostor_rooms (code, host_user_id, category_id, impostor_count, clue_rounds)
  values (v_code, auth.uid(), v_category_id, p_impostor_count, greatest(1, p_clue_rounds))
  returning * into v_room;

  insert into casa_impostor_players (room_id, user_id, display_name)
  values (v_room.id, auth.uid(), null);

  return v_room;
end;
$$;

revoke all on function casa_impostor_create_room(text, integer, integer) from public;
grant execute on function casa_impostor_create_room(text, integer, integer) to authenticated;

create or replace function casa_impostor_join_room(p_code text, p_display_name text default null)
returns casa_impostor_players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room casa_impostor_rooms%rowtype;
  v_player casa_impostor_players%rowtype;
begin
  select * into v_room from casa_impostor_rooms where code = upper(p_code);
  if v_room is null then raise exception 'sala no encontrada'; end if;
  if v_room.status = 'closed' then raise exception 'la sala está cerrada'; end if;

  select * into v_player from casa_impostor_players where room_id = v_room.id and user_id = auth.uid();

  if v_player is null then
    if v_room.status <> 'lobby' then
      raise exception 'la partida ya comenzó, no se puede unir ahora';
    end if;
    insert into casa_impostor_players (room_id, user_id, display_name)
    values (v_room.id, auth.uid(), p_display_name)
    returning * into v_player;
  else
    update casa_impostor_players
      set status = case when status = 'kicked' then 'kicked' else 'joined' end,
          left_at = null,
          display_name = coalesce(p_display_name, display_name)
      where id = v_player.id
      returning * into v_player;
  end if;

  return v_player;
end;
$$;

revoke all on function casa_impostor_join_room(text, text) from public;
grant execute on function casa_impostor_join_room(text, text) to authenticated;

create or replace function casa_impostor_start_game(p_room_id uuid)
returns casa_impostor_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room casa_impostor_rooms%rowtype;
  v_category_slug text;
  v_word record;
  v_player_count integer;
  v_impostor_ids uuid[];
begin
  select * into v_room from casa_impostor_rooms where id = p_room_id;
  if v_room is null then raise exception 'sala no encontrada'; end if;
  if v_room.host_user_id <> auth.uid() then raise exception 'solo el anfitrión puede iniciar la partida'; end if;
  if v_room.status not in ('lobby', 'revealed') then raise exception 'la partida no está lista para iniciar'; end if;

  select count(*) into v_player_count from casa_impostor_players where room_id = p_room_id and status <> 'kicked' and status <> 'left';
  if v_player_count < 3 then raise exception 'se necesitan al menos 3 jugadores'; end if;
  if v_room.impostor_count >= v_player_count then raise exception 'demasiados impostores para la cantidad de jugadores'; end if;

  select slug into v_category_slug from casa_impostor_categories where id = v_room.category_id;
  select * into v_word from casa_impostor_random_word(v_category_slug);
  if v_word.word_id is null then raise exception 'no hay palabras publicadas para esta categoría'; end if;

  update casa_impostor_players set is_impostor = false, status = 'playing'
    where room_id = p_room_id and status not in ('kicked', 'left');

  select array_agg(id) into v_impostor_ids from (
    select id from casa_impostor_players
    where room_id = p_room_id and status = 'playing'
    order by random()
    limit v_room.impostor_count
  ) sub;

  update casa_impostor_players set is_impostor = true where id = any (v_impostor_ids);

  update casa_impostor_rooms set
    current_word_id = v_word.word_id,
    status = 'in_progress',
    current_round = current_round + 1,
    started_at = coalesce(started_at, now())
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

revoke all on function casa_impostor_start_game(uuid) from public;
grant execute on function casa_impostor_start_game(uuid) to authenticated;

create or replace function casa_impostor_get_my_card(p_room_id uuid)
returns table (is_impostor boolean, word text, category_name text, hint_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player casa_impostor_players%rowtype;
  v_room casa_impostor_rooms%rowtype;
begin
  select * into v_player from casa_impostor_players where room_id = p_room_id and user_id = auth.uid();
  if v_player is null then raise exception 'no perteneces a esta sala'; end if;

  select * into v_room from casa_impostor_rooms where id = p_room_id;
  if v_room.status = 'lobby' then raise exception 'la partida aún no comienza'; end if;

  return query
    select
      v_player.is_impostor,
      case when v_player.is_impostor then null else w.word end,
      c.name,
      case when v_player.is_impostor then null else w.hint_reference end
    from casa_impostor_words w
    join casa_impostor_categories c on c.id = w.category_id
    where w.id = v_room.current_word_id;
end;
$$;

revoke all on function casa_impostor_get_my_card(uuid) from public;
grant execute on function casa_impostor_get_my_card(uuid) to authenticated;

create or replace function casa_impostor_cast_vote(p_room_id uuid, p_voted_for_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter casa_impostor_players%rowtype;
  v_room casa_impostor_rooms%rowtype;
begin
  select * into v_voter from casa_impostor_players where room_id = p_room_id and user_id = auth.uid();
  if v_voter is null then raise exception 'no perteneces a esta sala'; end if;
  if v_voter.id = p_voted_for_player_id then raise exception 'no puedes votarte a ti mismo'; end if;
  if not exists (select 1 from casa_impostor_players where id = p_voted_for_player_id and room_id = p_room_id) then
    raise exception 'jugador inválido';
  end if;

  select * into v_room from casa_impostor_rooms where id = p_room_id;
  if v_room.status not in ('in_progress', 'voting') then raise exception 'no es momento de votar'; end if;

  if v_room.status = 'in_progress' then
    update casa_impostor_rooms set status = 'voting' where id = p_room_id;
  end if;

  insert into casa_impostor_votes (room_id, round, voter_player_id, voted_for_player_id)
  values (p_room_id, v_room.current_round, v_voter.id, p_voted_for_player_id)
  on conflict (room_id, round, voter_player_id)
  do update set voted_for_player_id = excluded.voted_for_player_id, created_at = now();
end;
$$;

revoke all on function casa_impostor_cast_vote(uuid, uuid) from public;
grant execute on function casa_impostor_cast_vote(uuid, uuid) to authenticated;

create or replace function casa_impostor_reveal(p_room_id uuid)
returns table (
  impostor_caught boolean,
  impostor_player_ids uuid[],
  most_voted_player_id uuid,
  word text,
  hint_reference text,
  category_name text,
  vote_counts jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room casa_impostor_rooms%rowtype;
  v_total_votes integer;
  v_top_count integer;
  v_top_player uuid;
  v_tie boolean;
  v_impostor_ids uuid[];
  v_caught boolean;
  v_counts jsonb;
  v_word record;
begin
  select * into v_room from casa_impostor_rooms where id = p_room_id;
  if v_room is null then raise exception 'sala no encontrada'; end if;
  if v_room.host_user_id <> auth.uid() then raise exception 'solo el anfitrión puede revelar resultados'; end if;

  select array_agg(id) into v_impostor_ids from casa_impostor_players where room_id = p_room_id and is_impostor;

  select coalesce(jsonb_object_agg(voted_for_player_id, cnt), '{}'::jsonb)
    into v_counts
    from (
      select voted_for_player_id, count(*) as cnt
      from casa_impostor_votes
      where room_id = p_room_id and round = v_room.current_round
      group by voted_for_player_id
    ) t;

  select count(*) into v_total_votes from casa_impostor_votes where room_id = p_room_id and round = v_room.current_round;

  select voted_for_player_id, cnt into v_top_player, v_top_count
    from (
      select voted_for_player_id, count(*) as cnt
      from casa_impostor_votes
      where room_id = p_room_id and round = v_room.current_round
      group by voted_for_player_id
      order by cnt desc
      limit 1
    ) t;

  select count(*) > 1 into v_tie
    from (
      select voted_for_player_id, count(*) as cnt
      from casa_impostor_votes
      where room_id = p_room_id and round = v_room.current_round
      group by voted_for_player_id
      having count(*) = v_top_count
    ) ties;

  v_caught := v_top_player is not null
    and not v_tie
    and v_top_player = any (v_impostor_ids)
    and v_top_count * 2 > v_total_votes;

  select w.word, w.hint_reference, c.name into v_word
    from casa_impostor_words w join casa_impostor_categories c on c.id = w.category_id
    where w.id = v_room.current_word_id;

  if v_caught then
    perform casa_award_xp(p.user_id, 100, 'impostor_biblico_live', 'impostor_biblico', p_room_id)
      from casa_impostor_players p
      where p.room_id = p_room_id and not p.is_impostor and p.status = 'playing';
  else
    perform casa_award_xp(p.user_id, 150, 'impostor_biblico_live', 'impostor_biblico', p_room_id)
      from casa_impostor_players p
      where p.room_id = p_room_id and p.is_impostor;
  end if;

  update casa_impostor_rooms set status = 'revealed', ended_at = now() where id = p_room_id;

  return query select v_caught, v_impostor_ids, v_top_player, v_word.word, v_word.hint_reference, v_word.name, v_counts;
end;
$$;

revoke all on function casa_impostor_reveal(uuid) from public;
grant execute on function casa_impostor_reveal(uuid) to authenticated;

-- Read-only counterpart to casa_impostor_reveal(): any player in the room
-- (not just the host) calls this once casa_impostor_rooms.status = 'revealed'
-- to fetch the same result payload — no XP is re-awarded here.
create or replace function casa_impostor_get_reveal_result(p_room_id uuid)
returns table (
  impostor_caught boolean,
  impostor_player_ids uuid[],
  most_voted_player_id uuid,
  word text,
  hint_reference text,
  category_name text,
  vote_counts jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room casa_impostor_rooms%rowtype;
  v_impostor_ids uuid[];
  v_counts jsonb;
  v_total_votes integer;
  v_top_player uuid;
  v_top_count integer;
  v_tie boolean;
  v_caught boolean;
  v_word record;
begin
  select * into v_room from casa_impostor_rooms where id = p_room_id;
  if v_room is null then raise exception 'sala no encontrada'; end if;
  if v_room.status <> 'revealed' then raise exception 'los resultados aún no se revelan'; end if;
  if not exists (select 1 from casa_impostor_players where room_id = p_room_id and user_id = auth.uid()) then
    raise exception 'no perteneces a esta sala';
  end if;

  select array_agg(id) into v_impostor_ids from casa_impostor_players where room_id = p_room_id and is_impostor;

  select coalesce(jsonb_object_agg(voted_for_player_id, cnt), '{}'::jsonb) into v_counts
    from (
      select voted_for_player_id, count(*) as cnt
      from casa_impostor_votes
      where room_id = p_room_id and round = v_room.current_round
      group by voted_for_player_id
    ) t;

  select count(*) into v_total_votes from casa_impostor_votes where room_id = p_room_id and round = v_room.current_round;

  select voted_for_player_id, cnt into v_top_player, v_top_count
    from (
      select voted_for_player_id, count(*) as cnt
      from casa_impostor_votes
      where room_id = p_room_id and round = v_room.current_round
      group by voted_for_player_id
      order by cnt desc
      limit 1
    ) t;

  select count(*) > 1 into v_tie
    from (
      select voted_for_player_id, count(*) as cnt
      from casa_impostor_votes
      where room_id = p_room_id and round = v_room.current_round
      group by voted_for_player_id
      having count(*) = v_top_count
    ) ties;

  v_caught := v_top_player is not null and not v_tie and v_top_player = any (v_impostor_ids) and v_top_count * 2 > v_total_votes;

  select w.word, w.hint_reference, c.name into v_word
    from casa_impostor_words w join casa_impostor_categories c on c.id = w.category_id
    where w.id = v_room.current_word_id;

  return query select v_caught, v_impostor_ids, v_top_player, v_word.word, v_word.hint_reference, v_word.name, v_counts;
end;
$$;

revoke all on function casa_impostor_get_reveal_result(uuid) from public;
grant execute on function casa_impostor_get_reveal_result(uuid) to authenticated;

create or replace function casa_impostor_kick_player(p_room_id uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from casa_impostor_rooms where id = p_room_id and host_user_id = auth.uid()) then
    raise exception 'solo el anfitrión puede expulsar jugadores';
  end if;
  update casa_impostor_players set status = 'kicked', left_at = now() where id = p_player_id and room_id = p_room_id;
end;
$$;

revoke all on function casa_impostor_kick_player(uuid, uuid) from public;
grant execute on function casa_impostor_kick_player(uuid, uuid) to authenticated;

create or replace function casa_impostor_close_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from casa_impostor_rooms where id = p_room_id and host_user_id = auth.uid()) then
    raise exception 'solo el anfitrión puede cerrar la sala';
  end if;
  update casa_impostor_rooms set status = 'closed', ended_at = now() where id = p_room_id;
end;
$$;

revoke all on function casa_impostor_close_room(uuid) from public;
grant execute on function casa_impostor_close_room(uuid) to authenticated;

create or replace function casa_impostor_leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update casa_impostor_players set status = 'left', left_at = now()
    where room_id = p_room_id and user_id = auth.uid();
end;
$$;

revoke all on function casa_impostor_leave_room(uuid) from public;
grant execute on function casa_impostor_leave_room(uuid) to authenticated;

-- Modo "un solo celular": no room/players involved (single authenticated
-- host, physical pass-the-phone). Awards a small flat participation XP —
-- the app has no way to verify a socially-adjudicated local outcome, so it
-- deliberately does not reward a claimed "win" (see spec point 105).
create or replace function casa_impostor_complete_local_round(p_word_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from casa_impostor_words where id = p_word_id) then
    raise exception 'palabra inválida';
  end if;
  insert into casa_game_sessions (game, user_id, mode, status, started_at, ended_at)
  values ('impostor_biblico', auth.uid(), 'local', 'completed', now(), now());

  perform casa_award_xp(auth.uid(), 20, 'impostor_biblico_local', 'impostor_biblico', p_word_id);
end;
$$;

revoke all on function casa_impostor_complete_local_round(uuid) from public;
grant execute on function casa_impostor_complete_local_round(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table casa_impostor_categories enable row level security;
alter table casa_impostor_words enable row level security;
alter table casa_impostor_rooms enable row level security;
alter table casa_impostor_players enable row level security;
alter table casa_impostor_votes enable row level security;

create policy "casa_impostor_categories_public_read" on casa_impostor_categories for select using (is_active or casa_is_staff());
create policy "casa_impostor_categories_editor_write" on casa_impostor_categories for all using (casa_is_editor()) with check (casa_is_editor());

-- The word bank itself is staff-only: gameplay never selects it directly,
-- only through the security-definer RPCs above.
create policy "casa_impostor_words_staff_read" on casa_impostor_words for select using (casa_is_staff());
create policy "casa_impostor_words_editor_write" on casa_impostor_words for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_impostor_rooms_public_read" on casa_impostor_rooms for select using (true);
-- No direct insert/update policy: rooms are only created/mutated through
-- casa_impostor_create_room / start_game / reveal / kick / close (all
-- security definer), which double-check host_user_id = auth.uid() themselves.

create policy "casa_impostor_players_own_row_read" on casa_impostor_players
  for select using (user_id = auth.uid() or casa_is_staff());
-- No direct insert/update policy: rows are only written via
-- casa_impostor_create_room / join_room / start_game / kick (security definer).

create policy "casa_impostor_votes_own_row_read" on casa_impostor_votes
  for select using (
    casa_is_staff()
    or exists (select 1 from casa_impostor_players p where p.id = voter_player_id and p.user_id = auth.uid())
  );
-- No direct insert policy: votes are only written via casa_impostor_cast_vote().

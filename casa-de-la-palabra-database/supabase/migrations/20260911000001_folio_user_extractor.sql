-- Extractor de usuarios hacia la base maestra (Folio).
--
-- Casa de la Palabra y la base maestra viven en el MISMO Postgres, así que la
-- extracción no necesita red, credenciales ni un servicio aparte: es una
-- función que lee las tablas casa_* y deja el resultado ya categorizado en una
-- tabla maestra que cualquier app del ecosistema puede alimentar igual.
--
--   folio_app_users     -> una fila por (usuario, app): métricas y segmento
--   folio_user_overview -> vista unificada: comercial + presencia multi-app
--   folio_sync_casa_users() -> el extractor de esta app

-- ---------------------------------------------------------------------
-- Tabla maestra: un registro por usuario y por app
-- ---------------------------------------------------------------------
create table if not exists folio_app_users (
  user_id uuid not null references auth.users (id) on delete cascade,
  app text not null,
  first_seen_at timestamptz,
  last_activity_at timestamptz,
  -- 0-100. Mezcla recencia, constancia, profundidad y variedad de uso.
  engagement_score smallint not null default 0 check (engagement_score between 0 and 100),
  segment text not null default 'nuevo'
    check (segment in ('nuevo', 'activo', 'comprometido', 'en_riesgo', 'inactivo')),
  -- Qué le interesa: 'biblia', 'juegos', 'estudios'.
  interests text[] not null default '{}',
  -- Métricas crudas por app; cada app define sus llaves.
  metrics jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  primary key (user_id, app)
);

create index if not exists folio_app_users_app_segment_idx on folio_app_users (app, segment);
create index if not exists folio_app_users_last_activity_idx on folio_app_users (last_activity_at desc nulls last);

comment on table folio_app_users is
  'Base maestra: usuario x app, con segmento y métricas. Cada app la alimenta con su propio extractor (ver folio_sync_casa_users).';

alter table folio_app_users enable row level security;

-- Solo el staff lee esto; nadie escribe directo (solo la función extractora).
drop policy if exists "folio_app_users_staff_read" on folio_app_users;
create policy "folio_app_users_staff_read" on folio_app_users
  for select using (casa_is_staff());

-- ---------------------------------------------------------------------
-- El extractor de Casa de la Palabra
-- ---------------------------------------------------------------------
create or replace function folio_sync_casa_users()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  synced integer;
begin
  if not casa_is_admin() then
    raise exception 'Solo un administrador puede ejecutar la sincronización.'
      using errcode = '42501';
  end if;

  with biblia as (
    select user_id, count(*) as chapters_read, max(read_at) as last_read_at
    from casa_bible_reading_history group by user_id
  ),
  favoritos as (select user_id, count(*) as n, max(created_at) as last_at from casa_bible_favorites group by user_id),
  notas as (select user_id, count(*) as n, max(updated_at) as last_at from casa_bible_notes group by user_id),
  subrayados as (select user_id, count(*) as n, max(created_at) as last_at from casa_bible_highlights group by user_id),
  partidas as (
    select user_id,
           count(*) as played,
           count(*) filter (where status = 'completed') as completed,
           coalesce(max(score), 0) as best_score,
           max(coalesce(ended_at, started_at)) as last_at
    from casa_game_sessions where user_id is not null group by user_id
  ),
  lecciones as (
    select user_id,
           count(*) filter (where status in ('completed', 'perfect')) as completed,
           max(updated_at) as last_at
    from casa_lingobible_user_progress group by user_id
  ),
  estudios as (
    select user_id,
           count(*) as started,
           count(*) filter (where completed_at is not null) as completed,
           max(updated_at) as last_at
    from casa_study_progress group by user_id
  ),
  insignias as (select user_id, count(*) as n, max(awarded_at) as last_at from casa_user_badges group by user_id),
  dias_activos as (select user_id, count(*) as n, max(activity_date) as last_date from casa_streak_activity group by user_id),
  base as (
    select
      p.id as user_id,
      p.created_at as first_seen_at,
      -- El momento real de la última señal de vida, venga de donde venga.
      greatest(
        coalesce(g.last_activity_date::timestamptz, 'epoch'::timestamptz),
        coalesce(b.last_read_at, 'epoch'::timestamptz),
        coalesce(f.last_at, 'epoch'::timestamptz),
        coalesce(n.last_at, 'epoch'::timestamptz),
        coalesce(s.last_at, 'epoch'::timestamptz),
        coalesce(pa.last_at, 'epoch'::timestamptz),
        coalesce(l.last_at, 'epoch'::timestamptz),
        coalesce(e.last_at, 'epoch'::timestamptz),
        coalesce(i.last_at, 'epoch'::timestamptz),
        coalesce(d.last_date::timestamptz, 'epoch'::timestamptz)
      ) as last_activity_raw,
      coalesce(g.total_xp, 0) as total_xp,
      coalesce(g.current_level, 1) as current_level,
      coalesce(g.current_streak_days, 0) as streak_current,
      coalesce(g.longest_streak_days, 0) as streak_longest,
      coalesce(d.n, 0) as active_days,
      coalesce(b.chapters_read, 0) as chapters_read,
      coalesce(f.n, 0) as favoritos,
      coalesce(n.n, 0) as notas,
      coalesce(s.n, 0) as subrayados,
      coalesce(pa.played, 0) as partidas,
      coalesce(pa.completed, 0) as partidas_completadas,
      coalesce(l.completed, 0) as lecciones,
      coalesce(e.started, 0) as estudios_iniciados,
      coalesce(e.completed, 0) as estudios_completados,
      coalesce(i.n, 0) as insignias
    from casa_profiles p
    left join casa_gamification_profiles g on g.user_id = p.id
    left join biblia b on b.user_id = p.id
    left join favoritos f on f.user_id = p.id
    left join notas n on n.user_id = p.id
    left join subrayados s on s.user_id = p.id
    left join partidas pa on pa.user_id = p.id
    left join lecciones l on l.user_id = p.id
    left join estudios e on e.user_id = p.id
    left join insignias i on i.user_id = p.id
    left join dias_activos d on d.user_id = p.id
  ),
  calculado as (
    select
      base.*,
      nullif(last_activity_raw, 'epoch'::timestamptz) as last_activity_at,
      (chapters_read + favoritos + notas + subrayados) > 0 as usa_biblia,
      (partidas + lecciones) > 0 as usa_juegos,
      estudios_iniciados > 0 as usa_estudios
    from base
  ),
  puntuado as (
    select
      calculado.*,
      extract(day from now() - last_activity_at)::int as dias_inactivo,
      least(100, (
        -- Recencia (0-40): pesa más que nada, es la señal de si sigue ahí.
        case
          when last_activity_at is null then 0
          when now() - last_activity_at <= interval '7 days' then 40
          when now() - last_activity_at <= interval '14 days' then 28
          when now() - last_activity_at <= interval '30 days' then 15
          when now() - last_activity_at <= interval '90 days' then 5
          else 0
        end
        -- Constancia (0-20)
        + least(streak_current, 20)
        -- Profundidad (0-20): 1 punto por cada 100 XP
        + least(total_xp / 100, 20)
        -- Variedad (0-20): usar más de un módulo vale más que hundirse en uno
        + (case when usa_biblia then 7 else 0 end)
        + (case when usa_juegos then 7 else 0 end)
        + (case when usa_estudios then 6 else 0 end)
      ))::smallint as engagement_score
    from calculado
  )
  insert into folio_app_users
    (user_id, app, first_seen_at, last_activity_at, engagement_score, segment, interests, metrics, synced_at)
  select
    user_id,
    'casa-de-la-palabra',
    first_seen_at,
    last_activity_at,
    engagement_score,
    case
      when last_activity_at is null or dias_inactivo > 45 then 'inactivo'
      when dias_inactivo > 14 then 'en_riesgo'
      when streak_current >= 7 or engagement_score >= 70 then 'comprometido'
      when first_seen_at > now() - interval '14 days' and active_days <= 2 then 'nuevo'
      else 'activo'
    end,
    array_remove(array[
      case when usa_biblia then 'biblia' end,
      case when usa_juegos then 'juegos' end,
      case when usa_estudios then 'estudios' end
    ], null),
    jsonb_build_object(
      'total_xp', total_xp,
      'nivel', current_level,
      'racha_actual', streak_current,
      'racha_maxima', streak_longest,
      'dias_activos', active_days,
      'capitulos_leidos', chapters_read,
      'favoritos', favoritos,
      'notas', notas,
      'subrayados', subrayados,
      'partidas', partidas,
      'partidas_completadas', partidas_completadas,
      'lecciones_completadas', lecciones,
      'estudios_iniciados', estudios_iniciados,
      'estudios_completados', estudios_completados,
      'insignias', insignias
    ),
    now()
  from puntuado
  on conflict (user_id, app) do update set
    first_seen_at = excluded.first_seen_at,
    last_activity_at = excluded.last_activity_at,
    engagement_score = excluded.engagement_score,
    segment = excluded.segment,
    interests = excluded.interests,
    metrics = excluded.metrics,
    synced_at = excluded.synced_at;

  get diagnostics synced = row_count;
  return synced;
end;
$$;

comment on function folio_sync_casa_users is
  'Extrae la actividad de Casa de la Palabra y la deja categorizada en folio_app_users. Idempotente: se puede correr cuantas veces se quiera.';

revoke all on function folio_sync_casa_users() from public;
grant execute on function folio_sync_casa_users() to authenticated;

-- ---------------------------------------------------------------------
-- Vista unificada: lo comercial de la maestra + presencia en todas las apps
-- ---------------------------------------------------------------------
-- Se crea dentro de un bloque condicional porque `profiles` e `installs` son
-- tablas de la maestra que ya existían antes de este proyecto: si algún día
-- cambian de forma, preferimos que la vista se omita con un aviso a que falle
-- la migración entera.
do $$
begin
  if to_regclass('public.profiles') is null or to_regclass('public.installs') is null then
    raise notice 'folio_user_overview omitida: faltan las tablas maestras profiles/installs.';
    return;
  end if;

  execute $view$
    create or replace view folio_user_overview as
    select
      u.id as user_id,
      u.email,
      cp.display_name,
      cp.avatar_url,
      -- Comercial (viene de la maestra, no de esta app)
      pr.role as folio_role,
      pr.plan,
      pr.status as account_status,
      -- Presencia multi-app: installs cubre todo el ecosistema
      coalesce(
        (select array_agg(distinct i.app order by i.app) from installs i where i.user_id = u.id),
        '{}'
      ) as apps,
      (select max(i.last_seen_at) from installs i where i.user_id = u.id) as last_seen_any_app,
      -- Métricas ricas donde exista un extractor
      fa.app as app_principal,
      fa.segment,
      fa.engagement_score,
      fa.interests,
      fa.last_activity_at,
      fa.metrics,
      fa.synced_at
    from auth.users u
    left join casa_profiles cp on cp.id = u.id
    left join profiles pr on pr.id = u.id
    left join lateral (
      select * from folio_app_users f
      where f.user_id = u.id
      order by f.engagement_score desc, f.last_activity_at desc nulls last
      limit 1
    ) fa on true;
  $view$;

  -- Deliberadamente NO se otorga a `authenticated`: una vista corre con los
  -- permisos de su dueño, así que darla al rol de usuarios logueados expondría
  -- el correo y la actividad de todos. Queda para uso interno (SQL editor,
  -- service_role); las apps la consultan por la función de abajo, que sí
  -- verifica que quien pregunta sea staff.
  execute 'revoke all on folio_user_overview from public, anon, authenticated';
exception
  when undefined_column or undefined_table then
    raise notice 'folio_user_overview omitida: las tablas maestras no tienen la forma esperada (%). El extractor y folio_app_users sí quedaron instalados.', sqlerrm;
end;
$$;

-- Único acceso desde las apps: verifica staff antes de devolver nada.
create or replace function folio_list_users(p_limit integer default 100, p_offset integer default 0)
returns table (
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  folio_role text,
  plan text,
  account_status text,
  apps text[],
  last_seen_any_app timestamptz,
  segment text,
  engagement_score smallint,
  interests text[],
  last_activity_at timestamptz,
  metrics jsonb,
  synced_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not casa_is_staff() then
    raise exception 'Solo el staff puede consultar la ficha de usuarios.'
      using errcode = '42501';
  end if;

  return query
  select
    v.user_id, v.email::text, v.display_name, v.avatar_url,
    v.folio_role::text, v.plan::text, v.account_status::text,
    v.apps, v.last_seen_any_app,
    v.segment, v.engagement_score, v.interests, v.last_activity_at, v.metrics, v.synced_at
  from folio_user_overview v
  order by v.engagement_score desc nulls last, v.last_activity_at desc nulls last
  limit least(greatest(p_limit, 1), 500)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function folio_list_users(integer, integer) from public;
grant execute on function folio_list_users(integer, integer) to authenticated;

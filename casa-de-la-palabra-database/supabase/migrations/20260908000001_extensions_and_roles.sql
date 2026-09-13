-- Casa de la Palabra — base extensions, roles and helper functions.
-- All objects created by this project are prefixed with `casa_` to stay
-- clearly isolated from any other application sharing this Supabase project.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- The built-in single-argument unaccent(text) is STABLE (it resolves the
-- dictionary via search_path at call time), which Postgres rejects inside
-- generated columns and expression indexes ("must be IMMUTABLE"). This
-- wrapper pins the dictionary explicitly so it can be marked IMMUTABLE.
create or replace function casa_immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select unaccent('unaccent', $1);
$$;

create type casa_user_role as enum ('super_admin', 'admin', 'editor', 'author', 'user');
create type casa_content_status as enum ('draft', 'published', 'scheduled', 'archived');

-- One row per auth.users, holding Casa de la Palabra profile + role data.
-- Kept separate from any other app's profile table by name.
create table casa_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role casa_user_role not null default 'user',
  bio text,
  is_profile_public boolean not null default true,
  show_in_leaderboards boolean not null default true,
  show_stats boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table casa_profiles is 'Casa de la Palabra: user profile + role, 1:1 with auth.users.';

create or replace function casa_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into casa_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger casa_on_auth_user_created
  after insert on auth.users
  for each row execute function casa_handle_new_user();

-- Backfill: the trigger above only fires for NEW signups. In a shared
-- auth.users (this project also serves other apps), existing accounts need
-- a casa_profiles row too, so the admin-bootstrap UPDATE later has a row to
-- act on. Safe to re-run — on conflict does nothing.
insert into casa_profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

create or replace function casa_current_role()
returns casa_user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from casa_profiles where id = auth.uid();
$$;

create or replace function casa_has_role(allowed casa_user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from casa_profiles where id = auth.uid()) = any (allowed),
    false
  );
$$;

-- Staff = anyone allowed into the control panel at all (read-level access).
create or replace function casa_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select casa_has_role(array['super_admin', 'admin', 'editor', 'author']::casa_user_role[]);
$$;

-- Editors = can create/edit content (not manage users/config).
create or replace function casa_is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select casa_has_role(array['super_admin', 'admin', 'editor']::casa_user_role[]);
$$;

-- Admins = full administrative control (users, roles, config, donations).
create or replace function casa_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select casa_has_role(array['super_admin', 'admin']::casa_user_role[]);
$$;

create or replace function casa_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table casa_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  changes jsonb,
  created_at timestamptz not null default now()
);

-- RLS lets a user UPDATE their own row, but role changes must still go
-- through an admin — enforce that at the row level, not just via policy.
create or replace function casa_prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only guard against an authenticated non-admin escalating their OWN role
  -- via the app. A direct/service-role Postgres connection has no JWT, so
  -- auth.uid() is null there — that is a trusted context (migrations, the
  -- bootstrap of the very first super_admin) and must NOT be blocked, or
  -- there would be no way to ever create the first admin.
  if new.role is distinct from old.role and auth.uid() is not null and not casa_is_admin() then
    new.role = old.role;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger casa_profiles_guard_role
  before update on casa_profiles
  for each row execute function casa_prevent_role_self_escalation();

alter table casa_profiles enable row level security;
alter table casa_audit_logs enable row level security;

create policy "casa_profiles_select_public" on casa_profiles
  for select using (is_profile_public = true or id = auth.uid() or casa_is_staff());

create policy "casa_profiles_update_self" on casa_profiles
  for update using (id = auth.uid() or casa_is_admin());

create policy "casa_profiles_update_role_admin_only" on casa_profiles
  for update using (casa_is_admin())
  with check (casa_is_admin());

create policy "casa_audit_logs_staff_read" on casa_audit_logs
  for select using (casa_is_staff());

create policy "casa_audit_logs_system_insert" on casa_audit_logs
  for insert with check (casa_is_staff());

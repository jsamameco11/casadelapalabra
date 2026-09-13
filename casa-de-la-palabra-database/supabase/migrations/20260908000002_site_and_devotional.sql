-- Casa de la Palabra — site-wide configuration, navigation, pages, SEO
-- and the devotional module (hidden by default, toggled from the admin panel).

-- Singleton-style settings row (id fixed to 1) so the public app can do a
-- single cheap read for hero copy, verse-of-the-day, feature toggles, etc.
create table casa_site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'Casa de la Palabra',
  logo_url text,
  favicon_url text,
  primary_color text default '#1F3B34',
  accent_color text default '#C9A24B',
  dark_mode_enabled boolean not null default true,

  hero_title text not null default 'Conoce, estudia y vive la Palabra',
  hero_subtitle text not null default 'Un espacio para acercarte a Dios a través de la Biblia, el aprendizaje, el contenido y la comunidad.',
  hero_primary_cta_label text not null default 'Explorar la Biblia',
  hero_primary_cta_href text not null default '/biblia',
  hero_secondary_cta_label text not null default 'Comenzar a aprender',
  hero_secondary_cta_href text not null default '/juegos',
  hero_image_url text,

  -- Devotional module: OFF by default per product decision; only an admin
  -- flipping this in /admin/configuracion turns it on.
  devotional_enabled boolean not null default false,
  devotional_title text not null default 'Devocional de hoy',

  donation_cta_title text not null default 'Tu apoyo nos ayuda a llevar la Palabra más lejos.',
  maintenance_mode boolean not null default false,

  default_bible_translation_id uuid,
  supported_languages text[] not null default array['es'],

  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into casa_site_settings (id) values (1);

create trigger casa_site_settings_updated_at
  before update on casa_site_settings
  for each row execute function casa_set_updated_at();

-- Daily devotionals. Shown as a full gate/section before Home content only
-- while casa_site_settings.devotional_enabled = true.
create table casa_devotionals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  verse_reference text,
  verse_text text,
  cover_image_url text,
  author_id uuid references auth.users (id) on delete set null,
  publish_date date not null default current_date,
  status casa_content_status not null default 'draft',
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index casa_devotionals_one_per_day on casa_devotionals (publish_date) where status = 'published';
create index casa_devotionals_publish_date_idx on casa_devotionals (publish_date desc);

create trigger casa_devotionals_updated_at
  before update on casa_devotionals
  for each row execute function casa_set_updated_at();

create table casa_navigation_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references casa_navigation_items (id) on delete cascade,
  label text not null,
  href text,
  position integer not null default 0,
  is_active boolean not null default true,
  opens_in_new_tab boolean not null default false,
  created_at timestamptz not null default now()
);

create index casa_navigation_items_parent_idx on casa_navigation_items (parent_id, position);

create table casa_footer_columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  position integer not null default 0,
  is_active boolean not null default true
);

create table casa_footer_links (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references casa_footer_columns (id) on delete cascade,
  label text not null,
  href text not null,
  position integer not null default 0,
  is_active boolean not null default true
);

create table casa_social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram', 'youtube', 'tiktok', 'spotify', 'x')),
  url text not null,
  is_active boolean not null default false,
  position integer not null default 0
);

create table casa_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  status casa_content_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_pages_updated_at
  before update on casa_pages
  for each row execute function casa_set_updated_at();

create table casa_seo_metadata (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  title text,
  description text,
  canonical_url text,
  og_image_url text,
  og_type text default 'website',
  twitter_card text default 'summary_large_image',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_seo_metadata_updated_at
  before update on casa_seo_metadata
  for each row execute function casa_set_updated_at();

create table casa_donation_methods (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('yape', 'plin', 'bank_transfer', 'card', 'stripe', 'paypal')),
  label text not null,
  details jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table casa_site_settings enable row level security;
alter table casa_devotionals enable row level security;
alter table casa_navigation_items enable row level security;
alter table casa_footer_columns enable row level security;
alter table casa_footer_links enable row level security;
alter table casa_social_links enable row level security;
alter table casa_pages enable row level security;
alter table casa_seo_metadata enable row level security;
alter table casa_donation_methods enable row level security;

create policy "casa_site_settings_public_read" on casa_site_settings for select using (true);
create policy "casa_site_settings_admin_write" on casa_site_settings for update using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_devotionals_public_read_published" on casa_devotionals
  for select using (status = 'published' or casa_is_staff());
create policy "casa_devotionals_editor_write" on casa_devotionals
  for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_navigation_public_read" on casa_navigation_items for select using (is_active or casa_is_staff());
create policy "casa_navigation_admin_write" on casa_navigation_items for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_footer_columns_public_read" on casa_footer_columns for select using (is_active or casa_is_staff());
create policy "casa_footer_columns_admin_write" on casa_footer_columns for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_footer_links_public_read" on casa_footer_links for select using (is_active or casa_is_staff());
create policy "casa_footer_links_admin_write" on casa_footer_links for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_social_links_public_read" on casa_social_links for select using (is_active or casa_is_staff());
create policy "casa_social_links_admin_write" on casa_social_links for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_pages_public_read_published" on casa_pages for select using (status = 'published' or casa_is_staff());
create policy "casa_pages_editor_write" on casa_pages for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_seo_metadata_public_read" on casa_seo_metadata for select using (true);
create policy "casa_seo_metadata_editor_write" on casa_seo_metadata for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_donation_methods_public_read" on casa_donation_methods for select using (is_active or casa_is_staff());
create policy "casa_donation_methods_admin_write" on casa_donation_methods for all using (casa_is_admin()) with check (casa_is_admin());

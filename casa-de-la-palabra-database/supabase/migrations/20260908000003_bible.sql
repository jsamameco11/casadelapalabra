-- Casa de la Palabra — Bible library.
-- Content-license architecture: every translation is tagged so the app
-- never mixes public-domain text with content that needs a licensed API
-- pass-through, and never stores copyrighted text without a license on file.

create type casa_bible_license_type as enum (
  'public_domain',      -- e.g. Reina-Valera 1909/1960-era public domain texts
  'compatible_license', -- open license, storable, attribution required
  'proprietary_stored',  -- licensed, text stored in our DB (license_notes required)
  'api_passthrough'     -- NOT stored here; fetched live from a licensed provider (e.g. API.Bible)
);

create table casa_bible_languages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'es', 'en', 'pt', 'fr', ...
  name text not null,
  is_active boolean not null default true
);

create table casa_bible_translations (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references casa_bible_languages (id) on delete restrict,
  code text not null unique, -- 'RVR1960', 'NVI', 'KJV', ...
  name text not null,
  short_name text,
  publisher text,
  license_type casa_bible_license_type not null default 'public_domain',
  license_notes text,
  external_provider text,      -- e.g. 'api.bible', when license_type = api_passthrough
  external_identifier text,    -- provider's own id/handle for this translation
  is_active boolean not null default false, -- off until content/licensing is verified
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index casa_bible_translations_language_idx on casa_bible_translations (language_id);

create table casa_bible_books (
  id uuid primary key default gen_random_uuid(),
  testament text not null check (testament in ('old', 'new')),
  book_number integer not null, -- canonical 1-66 order
  slug text not null,           -- 'juan', 'romanos' — language-neutral key, joined w/ per-translation name
  default_name text not null,
  chapter_count integer not null,
  unique (slug)
);

create table casa_bible_book_names (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references casa_bible_books (id) on delete cascade,
  translation_id uuid not null references casa_bible_translations (id) on delete cascade,
  name text not null,
  abbreviation text,
  unique (book_id, translation_id)
);

create table casa_bible_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references casa_bible_books (id) on delete cascade,
  chapter_number integer not null,
  verse_count integer not null default 0,
  unique (book_id, chapter_number)
);

create index casa_bible_chapters_book_idx on casa_bible_chapters (book_id, chapter_number);

create table casa_bible_verses (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  translation_id uuid not null references casa_bible_translations (id) on delete cascade,
  verse_number integer not null,
  text text, -- null when license_type = api_passthrough (fetched live instead)
  search_text text generated always as (casa_immutable_unaccent(coalesce(text, ''))) stored,
  unique (chapter_id, translation_id, verse_number)
);

create index casa_bible_verses_search_idx on casa_bible_verses using gin (search_text gin_trgm_ops);
create index casa_bible_verses_chapter_idx on casa_bible_verses (chapter_id, translation_id);

create table casa_bible_cross_references (
  id uuid primary key default gen_random_uuid(),
  from_chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  from_verse_number integer not null,
  to_chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  to_verse_number integer not null,
  note text,
  created_at timestamptz not null default now()
);

create index casa_bible_cross_references_from_idx on casa_bible_cross_references (from_chapter_id, from_verse_number);

create table casa_bible_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  verse_number integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, chapter_id, verse_number)
);

create table casa_bible_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  verse_number integer not null,
  color text not null default 'yellow',
  created_at timestamptz not null default now(),
  unique (user_id, chapter_id, verse_number)
);

create table casa_bible_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  verse_number integer not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_bible_notes_updated_at
  before update on casa_bible_notes
  for each row execute function casa_set_updated_at();

create table casa_bible_reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references casa_bible_chapters (id) on delete cascade,
  translation_id uuid references casa_bible_translations (id) on delete set null,
  read_at timestamptz not null default now()
);

create index casa_bible_reading_history_user_idx on casa_bible_reading_history (user_id, read_at desc);

alter table casa_site_settings
  add constraint casa_site_settings_default_translation_fk
  foreign key (default_bible_translation_id) references casa_bible_translations (id) on delete set null;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table casa_bible_languages enable row level security;
alter table casa_bible_translations enable row level security;
alter table casa_bible_books enable row level security;
alter table casa_bible_book_names enable row level security;
alter table casa_bible_chapters enable row level security;
alter table casa_bible_verses enable row level security;
alter table casa_bible_cross_references enable row level security;
alter table casa_bible_favorites enable row level security;
alter table casa_bible_highlights enable row level security;
alter table casa_bible_notes enable row level security;
alter table casa_bible_reading_history enable row level security;

create policy "casa_bible_languages_public_read" on casa_bible_languages for select using (true);
create policy "casa_bible_languages_admin_write" on casa_bible_languages for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_bible_translations_public_read_active" on casa_bible_translations for select using (is_active or casa_is_staff());
create policy "casa_bible_translations_admin_write" on casa_bible_translations for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_bible_books_public_read" on casa_bible_books for select using (true);
create policy "casa_bible_books_admin_write" on casa_bible_books for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_bible_book_names_public_read" on casa_bible_book_names for select using (true);
create policy "casa_bible_book_names_admin_write" on casa_bible_book_names for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_bible_chapters_public_read" on casa_bible_chapters for select using (true);
create policy "casa_bible_chapters_admin_write" on casa_bible_chapters for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_bible_verses_public_read" on casa_bible_verses for select using (true);
create policy "casa_bible_verses_admin_write" on casa_bible_verses for all using (casa_is_admin()) with check (casa_is_admin());

create policy "casa_bible_cross_references_public_read" on casa_bible_cross_references for select using (true);
create policy "casa_bible_cross_references_editor_write" on casa_bible_cross_references for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_bible_favorites_owner_only" on casa_bible_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "casa_bible_highlights_owner_only" on casa_bible_highlights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "casa_bible_notes_owner_only" on casa_bible_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "casa_bible_reading_history_owner_only" on casa_bible_reading_history for all using (user_id = auth.uid()) with check (user_id = auth.uid());

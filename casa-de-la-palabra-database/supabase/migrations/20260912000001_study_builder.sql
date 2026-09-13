-- Constructor editorial de estudios bíblicos.
--
-- Idea central: una SECCIÓN no es un tipo de contenido, es un CONTENEDOR
-- narrativo con nombre libre. Dentro puede ir cualquier combinación de
-- contenidos, en cualquier orden, sin estructura obligatoria.
--
--   casa_studies              (ya existía) cabecera del estudio
--     └── casa_study_sections (ya existía) contenedor con nombre libre
--           └── casa_study_contents        bloques de cualquier tipo
--                 └── casa_study_content_verses  datos del versículo, estructurados
--
-- Todo aditivo: no se elimina ni se renombra nada de lo existente.
-- casa_study_lessons queda obsoleta (la reemplaza casa_study_contents) pero
-- se conserva por si guarda datos.

-- ---------------------------------------------------------------------
-- Cabecera del estudio: campos que faltaban
-- ---------------------------------------------------------------------
alter table casa_studies add column if not exists subtitle text;
alter table casa_studies add column if not exists main_verse text;
alter table casa_studies add column if not exists social_image_url text;

-- ---------------------------------------------------------------------
-- Sección: nombre libre + presentación
-- ---------------------------------------------------------------------
alter table casa_study_sections add column if not exists subtitle text;
alter table casa_study_sections add column if not exists is_visible boolean not null default true;
alter table casa_study_sections add column if not exists layout text not null default 'standard';
alter table casa_study_sections add column if not exists configuration jsonb not null default '{}'::jsonb;
alter table casa_study_sections add column if not exists image_url text;
alter table casa_study_sections add column if not exists created_at timestamptz not null default now();
alter table casa_study_sections add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table casa_study_sections
    add constraint casa_study_sections_layout_check
    check (layout in ('standard', 'editorial', 'minimal', 'highlight', 'immersive', 'background-image'));
exception when duplicate_object then null; end $$;

comment on column casa_study_sections.title is
  'Nombre libre escrito por el editor. El sistema numera (01, 02, …) pero NUNCA impone el nombre.';

drop trigger if exists casa_study_sections_updated_at on casa_study_sections;
create trigger casa_study_sections_updated_at
  before update on casa_study_sections
  for each row execute function casa_set_updated_at();

-- ---------------------------------------------------------------------
-- Contenidos: los bloques dentro de una sección
-- ---------------------------------------------------------------------
create table if not exists casa_study_contents (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references casa_study_sections (id) on delete cascade,
  type text not null check (type in (
    'text', 'verse', 'image', 'image-text', 'video', 'audio',
    'quote', 'question', 'list', 'highlight', 'divider', 'gallery', 'reflection'
  )),
  position integer not null default 0,
  is_visible boolean not null default true,
  -- Comunes a casi todos los tipos; todos opcionales a propósito.
  title text,
  subtitle text,
  body text,
  media_url text,
  media_alt text,
  -- Solo presentación (layout, alineación, overlay…). Nada consultable acá.
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists casa_study_contents_section_idx
  on casa_study_contents (section_id, position);

comment on table casa_study_contents is
  'Bloques de contenido dentro de una sección. Sin estructura obligatoria: el editor decide tipo, orden y cantidad.';

drop trigger if exists casa_study_contents_updated_at on casa_study_contents;
create trigger casa_study_contents_updated_at
  before update on casa_study_contents
  for each row execute function casa_set_updated_at();

-- ---------------------------------------------------------------------
-- Versículo: estructurado, no un bloque de texto
-- ---------------------------------------------------------------------
-- Se guarda aparte para poder consultarlo de verdad ("¿en qué estudios cité
-- Juan 3?") y para permitir reflexión opcional sin ensuciar la tabla general.
create table if not exists casa_study_content_verses (
  content_id uuid primary key references casa_study_contents (id) on delete cascade,
  book_slug text references casa_bible_books (slug) on delete set null,
  chapter_start integer,
  verse_start integer,
  chapter_end integer,
  verse_end integer,
  translation_code text,
  -- El editor manda: el texto se escribe o se trae de la Biblia interna, pero
  -- siempre queda editable a mano.
  text text,
  show_reference boolean not null default true,
  -- La reflexión es OPCIONAL. Sin ella el bloque muestra solo referencia+texto.
  reflection_enabled boolean not null default false,
  reflection_title text,
  reflection_content text,
  reflection_configuration jsonb not null default '{}'::jsonb
);

create index if not exists casa_study_content_verses_ref_idx
  on casa_study_content_verses (book_slug, chapter_start, verse_start);

comment on table casa_study_content_verses is
  'Datos estructurados del versículo (libro/capítulo/versículo/traducción) + reflexión opcional.';

-- ---------------------------------------------------------------------
-- RLS: misma regla que el resto del contenido editorial
-- ---------------------------------------------------------------------
alter table casa_study_contents enable row level security;
alter table casa_study_content_verses enable row level security;

drop policy if exists "casa_study_contents_public_read" on casa_study_contents;
create policy "casa_study_contents_public_read" on casa_study_contents
  for select using (is_visible or casa_is_staff());

drop policy if exists "casa_study_contents_editor_write" on casa_study_contents;
create policy "casa_study_contents_editor_write" on casa_study_contents
  for all using (casa_is_editor()) with check (casa_is_editor());

drop policy if exists "casa_study_content_verses_public_read" on casa_study_content_verses;
create policy "casa_study_content_verses_public_read" on casa_study_content_verses
  for select using (true);

drop policy if exists "casa_study_content_verses_editor_write" on casa_study_content_verses;
create policy "casa_study_content_verses_editor_write" on casa_study_content_verses
  for all using (casa_is_editor()) with check (casa_is_editor());

-- La política original de secciones era `using (true)`: con la nueva columna
-- is_visible eso filtraría secciones ocultas, y además dejaba ver las
-- secciones de estudios aún sin publicar. Se ata a la visibilidad y al estado
-- del estudio padre.
drop policy if exists "casa_study_sections_public_read" on casa_study_sections;
create policy "casa_study_sections_public_read" on casa_study_sections
  for select using (
    casa_is_staff()
    or (
      is_visible
      and exists (
        select 1 from casa_studies s
        where s.id = casa_study_sections.study_id and s.status = 'published'
      )
    )
  );

comment on table casa_study_lessons is
  'OBSOLETA: reemplazada por casa_study_contents. Se conserva por compatibilidad.';

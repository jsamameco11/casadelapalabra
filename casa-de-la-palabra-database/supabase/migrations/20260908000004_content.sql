-- Casa de la Palabra — Studies, Media (videos/podcast/courses/conferences),
-- taxonomy (categories/tags) and cross-content relations.

create table casa_authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table casa_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  module text not null default 'general', -- 'studies', 'videos', 'podcasts', 'courses', 'conferences', 'general'
  position integer not null default 0
);

create table casa_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table casa_content_tags (
  tag_id uuid not null references casa_tags (id) on delete cascade,
  content_type text not null, -- 'study' | 'video' | 'podcast' | 'course' | 'conference'
  content_id uuid not null,
  primary key (tag_id, content_type, content_id)
);

create index casa_content_tags_content_idx on casa_content_tags (content_type, content_id);

-- Manual "related content" pins, on top of the automatic category/tag matches.
create table casa_content_relations (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  related_type text not null,
  related_id uuid not null,
  position integer not null default 0
);

create index casa_content_relations_source_idx on casa_content_relations (source_type, source_id);

create table casa_content_views (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  viewed_at timestamptz not null default now()
);

create index casa_content_views_content_idx on casa_content_views (content_type, content_id, viewed_at desc);

create table casa_search_logs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  scope text not null default 'global', -- 'bible' | 'global'
  result_count integer not null default 0,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Studies
-- ---------------------------------------------------------------------
create table casa_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  author_id uuid references casa_authors (id) on delete set null,
  category_id uuid references casa_categories (id) on delete set null,
  level text check (level in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  duration_minutes integer,
  status casa_content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_studies_updated_at before update on casa_studies for each row execute function casa_set_updated_at();

create table casa_study_sections (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references casa_studies (id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table casa_study_lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references casa_study_sections (id) on delete cascade,
  title text not null,
  content text,
  bible_references text[] not null default '{}',
  position integer not null default 0
);

create table casa_study_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references casa_study_lessons (id) on delete cascade,
  question text not null,
  position integer not null default 0
);

create table casa_study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_id uuid not null references casa_studies (id) on delete cascade,
  last_lesson_id uuid references casa_study_lessons (id) on delete set null,
  completed_lesson_ids uuid[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, study_id)
);

create trigger casa_study_progress_updated_at before update on casa_study_progress for each row execute function casa_set_updated_at();

-- ---------------------------------------------------------------------
-- Videos
-- ---------------------------------------------------------------------
create table casa_videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  summary text,
  thumbnail_url text,
  author_id uuid references casa_authors (id) on delete set null,
  category_id uuid references casa_categories (id) on delete set null,
  youtube_url text not null,
  youtube_id text not null,
  duration_seconds integer,
  topics text[] not null default '{}',
  bible_references text[] not null default '{}',
  status casa_content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_videos_updated_at before update on casa_videos for each row execute function casa_set_updated_at();

-- ---------------------------------------------------------------------
-- Podcast
-- ---------------------------------------------------------------------
create table casa_podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  author_id uuid references casa_authors (id) on delete set null,
  category_id uuid references casa_categories (id) on delete set null,
  duration_seconds integer,
  audio_url text,
  spotify_url text,
  apple_podcasts_url text,
  youtube_url text,
  status casa_content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_podcast_episodes_updated_at before update on casa_podcast_episodes for each row execute function casa_set_updated_at();

-- ---------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------
create table casa_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  author_id uuid references casa_authors (id) on delete set null,
  category_id uuid references casa_categories (id) on delete set null,
  is_premium boolean not null default false,
  status casa_content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_courses_updated_at before update on casa_courses for each row execute function casa_set_updated_at();

create table casa_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references casa_courses (id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table casa_course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references casa_course_modules (id) on delete cascade,
  title text not null,
  video_url text,
  content text,
  resources jsonb not null default '[]'::jsonb,
  bible_references text[] not null default '{}',
  position integer not null default 0
);

create table casa_course_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references casa_course_lessons (id) on delete cascade,
  question text not null,
  position integer not null default 0
);

create table casa_course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references casa_courses (id) on delete cascade,
  completed_lesson_ids uuid[] not null default '{}',
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

-- ---------------------------------------------------------------------
-- Conferences
-- ---------------------------------------------------------------------
create table casa_conferences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  speaker text not null,
  event_date date,
  location text,
  description text,
  summary text,
  topics text[] not null default '{}',
  bible_references text[] not null default '{}',
  video_url text,
  category_id uuid references casa_categories (id) on delete set null,
  status casa_content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger casa_conferences_updated_at before update on casa_conferences for each row execute function casa_set_updated_at();

create table casa_conference_images (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references casa_conferences (id) on delete cascade,
  image_url text not null,
  position integer not null default 0
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'casa_authors', 'casa_categories', 'casa_tags', 'casa_content_tags',
    'casa_content_relations', 'casa_content_views', 'casa_search_logs',
    'casa_studies', 'casa_study_sections', 'casa_study_lessons', 'casa_study_questions', 'casa_study_progress',
    'casa_videos', 'casa_podcast_episodes',
    'casa_courses', 'casa_course_modules', 'casa_course_lessons', 'casa_course_questions', 'casa_course_enrollments',
    'casa_conferences', 'casa_conference_images'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

create policy "casa_authors_public_read" on casa_authors for select using (true);
create policy "casa_authors_editor_write" on casa_authors for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_categories_public_read" on casa_categories for select using (true);
create policy "casa_categories_editor_write" on casa_categories for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_tags_public_read" on casa_tags for select using (true);
create policy "casa_tags_editor_write" on casa_tags for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_content_tags_public_read" on casa_content_tags for select using (true);
create policy "casa_content_tags_editor_write" on casa_content_tags for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_content_relations_public_read" on casa_content_relations for select using (true);
create policy "casa_content_relations_editor_write" on casa_content_relations for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_content_views_insert_anyone" on casa_content_views for insert with check (true);
create policy "casa_content_views_staff_read" on casa_content_views for select using (casa_is_staff());

create policy "casa_search_logs_insert_anyone" on casa_search_logs for insert with check (true);
create policy "casa_search_logs_staff_read" on casa_search_logs for select using (casa_is_staff());

create policy "casa_studies_public_read_published" on casa_studies for select using (status = 'published' or casa_is_staff());
create policy "casa_studies_editor_write" on casa_studies for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_study_sections_public_read" on casa_study_sections for select using (true);
create policy "casa_study_sections_editor_write" on casa_study_sections for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_study_lessons_public_read" on casa_study_lessons for select using (true);
create policy "casa_study_lessons_editor_write" on casa_study_lessons for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_study_questions_public_read" on casa_study_questions for select using (true);
create policy "casa_study_questions_editor_write" on casa_study_questions for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_study_progress_owner_only" on casa_study_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "casa_videos_public_read_published" on casa_videos for select using (status = 'published' or casa_is_staff());
create policy "casa_videos_editor_write" on casa_videos for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_podcast_public_read_published" on casa_podcast_episodes for select using (status = 'published' or casa_is_staff());
create policy "casa_podcast_editor_write" on casa_podcast_episodes for all using (casa_is_editor()) with check (casa_is_editor());

create policy "casa_courses_public_read_published" on casa_courses for select using (status = 'published' or casa_is_staff());
create policy "casa_courses_editor_write" on casa_courses for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_course_modules_public_read" on casa_course_modules for select using (true);
create policy "casa_course_modules_editor_write" on casa_course_modules for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_course_lessons_public_read" on casa_course_lessons for select using (true);
create policy "casa_course_lessons_editor_write" on casa_course_lessons for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_course_questions_public_read" on casa_course_questions for select using (true);
create policy "casa_course_questions_editor_write" on casa_course_questions for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_course_enrollments_owner_only" on casa_course_enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "casa_conferences_public_read_published" on casa_conferences for select using (status = 'published' or casa_is_staff());
create policy "casa_conferences_editor_write" on casa_conferences for all using (casa_is_editor()) with check (casa_is_editor());
create policy "casa_conference_images_public_read" on casa_conference_images for select using (true);
create policy "casa_conference_images_editor_write" on casa_conference_images for all using (casa_is_editor()) with check (casa_is_editor());

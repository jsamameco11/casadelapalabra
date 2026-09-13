-- Casa de la Palabra — manual ordering for the content admin (Estudios,
-- Videos, Podcast, Cursos, Conferencias). Additive only, defaults to 0.

alter table casa_studies add column if not exists position integer not null default 0;
alter table casa_videos add column if not exists position integer not null default 0;
alter table casa_podcast_episodes add column if not exists position integer not null default 0;
alter table casa_courses add column if not exists position integer not null default 0;
alter table casa_conferences add column if not exists position integer not null default 0;

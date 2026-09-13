-- El "versículo principal" del estudio (casa_studies.main_verse) era un solo
-- campo de texto libre: el editor tenía que escribir referencia y texto
-- mezclados en una sola línea, y la página pública ni siquiera lo mostraba.
--
-- Se agregan columnas de referencia estructurada (mismo patrón que
-- casa_study_content_verses) y main_verse pasa a significar específicamente
-- el TEXTO del versículo — la referencia vive aparte, para poder mostrarla
-- con su propio estilo (cita + referencia debajo), no en la misma línea.
alter table casa_studies add column if not exists main_verse_book_slug text references casa_bible_books (slug) on delete set null;
alter table casa_studies add column if not exists main_verse_chapter integer;
alter table casa_studies add column if not exists main_verse_verse_start integer;
alter table casa_studies add column if not exists main_verse_verse_end integer;
alter table casa_studies add column if not exists main_verse_translation_code text;

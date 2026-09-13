-- Casa de la Palabra: activate real Bible text (public-domain sources).
-- Source: scrollmapper/bible_databases (MIT license), compiling public-domain texts:
--   RVR1909 = SpaRV (La Santa Biblia Reina-Valera, 1909)
--   KJV     = King James Version (1769)
--   WLC     = Westminster Leningrad Codex (Hebrew/Aramaic Old Testament)
--   TR      = Textus Receptus (Greek New Testament)
-- Safe to run multiple times.

insert into casa_bible_languages (code, name)
values ('he', 'עברית'), ('grc', 'Ελληνικά')
on conflict (code) do nothing;

update casa_bible_translations
set is_active = true,
    license_notes = 'Dominio público. Texto compilado por scrollmapper/bible_databases (MIT) a partir de la Reina-Valera 1909.'
where code = 'RVR1909';

insert into casa_bible_translations (language_id, code, name, short_name, license_type, license_notes, is_active, position)
select (select id from casa_bible_languages where code = 'en'),
       'KJV', 'King James Version (1769)', 'KJV', 'public_domain',
       'Dominio público. Texto compilado por scrollmapper/bible_databases (MIT).', true, 10
where not exists (select 1 from casa_bible_translations where code = 'KJV');

insert into casa_bible_translations (language_id, code, name, short_name, license_type, license_notes, is_active, position)
select (select id from casa_bible_languages where code = 'he'),
       'WLC', 'Westminster Leningrad Codex (hebreo/arameo original)', 'WLC', 'public_domain',
       'Dominio público / licencia abierta. Antiguo Testamento en hebreo y arameo original (Westminster Leningrad Codex), vía scrollmapper/bible_databases (MIT).', true, 20
where not exists (select 1 from casa_bible_translations where code = 'WLC');

insert into casa_bible_translations (language_id, code, name, short_name, license_type, license_notes, is_active, position)
select (select id from casa_bible_languages where code = 'grc'),
       'TR', 'Textus Receptus (griego original)', 'TR', 'public_domain',
       'Dominio público. Nuevo Testamento en griego original (Textus Receptus 1550/1894), vía scrollmapper/bible_databases (MIT).', true, 21
where not exists (select 1 from casa_bible_translations where code = 'TR');

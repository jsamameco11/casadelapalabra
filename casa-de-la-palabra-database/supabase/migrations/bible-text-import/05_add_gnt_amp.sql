-- Adds two more licensed translations from the same api.bible account
-- already used for NTV. Text is NEVER stored — fetched live on every
-- request (license_type = 'api_passthrough'), same architecture as NTV.
-- Bible IDs picked to match this project's 66-book Protestant canon exactly
-- (the alternate "Good News Translation (US Version)" id has 81 books,
-- including deuterocanonical/apocrypha, so it is intentionally NOT used here).

insert into casa_bible_translations
  (language_id, code, name, short_name, license_type, license_notes, external_provider, external_identifier, is_active, position)
select
  (select id from casa_bible_languages where code = 'en'),
  'GNT',
  'Good News Translation',
  'GNT',
  'api_passthrough',
  'Licencia confirmada vía api.bible (cuenta de Renzo, plan gratuito no comercial). Texto servido en vivo, nunca almacenado. Copyright obligatorio: Good News Translation® (Today''s English Version, Second Edition) © 1992 American Bible Society. All rights reserved.',
  'api.bible',
  '61fd76eafa1577c2-02',
  true,
  100
where not exists (select 1 from casa_bible_translations where code = 'GNT');

insert into casa_bible_translations
  (language_id, code, name, short_name, license_type, license_notes, external_provider, external_identifier, is_active, position)
select
  (select id from casa_bible_languages where code = 'en'),
  'AMP',
  'Amplified Bible',
  'AMP',
  'api_passthrough',
  'Licencia confirmada vía api.bible (cuenta de Renzo, plan gratuito no comercial). Texto servido en vivo, nunca almacenado. Copyright obligatorio: Amplified® Bible Copyright © 2015 by The Lockman Foundation, La Habra, CA 90631. All rights reserved. http://www.lockman.org',
  'api.bible',
  'a81b73293d3080c9-01',
  true,
  101
where not exists (select 1 from casa_bible_translations where code = 'AMP');

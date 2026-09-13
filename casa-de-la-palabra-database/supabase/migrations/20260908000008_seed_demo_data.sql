-- Casa de la Palabra — demo/seed data.
--
-- IMPORTANT (rules 91/92/115 from the product spec):
--   * No actual Bible verse text is inserted here. `casa_bible_verses` is
--     left empty. Only the *canonical structure* (66 books, chapter counts)
--     is seeded — that is public factual information, not copyrighted text.
--   * REBET trivia questions below are original, paraphrased factual
--     questions about biblical people/events/books written for this seed —
--     they do not quote any specific translation's wording.
--   * Social links and donation methods are seeded INACTIVE with empty
--     details — the architecture is ready, no fake accounts/URLs.

-- ---------------------------------------------------------------------
-- Levels ladder (spec #41 — names configurable from the admin)
-- ---------------------------------------------------------------------
insert into casa_levels (level_number, name, min_xp) values
  (1, 'Explorador', 0),
  (2, 'Aprendiz', 500),
  (3, 'Discípulo', 1500),
  (4, 'Estudiante', 3500),
  (5, 'Conocedor', 7000),
  (6, 'Maestro', 15000);

-- ---------------------------------------------------------------------
-- Badges (spec #45)
-- ---------------------------------------------------------------------
insert into casa_badges (slug, name, description, criteria) values
  ('primer-estudio', 'Primer estudio', 'Completaste tu primer estudio bíblico.', '{"type":"studies_completed","value":1}'),
  ('racha-7-dias', '7 días seguidos', 'Mantuviste una racha de 7 días de actividad.', '{"type":"streak_days","value":7}'),
  ('100-preguntas', '100 preguntas', 'Respondiste 100 preguntas en REBET.', '{"type":"rebet_answers","value":100}'),
  ('1000-xp', '1000 XP', 'Alcanzaste 1000 puntos de experiencia.', '{"type":"total_xp","value":1000}'),
  ('evangelios-completados', 'Evangelios completados', 'Completaste el camino de los Evangelios en LINGOBIBLE.', '{"type":"path_completed","value":"evangelios"}');

-- ---------------------------------------------------------------------
-- Content categories (spec #13)
-- ---------------------------------------------------------------------
insert into casa_categories (slug, name, module, position) values
  ('evangelios', 'Evangelios', 'studies', 1),
  ('fe', 'Fe', 'studies', 2),
  ('oracion', 'Oración', 'studies', 3),
  ('familia', 'Familia', 'studies', 4),
  ('matrimonio', 'Matrimonio', 'studies', 5),
  ('jovenes', 'Jóvenes', 'studies', 6),
  ('liderazgo', 'Liderazgo', 'studies', 7),
  ('espiritu-santo', 'Espíritu Santo', 'studies', 8),
  ('antiguo-testamento', 'Antiguo Testamento', 'studies', 9),
  ('nuevo-testamento', 'Nuevo Testamento', 'studies', 10),
  ('vida-cristiana', 'Vida cristiana', 'studies', 11),
  ('doctrina', 'Doctrina', 'studies', 12);

-- ---------------------------------------------------------------------
-- Navigation (spec #5)
-- ---------------------------------------------------------------------
with items as (
  insert into casa_navigation_items (label, href, position) values
    ('Biblia', '/biblia', 1),
    ('Estudios Bíblicos', '/estudios', 2),
    ('Media', null, 3),
    ('Juegos', null, 4),
    ('Nosotros', '/nosotros', 5)
  returning id, label
)
insert into casa_navigation_items (parent_id, label, href, position)
select (select id from items where label = 'Media'), v.label, v.href, v.position
from (values ('Videos', '/media/videos', 1), ('Podcast', '/media/podcast', 2), ('Cursos', '/media/cursos', 3), ('Conferencias Pasadas', '/media/conferencias', 4)) as v(label, href, position)
union all
select (select id from items where label = 'Juegos'), v.label, v.href, v.position
from (values ('REBET', '/juegos/rebet', 1), ('LINGOBIBLE', '/juegos/lingobible', 2), ('El Impostor Bíblico', '/juegos/impostor-biblico', 3)) as v(label, href, position);

insert into casa_footer_columns (title, position) values
  ('Explorar', 1), ('Recursos', 2), ('Legal', 3);

insert into casa_footer_links (column_id, label, href, position)
select (select id from casa_footer_columns where title = 'Explorar'), v.label, v.href, v.position
from (values ('Biblia', '/biblia', 1), ('Estudios', '/estudios', 2), ('Juegos', '/juegos', 3)) as v(label, href, position)
union all
select (select id from casa_footer_columns where title = 'Recursos'), v.label, v.href, v.position
from (values ('Nosotros', '/nosotros', 1), ('Donar', '/donar', 2)) as v(label, href, position);

insert into casa_social_links (platform, url, is_active, position) values
  ('facebook', '', false, 1), ('instagram', '', false, 2), ('youtube', '', false, 3),
  ('tiktok', '', false, 4), ('spotify', '', false, 5), ('x', '', false, 6);

insert into casa_donation_methods (method, label, details, is_active, position) values
  ('yape', 'Yape', '{}', false, 1),
  ('plin', 'Plin', '{}', false, 2),
  ('bank_transfer', 'Transferencia bancaria', '{}', false, 3),
  ('card', 'Tarjeta', '{}', false, 4),
  ('stripe', 'Stripe', '{}', false, 5),
  ('paypal', 'PayPal', '{}', false, 6);

-- ---------------------------------------------------------------------
-- Bible structure only — languages, translations (metadata), 66 books,
-- chapters. No verse text (see note at top of file).
-- ---------------------------------------------------------------------
insert into casa_bible_languages (code, name) values
  ('es', 'Español'), ('en', 'English'), ('pt', 'Português'), ('fr', 'Français');

insert into casa_bible_translations (language_id, code, name, short_name, license_type, license_notes, is_active) values
  ((select id from casa_bible_languages where code = 'es'), 'RVR1960', 'Reina-Valera 1960', 'RVR60', 'proprietary_stored', 'Copyright Sociedades Bíblicas Unidas — requiere licencia antes de importar texto.', false),
  ((select id from casa_bible_languages where code = 'es'), 'RVR1909', 'Reina-Valera 1909', 'RVR09', 'public_domain', 'Dominio público — segura para importar texto completo.', false),
  ((select id from casa_bible_languages where code = 'en'), 'KJV', 'King James Version', 'KJV', 'public_domain', 'Dominio público en la mayoría de jurisdicciones — segura para importar texto completo.', false),
  ((select id from casa_bible_languages where code = 'es'), 'NVI', 'Nueva Versión Internacional', 'NVI', 'api_passthrough', 'Requiere integración con proveedor licenciado (p. ej. API.Bible); no se almacena el texto.', false);

insert into casa_bible_books (testament, book_number, slug, default_name, chapter_count) values
  ('old',1,'genesis','Génesis',50), ('old',2,'exodo','Éxodo',40), ('old',3,'levitico','Levítico',27),
  ('old',4,'numeros','Números',36), ('old',5,'deuteronomio','Deuteronomio',34), ('old',6,'josue','Josué',24),
  ('old',7,'jueces','Jueces',21), ('old',8,'rut','Rut',4), ('old',9,'1-samuel','1 Samuel',31),
  ('old',10,'2-samuel','2 Samuel',24), ('old',11,'1-reyes','1 Reyes',22), ('old',12,'2-reyes','2 Reyes',25),
  ('old',13,'1-cronicas','1 Crónicas',29), ('old',14,'2-cronicas','2 Crónicas',36), ('old',15,'esdras','Esdras',10),
  ('old',16,'nehemias','Nehemías',13), ('old',17,'ester','Ester',10), ('old',18,'job','Job',42),
  ('old',19,'salmos','Salmos',150), ('old',20,'proverbios','Proverbios',31), ('old',21,'eclesiastes','Eclesiastés',12),
  ('old',22,'cantares','Cantares',8), ('old',23,'isaias','Isaías',66), ('old',24,'jeremias','Jeremías',52),
  ('old',25,'lamentaciones','Lamentaciones',5), ('old',26,'ezequiel','Ezequiel',48), ('old',27,'daniel','Daniel',12),
  ('old',28,'oseas','Oseas',14), ('old',29,'joel','Joel',3), ('old',30,'amos','Amós',9),
  ('old',31,'abdias','Abdías',1), ('old',32,'jonas','Jonás',4), ('old',33,'miqueas','Miqueas',7),
  ('old',34,'nahum','Nahúm',3), ('old',35,'habacuc','Habacuc',3), ('old',36,'sofonias','Sofonías',3),
  ('old',37,'hageo','Hageo',2), ('old',38,'zacarias','Zacarías',14), ('old',39,'malaquias','Malaquías',4),
  ('new',40,'mateo','Mateo',28), ('new',41,'marcos','Marcos',16), ('new',42,'lucas','Lucas',24),
  ('new',43,'juan','Juan',21), ('new',44,'hechos','Hechos',28), ('new',45,'romanos','Romanos',16),
  ('new',46,'1-corintios','1 Corintios',16), ('new',47,'2-corintios','2 Corintios',13), ('new',48,'galatas','Gálatas',6),
  ('new',49,'efesios','Efesios',6), ('new',50,'filipenses','Filipenses',4), ('new',51,'colosenses','Colosenses',4),
  ('new',52,'1-tesalonicenses','1 Tesalonicenses',5), ('new',53,'2-tesalonicenses','2 Tesalonicenses',3),
  ('new',54,'1-timoteo','1 Timoteo',6), ('new',55,'2-timoteo','2 Timoteo',4), ('new',56,'tito','Tito',3),
  ('new',57,'filemon','Filemón',1), ('new',58,'hebreos','Hebreos',13), ('new',59,'santiago','Santiago',5),
  ('new',60,'1-pedro','1 Pedro',5), ('new',61,'2-pedro','2 Pedro',3), ('new',62,'1-juan','1 Juan',5),
  ('new',63,'2-juan','2 Juan',1), ('new',64,'3-juan','3 Juan',1), ('new',65,'judas','Judas',1),
  ('new',66,'apocalipsis','Apocalipsis',22);

insert into casa_bible_chapters (book_id, chapter_number, verse_count)
select b.id, gs.chapter_number, 0
from casa_bible_books b
cross join lateral generate_series(1, b.chapter_count) as gs(chapter_number);

update casa_site_settings set default_bible_translation_id = (select id from casa_bible_translations where code = 'RVR1909') where id = 1;

-- ---------------------------------------------------------------------
-- REBET: categories + 50 demo questions with 4 options each.
-- ---------------------------------------------------------------------
insert into casa_rebet_categories (slug, name, position) values
  ('antiguo-testamento','Antiguo Testamento',1), ('nuevo-testamento','Nuevo Testamento',2),
  ('evangelios','Evangelios',3), ('personajes','Personajes bíblicos',4), ('geografia','Geografía bíblica',5),
  ('historia','Historia bíblica',6), ('doctrina','Doctrina',7), ('versiculos','Versículos',8),
  ('jesus','Jesús',9), ('apostoles','Apóstoles',10), ('profetas','Profetas',11), ('mujeres','Mujeres de la Biblia',12),
  ('parabolas','Parábolas',13), ('libros','Libros de la Biblia',14), ('fe','Fe',15), ('oracion','Oración',16),
  ('espiritu-santo','Espíritu Santo',17), ('familia','Familia',18), ('jovenes','Jóvenes',19);

do $$
declare
  rec record;
  v_category_id uuid;
  v_question_id uuid;
  letters text[] := array['A','B','C','D'];
  i int;
begin
  for rec in
    select * from (values
      ('antiguo-testamento','easy','¿Quién construyó el arca?', array['Moisés','Noé','Abraham','David'], 2, 'Dios pidió a Noé construir un arca para salvar a su familia y a los animales del diluvio.', 'Génesis 6-9'),
      ('antiguo-testamento','easy','¿Cuántos días y noches llovió durante el diluvio?', array['7','40','100','150'], 2, 'La lluvia del diluvio duró cuarenta días y cuarenta noches.', 'Génesis 7:12'),
      ('antiguo-testamento','medium','¿En qué jardín fueron colocados Adán y Eva?', array['Getsemaní','Edén','Gólgota','Jericó'], 2, 'Dios puso al hombre en el huerto de Edén.', 'Génesis 2:8'),
      ('antiguo-testamento','medium','¿Quién interpretó los sueños del Faraón en Egipto?', array['Moisés','Josué','José','Daniel'], 3, 'José interpretó los sueños del Faraón sobre los años de abundancia y hambre.', 'Génesis 41'),
      ('antiguo-testamento','hard','¿Cuántos años vivió Matusalén, según el relato de Génesis?', array['700','850','969','777'], 3, 'Matusalén es la persona más longeva mencionada en el relato bíblico.', 'Génesis 5:27'),
      ('nuevo-testamento','easy','¿En qué ciudad nació Jesús?', array['Nazaret','Jerusalén','Belén','Caná'], 3, 'Jesús nació en Belén de Judea.', 'Mateo 2:1; Lucas 2:4'),
      ('nuevo-testamento','easy','¿Quién bautizó a Jesús en el río Jordán?', array['Pedro','Juan el Bautista','Andrés','Felipe'], 2, 'Juan el Bautista bautizó a Jesús en el Jordán.', 'Mateo 3:13-17'),
      ('nuevo-testamento','medium','¿Cuántos discípulos eligió Jesús como apóstoles?', array['10','12','7','70'], 2, 'Jesús escogió a doce apóstoles.', 'Mateo 10:1-4'),
      ('nuevo-testamento','medium','¿Quién traicionó a Jesús por monedas de plata?', array['Tomás','Judas Iscariote','Pedro','Bartolomé'], 2, 'Judas Iscariote entregó a Jesús por treinta piezas de plata.', 'Mateo 26:14-16'),
      ('evangelios','easy','¿Cuántos evangelios hay en el Nuevo Testamento?', array['2','3','4','5'], 3, 'Los cuatro evangelios son Mateo, Marcos, Lucas y Juan.', null),
      ('evangelios','medium','¿Cuál de los evangelistas era médico de profesión?', array['Mateo','Marcos','Lucas','Juan'], 3, 'La tradición identifica a Lucas, compañero de Pablo, como médico.', 'Colosenses 4:14'),
      ('evangelios','medium','¿En qué evangelio aparece de forma más extensa el Sermón del Monte?', array['Mateo','Marcos','Juan','Hechos'], 1, 'El Sermón del Monte se registra ampliamente en Mateo 5 al 7.', 'Mateo 5-7'),
      ('personajes','easy','¿Quién fue arrojado al foso de los leones?', array['Daniel','Jonás','Job','Elías'], 1, 'Daniel fue echado al foso de los leones por orar a Dios.', 'Daniel 6'),
      ('personajes','easy','¿Quién venció al gigante Goliat?', array['Saúl','David','Sansón','Josué'], 2, 'David venció a Goliat con una honda y una piedra.', '1 Samuel 17'),
      ('personajes','medium','¿Qué juez bíblico perdió su fuerza al cortarle el cabello?', array['Sansón','Gedeón','Débora','Otoniel'], 1, 'Sansón perdió su fuerza cuando Dalila mandó cortarle el cabello.', 'Jueces 16'),
      ('geografia','medium','¿En qué río fue bautizado Jesús?', array['Nilo','Éufrates','Jordán','Tigris'], 3, 'Jesús fue bautizado en el río Jordán.', null),
      ('geografia','medium','¿Qué mar dividió Moisés para que Israel cruzara?', array['Mar Muerto','Mar Rojo','Mar Mediterráneo','Mar de Galilea'], 2, 'Dios abrió el Mar Rojo para que el pueblo cruzara en seco.', 'Éxodo 14'),
      ('geografia','hard','¿En qué monte recibió Moisés los Diez Mandamientos?', array['Monte Sinaí','Monte Carmelo','Monte de los Olivos','Monte Tabor'], 1, 'Moisés recibió las tablas de la ley en el monte Sinaí.', 'Éxodo 19-20'),
      ('historia','medium','¿Cuántos años estuvo Israel en Egipto, según el relato del Éxodo?', array['100','400','40','70'], 2, 'El texto bíblico señala cuatrocientos años de estancia en Egipto.', 'Éxodo 12:40'),
      ('historia','hard','¿Qué rey construyó el primer templo de Jerusalén?', array['David','Salomón','Ezequías','Josías'], 2, 'Salomón construyó el templo tras la muerte de su padre David.', '1 Reyes 6'),
      ('doctrina','medium','Según la doctrina cristiana, ¿cuántas personas conforman la Trinidad?', array['1','2','3','4'], 3, 'La doctrina trinitaria confiesa un solo Dios en tres personas: Padre, Hijo y Espíritu Santo.', null),
      ('doctrina','hard','¿Qué término describe la salvación por gracia mediante la fe?', array['Legalismo','Justificación por la fe','Sincretismo','Panteísmo'], 2, 'La justificación por la fe enseña que la salvación es un don recibido por fe, no por obras.', 'Efesios 2:8-9'),
      ('versiculos','easy','¿Dónde se encuentra el versículo que comienza "Porque de tal manera amó Dios al mundo"?', array['Juan 3','Romanos 8','Salmos 23','Génesis 1'], 1, 'Este es uno de los versículos más citados del Nuevo Testamento.', 'Juan 3:16'),
      ('versiculos','medium','¿Qué salmo comienza con la imagen de Dios como pastor?', array['Salmo 1','Salmo 23','Salmo 100','Salmo 91'], 2, 'El Salmo 23 describe a Dios como el pastor que provee y guía.', 'Salmo 23'),
      ('jesus','easy','¿Cuál fue el primer milagro público de Jesús, según el evangelio de Juan?', array['Sanar a un ciego','Convertir el agua en vino','Caminar sobre el agua','Resucitar a Lázaro'], 2, 'En las bodas de Caná, Jesús convirtió el agua en vino.', 'Juan 2:1-11'),
      ('jesus','medium','¿Cuántos panes y peces multiplicó Jesús en el relato más citado?', array['2 panes y 5 peces','5 panes y 2 peces','7 panes y 2 peces','5 panes y 5 peces'], 2, 'Jesús multiplicó cinco panes y dos peces para alimentar a la multitud.', 'Mateo 14:13-21'),
      ('jesus','hard','¿Cuántos días ayunó Jesús en el desierto antes de ser tentado?', array['7','40','12','3'], 2, 'Jesús ayunó cuarenta días y cuarenta noches antes de la tentación.', 'Mateo 4:1-2'),
      ('apostoles','easy','¿Quién era pescador junto a su hermano Andrés antes de seguir a Jesús?', array['Santiago','Pedro','Mateo','Tomás'], 2, 'Pedro y Andrés eran pescadores cuando Jesús los llamó.', 'Mateo 4:18'),
      ('apostoles','medium','¿Qué apóstol dudó de la resurrección hasta ver las heridas de Jesús?', array['Felipe','Tomás','Bartolomé','Juan'], 2, 'Tomás quiso ver y tocar las heridas antes de creer.', 'Juan 20:24-29'),
      ('apostoles','hard','¿Qué apóstol era recaudador de impuestos antes de seguir a Jesús?', array['Mateo','Simón el Zelote','Judas Tadeo','Andrés'], 1, 'Mateo trabajaba cobrando impuestos cuando Jesús lo llamó.', 'Mateo 9:9'),
      ('profetas','medium','¿Qué profeta fue tragado por un gran pez?', array['Isaías','Jonás','Ezequiel','Amós'], 2, 'Jonás pasó tres días y tres noches en el vientre del gran pez.', 'Jonás 1-2'),
      ('profetas','medium','¿Qué profeta subió al cielo en un torbellino?', array['Elías','Eliseo','Samuel','Natán'], 1, 'Elías fue llevado al cielo en un torbellino, ante Eliseo.', '2 Reyes 2:11'),
      ('profetas','hard','¿Qué profeta tuvo la visión de un valle de huesos secos?', array['Jeremías','Ezequiel','Daniel','Oseas'], 2, 'Ezequiel profetizó sobre un valle de huesos que volvían a la vida.', 'Ezequiel 37'),
      ('mujeres','easy','¿Quién fue la madre de Jesús?', array['Marta','María','Elisabet','Ana'], 2, 'María fue la madre de Jesús.', null),
      ('mujeres','medium','¿Qué mujer escondió a los espías israelitas en Jericó?', array['Rahab','Débora','Rut','Ester'], 1, 'Rahab protegió a los espías enviados por Josué.', 'Josué 2'),
      ('mujeres','medium','¿Qué reina judía intercedió por su pueblo en Persia?', array['Ester','Rut','Jezabel','Betsabé'], 1, 'La reina Ester arriesgó su vida para salvar a su pueblo.', 'Libro de Ester'),
      ('parabolas','easy','¿Qué parábola habla de un padre que recibe de vuelta a su hijo?', array['El buen samaritano','El hijo pródigo','La oveja perdida','El sembrador'], 2, 'La parábola del hijo pródigo ilustra el perdón y la gracia del padre.', 'Lucas 15:11-32'),
      ('parabolas','medium','En la parábola del sembrador, ¿qué representa la semilla en buena tierra?', array['Quienes oyen y no entienden','Quienes oyen la palabra y dan fruto','Las riquezas','Las preocupaciones del mundo'], 2, 'La buena tierra representa a quienes oyen y comprenden la palabra, dando fruto.', 'Mateo 13:23'),
      ('parabolas','hard','¿Qué parábola contrasta a un fariseo y un cobrador de impuestos orando?', array['El fariseo y el publicano','Las diez vírgenes','Los talentos','El buen samaritano'], 1, 'Esta parábola enseña sobre la humildad frente a la autosuficiencia religiosa.', 'Lucas 18:9-14'),
      ('libros','easy','¿Cuál es el primer libro de la Biblia?', array['Éxodo','Génesis','Salmos','Mateo'], 2, 'Génesis abre el relato bíblico con la creación.', null),
      ('libros','easy','¿Cuál es el último libro de la Biblia?', array['Judas','Apocalipsis','2 Pedro','Malaquías'], 2, 'Apocalipsis cierra el canon del Nuevo Testamento.', null),
      ('libros','medium','¿Cuántos libros conforman el Antiguo Testamento protestante?', array['27','39','46','66'], 2, 'El canon protestante del Antiguo Testamento tiene 39 libros.', null),
      ('libros','medium','¿Cuántos libros conforman el Nuevo Testamento?', array['27','39','66','12'], 1, 'El Nuevo Testamento tiene 27 libros.', null),
      ('fe','medium','Según Hebreos 11:1, ¿cómo se define la fe?', array['Un sentimiento pasajero','La certeza de lo que se espera y la convicción de lo que no se ve','Un ritual religioso','Una tradición cultural'], 2, 'Hebreos define la fe como certeza y convicción, no como mera emoción.', 'Hebreos 11:1'),
      ('oracion','easy','¿Qué oración enseñó Jesús a sus discípulos?', array['El Padre Nuestro','El Salmo 23','El Magníficat','El Shemá'], 1, 'Jesús enseñó el Padre Nuestro como modelo de oración.', 'Mateo 6:9-13'),
      ('espiritu-santo','medium','¿En qué celebración descendió el Espíritu Santo sobre los discípulos?', array['Pascua','Pentecostés','Yom Kipur','Purim'], 2, 'El Espíritu Santo descendió el día de Pentecostés en Jerusalén.', 'Hechos 2'),
      ('espiritu-santo','hard','Según Gálatas 5, ¿cuáles son frutos del Espíritu?', array['Riqueza, fama, poder','Amor, gozo, paz, paciencia','Sabiduría, ciencia, lenguas','Ayuno, diezmo, vigilia'], 2, 'Pablo enumera el amor, gozo, paz y paciencia, entre otros, como frutos del Espíritu.', 'Gálatas 5:22-23'),
      ('familia','medium','¿Qué mandamiento del Decálogo trata sobre los padres?', array['No robarás','Honra a tu padre y a tu madre','No codiciarás','Santifica el sábado'], 2, 'El quinto mandamiento llama a honrar a los padres.', 'Éxodo 20:12'),
      ('jovenes','medium','¿Qué joven pastor fue ungido rey siendo el menor de sus hermanos?', array['David','Salomón','Josías','Absalón'], 1, 'David, el más joven de los hijos de Isaí, fue ungido rey.', '1 Samuel 16'),
      ('jovenes','hard','¿Qué joven rey de Judá comenzó a reinar a los ocho años y promovió una reforma religiosa?', array['Ezequías','Josías','Joás','Uzías'], 2, 'Josías comenzó a reinar siendo niño y promovió una importante reforma religiosa.', '2 Reyes 22-23')
    ) as t(category_slug, difficulty, question, options, correct_index, explanation, bible_reference)
  loop
    select id into v_category_id from casa_rebet_categories where slug = rec.category_slug;

    insert into casa_rebet_questions (category_id, difficulty, question, explanation, bible_reference, time_limit_seconds, status)
    values (v_category_id, rec.difficulty, rec.question, rec.explanation, rec.bible_reference, 20, 'published')
    returning id into v_question_id;

    for i in 1..4 loop
      insert into casa_rebet_question_options (question_id, label, option_text, is_correct, position)
      values (v_question_id, letters[i], rec.options[i], (i = rec.correct_index), i);
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- LINGOBIBLE: 1 path, 3 units, 10 lessons, ~2 exercises each.
-- ---------------------------------------------------------------------
insert into casa_lingobible_paths (slug, title, description, position, status) values
  ('conociendo-la-biblia', 'Conociendo la Biblia', 'Un recorrido inicial por la estructura, los personajes y los mensajes centrales de la Biblia.', 1, 'published');

insert into casa_lingobible_units (path_id, title, description, position)
select id, v.title, v.description, v.position
from casa_lingobible_paths, (values
  ('¿Qué es la Biblia?', 'Introducción a la Biblia: su estructura y propósito.', 1),
  ('Personajes del Antiguo Testamento', 'Conoce a los personajes clave del Antiguo Testamento.', 2),
  ('La vida de Jesús', 'Un recorrido por los evangelios y la vida de Jesús.', 3)
) as v(title, description, position)
where slug = 'conociendo-la-biblia';

-- Each lesson gets one multiple_choice exercise ("what was this lesson
-- about?") and one true_false exercise. This is deliberately simple demo
-- content — the admin panel is where real exercise authoring happens.
do $$
declare
  v_unit1 uuid; v_unit2 uuid; v_unit3 uuid;
  v_lesson uuid;
  v_exercise uuid;
  v_titles text[];
  v_distractors text[];
  rec record;
begin
  select id into v_unit1 from casa_lingobible_units where title = '¿Qué es la Biblia?';
  select id into v_unit2 from casa_lingobible_units where title = 'Personajes del Antiguo Testamento';
  select id into v_unit3 from casa_lingobible_units where title = 'La vida de Jesús';

  v_titles := array[
    'Introducción', 'Antiguo y Nuevo Testamento', 'Cómo está organizada la Biblia',
    'Adán, Eva y la creación', 'Noé y el diluvio', 'Abraham, el padre de la fe', 'Moisés y el éxodo',
    'El nacimiento de Jesús', 'Los milagros de Jesús', 'La muerte y resurrección'
  ];

  for rec in
    select * from (values
      (1, 'Introducción', 20), (1, 'Antiguo y Nuevo Testamento', 20), (1, 'Cómo está organizada la Biblia', 25),
      (2, 'Adán, Eva y la creación', 20), (2, 'Noé y el diluvio', 20), (2, 'Abraham, el padre de la fe', 25), (2, 'Moisés y el éxodo', 25),
      (3, 'El nacimiento de Jesús', 20), (3, 'Los milagros de Jesús', 25), (3, 'La muerte y resurrección', 30)
    ) as t(unit_num, title, xp)
  loop
    insert into casa_lingobible_lessons (unit_id, title, xp_reward, position, status)
    values (
      case rec.unit_num when 1 then v_unit1 when 2 then v_unit2 else v_unit3 end,
      rec.title, rec.xp, rec.unit_num, 'published'
    )
    returning id into v_lesson;

    -- Multiple choice: correct answer is this lesson's own title, distractors
    -- are 3 other lesson titles picked at random from the path.
    insert into casa_lingobible_exercises (lesson_id, exercise_type, prompt, correct_answer, position)
    values (v_lesson, 'multiple_choice', '¿Cuál fue el tema principal de esta lección?', '{"correct_option_index":0}'::jsonb, 1)
    returning id into v_exercise;

    select array_agg(sub.t) into v_distractors
      from (select t from unnest(v_titles) as t where t <> rec.title order by random() limit 3) sub;

    insert into casa_lingobible_exercise_options (exercise_id, option_text, is_correct, position) values
      (v_exercise, rec.title, true, 1),
      (v_exercise, v_distractors[1], false, 2),
      (v_exercise, v_distractors[2], false, 3),
      (v_exercise, v_distractors[3], false, 4);

    insert into casa_lingobible_exercises (lesson_id, exercise_type, prompt, correct_answer, position)
    values (v_lesson, 'true_false', '¿Verdadero o falso? Esta lección trata sobre "' || rec.title || '".', '{"answer":true}'::jsonb, 2);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Daily / weekly challenge samples (spec #51-52)
-- ---------------------------------------------------------------------
insert into casa_daily_challenges (title, description, challenge_type, target, xp_reward, active_date) values
  ('Responde 10 preguntas bíblicas', 'Completa 10 preguntas en REBET hoy.', 'answer_questions', '{"count":10}', 100, current_date),
  ('Completa una lección', 'Termina una lección de LINGOBIBLE hoy.', 'complete_lesson', '{"count":1}', 80, current_date);

insert into casa_weekly_challenges (title, description, goal, xp_reward, starts_on, ends_on) values
  ('Lee 3 capítulos esta semana', 'Registra la lectura de 3 capítulos distintos.', '{"chapters":3}', 400, date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date);

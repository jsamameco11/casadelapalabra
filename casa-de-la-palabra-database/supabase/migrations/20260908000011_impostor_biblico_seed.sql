-- Casa de la Palabra — El Impostor Bíblico: banco de palabras inicial.
-- hint_reference solo se completa donde hay una referencia única y clara;
-- se deja en NULL cuando una sola cita no representaría bien el tema (p.ej.
-- personajes que aparecen a lo largo de muchos capítulos) — el equipo
-- editorial puede completarlas desde el panel.

insert into casa_impostor_categories (slug, name, position) values
  ('personajes', 'Personajes bíblicos', 1),
  ('lugares', 'Lugares bíblicos', 2),
  ('objetos-simbolos', 'Objetos y símbolos', 3),
  ('milagros-eventos', 'Milagros y eventos', 4),
  ('virtudes-temas', 'Virtudes y temas', 5),
  ('libros', 'Libros de la Biblia', 6),
  ('animales', 'Animales bíblicos', 7),
  ('parabolas', 'Parábolas', 8),
  ('fiestas', 'Fiestas y tradiciones', 9);

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'personajes'), w
from unnest(array[
  'Adán','Eva','Noé','Abraham','Sara','Isaac','Jacob','Esaú','José','Moisés','Aarón','Miriam',
  'Josué','Débora','Gedeón','Sansón','Rut','Booz','Ana','Samuel','Saúl','David','Goliat','Betsabé',
  'Natán','Salomón','Elías','Eliseo','Jezabel','Isaías','Jeremías','Ezequiel','Daniel','Jonás',
  'Ester','Job','Nehemías','Esdras','Juan el Bautista','María','José (esposo de María)',
  'Zacarías e Isabel','Simeón','Ana la profetisa','Pedro','Andrés','Santiago','Juan (apóstol)',
  'Felipe','Tomás','Mateo','Bartolomé','Judas Iscariote','Lázaro','Marta','María Magdalena',
  'Nicodemo','Zaqueo','Bartimeo','Poncio Pilato','Herodes','Caifás','Pablo','Bernabé','Silas',
  'Timoteo','Tito','Esteban','Priscila y Aquila','Lidia','Cornelio'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'lugares'), w
from unnest(array[
  'Edén','Jerusalén','Belén','Nazaret','Betania','Jericó','Egipto','Babilonia','Sodoma','Gomorra',
  'Monte Sinaí','Monte Carmelo','Monte de los Olivos','Monte Ararat','Mar Rojo','Mar Muerto',
  'Río Jordán','Mar de Galilea','Galilea','Capernaúm','Samaria','Judea','Damasco','Nínive','Canaán',
  'Ur de los Caldeos','Gólgota','Getsemaní','Emaús','Antioquía','Corinto','Éfeso','Roma',
  'Torre de Babel','Templo de Jerusalén','Patmos','Tiro','Sidón','Filipos'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'objetos-simbolos'), w
from unnest(array[
  'Cruz','Arca de Noé','Arca de la Alianza','Cordero pascual','Paloma','Vid','Pan','Vino','Cáliz',
  'Incienso','Candelabro (menorá)','Maná','Vara de Moisés','Tablas de la Ley','Corona de espinas',
  'Túnica','Red de pescar','Cayado de pastor','Trompeta (shofar)','Altar','Rollo de la Torá',
  'Estrella de Belén','Honda de David','Sepulcro vacío','Piedra angular'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'milagros-eventos'), w
from unnest(array[
  'Diluvio universal','Éxodo de Egipto','Plagas de Egipto','Cruce del Mar Rojo','Caída de Jericó',
  'Multiplicación de panes y peces','Resurrección de Lázaro','Jesús camina sobre el agua',
  'Transfiguración','Pentecostés','Anunciación','Natividad','Bautismo de Jesús','Última Cena',
  'Crucifixión','Resurrección de Jesús','Ascensión','Conversión de Pablo','Sacrificio de Isaac',
  'Zarza ardiente','Bodas de Caná'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'virtudes-temas'), w
from unnest(array[
  'Fe','Esperanza','Amor','Perdón','Salvación','Gracia','Redención','Arrepentimiento','Obediencia',
  'Humildad','Paciencia','Sabiduría','Justicia','Misericordia','Oración','Ayuno','Alabanza','Pacto',
  'Profecía','Parábola','Reino de los Cielos'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'libros'), w
from unnest(array[
  'Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut','Salmos','Proverbios',
  'Eclesiastés','Cantares','Isaías','Daniel','Mateo','Marcos','Lucas','Juan','Hechos','Romanos',
  'Apocalipsis'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'animales'), w
from unnest(array[
  'León','Cordero','Paloma','Serpiente','Asna de Balaam','Gran pez de Jonás','Camello','Oveja',
  'Cuervo','Águila'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'parabolas'), w
from unnest(array[
  'El Buen Samaritano','El Hijo Pródigo','La Oveja Perdida','El Sembrador','Los Talentos',
  'El Grano de Mostaza','La Perla de Gran Precio','Las Diez Vírgenes','El Rico y Lázaro'
]) as w;

insert into casa_impostor_words (category_id, word)
select (select id from casa_impostor_categories where slug = 'fiestas'), w
from unnest(array[
  'Pascua','Pentecostés','Fiesta de los Tabernáculos','Sábado','Navidad','Semana Santa',
  'Domingo de Ramos','Cuaresma'
]) as w;

-- Curated hint_reference for entries with one clear, unambiguous passage.
update casa_impostor_words set hint_reference = v.ref
from (values
  ('Noé', 'Génesis 6-9'),
  ('Adán', 'Génesis 2-3'),
  ('Eva', 'Génesis 2-3'),
  ('Abraham', 'Génesis 12'),
  ('Sacrificio de Isaac', 'Génesis 22'),
  ('Moisés', 'Éxodo 2-3'),
  ('Zarza ardiente', 'Éxodo 3'),
  ('Plagas de Egipto', 'Éxodo 7-12'),
  ('Éxodo de Egipto', 'Éxodo 12'),
  ('Cruce del Mar Rojo', 'Éxodo 14'),
  ('Caída de Jericó', 'Josué 6'),
  ('Sansón', 'Jueces 13-16'),
  ('Rut', 'Rut 1-4'),
  ('David', '1 Samuel 16-17'),
  ('Goliat', '1 Samuel 17'),
  ('Salomón', '1 Reyes 3-11'),
  ('Elías', '1 Reyes 17-19'),
  ('Jonás', 'Jonás 1-2'),
  ('Gran pez de Jonás', 'Jonás 1-2'),
  ('Daniel', 'Daniel 6'),
  ('Ester', 'Ester 1-10'),
  ('Job', 'Job 1-2'),
  ('Juan el Bautista', 'Mateo 3'),
  ('Bautismo de Jesús', 'Mateo 3:13-17'),
  ('Anunciación', 'Lucas 1:26-38'),
  ('Natividad', 'Lucas 2:1-20'),
  ('Bodas de Caná', 'Juan 2:1-11'),
  ('Multiplicación de panes y peces', 'Mateo 14:13-21'),
  ('Jesús camina sobre el agua', 'Mateo 14:22-33'),
  ('Transfiguración', 'Mateo 17:1-8'),
  ('Resurrección de Lázaro', 'Juan 11'),
  ('Última Cena', 'Mateo 26:17-30'),
  ('Crucifixión', 'Juan 19'),
  ('Resurrección de Jesús', 'Juan 20'),
  ('Ascensión', 'Hechos 1:9-11'),
  ('Pentecostés', 'Hechos 2'),
  ('Conversión de Pablo', 'Hechos 9'),
  ('El Buen Samaritano', 'Lucas 10:25-37'),
  ('El Hijo Pródigo', 'Lucas 15:11-32'),
  ('La Oveja Perdida', 'Lucas 15:3-7'),
  ('El Sembrador', 'Mateo 13:1-23'),
  ('Los Talentos', 'Mateo 25:14-30'),
  ('El Grano de Mostaza', 'Mateo 13:31-32'),
  ('La Perla de Gran Precio', 'Mateo 13:45-46'),
  ('Las Diez Vírgenes', 'Mateo 25:1-13'),
  ('El Rico y Lázaro', 'Lucas 16:19-31'),
  ('Torre de Babel', 'Génesis 11:1-9'),
  ('Diluvio universal', 'Génesis 6-9'),
  ('Arca de Noé', 'Génesis 6:14-22'),
  ('Arca de la Alianza', 'Éxodo 25:10-22'),
  ('Tablas de la Ley', 'Éxodo 31:18'),
  ('Maná', 'Éxodo 16'),
  ('Zaqueo', 'Lucas 19:1-10'),
  ('Estrella de Belén', 'Mateo 2:1-12'),
  ('Sepulcro vacío', 'Juan 20:1-9')
) as v(word, ref)
where casa_impostor_words.word = v.word;

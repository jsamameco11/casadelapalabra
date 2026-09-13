import { createClient } from "@/lib/supabase/client";

// Atajo compartido: rellena un campo de texto bíblico desde la Biblia ya
// almacenada. Solo funciona con traducciones guardadas en la base (no con
// las de licencia en vivo, que nunca se copian). El texto siempre queda
// editable a mano después — esto es un punto de partida, no una atadura.
export async function fetchStoredVerseText(params: {
  bookSlug: string;
  chapterStart: number;
  verseStart: number;
  verseEnd?: number | null;
  translationCode: string;
}): Promise<{ text: string } | { error: string }> {
  const supabase = createClient();
  const { bookSlug, chapterStart, verseStart, verseEnd, translationCode } = params;

  const { data: chapter } = await supabase
    .from("casa_bible_chapters")
    .select("id, casa_bible_books!inner(slug)")
    .eq("chapter_number", chapterStart)
    .eq("casa_bible_books.slug", bookSlug)
    .maybeSingle();

  const { data: translation } = await supabase
    .from("casa_bible_translations")
    .select("id")
    .eq("code", translationCode)
    .maybeSingle();

  if (!chapter || !translation) {
    return { error: "No se encontró ese pasaje en la Biblia almacenada." };
  }

  const from = verseStart;
  const to = verseEnd ?? verseStart;
  const { data: verses } = await supabase
    .from("casa_bible_verses")
    .select("verse_number, text")
    .eq("chapter_id", chapter.id)
    .eq("translation_id", translation.id)
    .gte("verse_number", from)
    .lte("verse_number", to)
    .order("verse_number");

  if (!verses?.length) {
    return { error: "Esa traducción no tiene el texto guardado (puede ser de licencia en vivo)." };
  }

  return { text: verses.map((v) => v.text).join(" ") };
}

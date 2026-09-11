import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { BibleTopBar } from "@/components/biblia/bible-top-bar";
import { ChapterGrid } from "@/components/biblia/chapter-grid";
import { fetchApiBibleChapter } from "@/lib/bible/api-bible";

export default async function BibleChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { book, chapter } = await params;
  const { t: translationParam } = await searchParams;
  const chapterNumber = Number(chapter);
  const supabase = await createClient();
  const cookieStore = await cookies();

  // A single round trip for the chapter+book (joined, so we don't need the
  // book id back before looking up the chapter) plus everything else that
  // doesn't depend on it.
  const [{ data: chapterAndBook }, { data: translations }, { data: settings }] = await Promise.all([
    supabase
      .from("casa_bible_chapters")
      .select("id, casa_bible_books!inner(id, slug, default_name, chapter_count)")
      .eq("chapter_number", chapterNumber)
      .eq("casa_bible_books.slug", book)
      .maybeSingle(),
    supabase
      .from("casa_bible_translations")
      .select("id, code, short_name, name, license_type, external_provider, external_identifier")
      .eq("is_active", true)
      .order("position"),
    supabase.from("casa_site_settings").select("default_bible_translation_id").eq("id", 1).maybeSingle(),
  ]);

  const bookRow = chapterAndBook?.casa_bible_books as
    | { id: string; slug: string; default_name: string; chapter_count: number }
    | undefined;
  const chapterRow = chapterAndBook ? { id: chapterAndBook.id } : null;

  if (!bookRow || !Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > bookRow.chapter_count) {
    notFound();
  }

  const preferredCode = translationParam ?? cookieStore.get("casa_bible_translation")?.value;
  const activeTranslations = translations ?? [];
  const selected =
    activeTranslations.find((t) => t.code === preferredCode) ??
    activeTranslations.find((t) => t.id === settings?.default_bible_translation_id) ??
    activeTranslations[0];

  const isLiveTranslation = selected?.license_type === "api_passthrough" && selected.external_provider === "api.bible";

  const { data: storedVerses } =
    chapterRow && selected && !isLiveTranslation
      ? await supabase
          .from("casa_bible_verses")
          .select("verse_number, text")
          .eq("chapter_id", chapterRow.id)
          .eq("translation_id", selected.id)
          .order("verse_number", { ascending: true })
      : { data: null };

  const liveChapter =
    selected && isLiveTranslation && selected.external_identifier
      ? await fetchApiBibleChapter(selected.external_identifier, book, chapterNumber)
      : null;

  const verses = liveChapter
    ? liveChapter.verses.map((v) => ({ verse_number: v.verseNumber, text: v.text }))
    : storedVerses;
  const hasVerses = (verses?.length ?? 0) > 0;
  const prevHref = chapterNumber > 1 ? `/biblia/${book}/${chapterNumber - 1}` : null;
  const nextHref = chapterNumber < bookRow.chapter_count ? `/biblia/${book}/${chapterNumber + 1}` : null;

  return (
    <div>
      <PageHeader eyebrow="Biblia" title={`${bookRow.default_name} ${chapterNumber}`} />
      {activeTranslations.length > 0 && selected && (
        <div className="mb-8">
          <BibleTopBar translations={activeTranslations} currentCode={selected.code} />
        </div>
      )}
      <div className="mx-auto max-w-2xl px-4 pb-24 sm:px-6 lg:px-8">
        {hasVerses ? (
          <div className="space-y-3 leading-relaxed">
            {verses!.map((v) => (
              <p key={v.verse_number} id={`v${v.verse_number}`} className="scroll-mt-24">
                <sup className="mr-1 text-xs font-semibold text-accent">{v.verse_number}</sup>
                {v.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            El texto de este capítulo aún no está disponible en esta traducción. La estructura del
            capítulo ya existe y esta URL ({`/biblia/${book}/${chapterNumber}`}) es estable para SEO.
          </div>
        )}

        {liveChapter?.copyright && (
          <p className="mt-6 text-xs text-muted-foreground">{liveChapter.copyright}</p>
        )}

        <div className="mt-10 flex items-center justify-between text-sm">
          {prevHref ? (
            <Link href={prevHref} className="rounded-full border border-border px-4 py-2 hover:bg-muted">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          {nextHref && (
            <Link href={nextHref} className="rounded-full border border-border px-4 py-2 hover:bg-muted">
              Siguiente →
            </Link>
          )}
        </div>

        <ChapterGrid bookSlug={book} chapterCount={bookRow.chapter_count} currentChapter={chapterNumber} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { BibleTopBar } from "@/components/biblia/bible-top-bar";
import { VerseTools } from "@/components/biblia/verse-tools";
import { ChapterGrid } from "@/components/biblia/chapter-grid";
import { fetchApiBibleVerse } from "@/lib/bible/api-bible";
import type { SupabaseClient } from "@supabase/supabase-js";

interface TranslationRow {
  id: string;
  code: string;
  short_name: string | null;
  name: string;
  license_type?: string;
  external_provider?: string | null;
  external_identifier?: string | null;
}

async function resolveVerseText(
  supabase: SupabaseClient,
  translation: TranslationRow | undefined,
  chapterId: string | undefined,
  slug: string,
  chapterNumber: number,
  verseNumber: number
): Promise<{ text: string; copyright?: string } | null> {
  if (!translation) return null;
  if (translation.license_type === "api_passthrough" && translation.external_provider === "api.bible") {
    if (!translation.external_identifier) return null;
    return fetchApiBibleVerse(translation.external_identifier, slug, chapterNumber, verseNumber);
  }
  if (!chapterId) return null;
  const { data } = await supabase
    .from("casa_bible_verses")
    .select("text")
    .eq("chapter_id", chapterId)
    .eq("translation_id", translation.id)
    .eq("verse_number", verseNumber)
    .maybeSingle();
  return data?.text ? { text: data.text } : null;
}

// Original-language source per testament: Westminster Leningrad Codex
// (Hebrew/Aramaic) for the Old Testament, Textus Receptus (Greek) for the New.
const ORIGINAL_BY_TESTAMENT = {
  old: { code: "WLC", label: "hebreo / arameo original", dir: "rtl" as const, lang: "he" },
  new: { code: "TR", label: "griego original", dir: "ltr" as const, lang: "grc" },
};

export default async function BibleVersePage({
  params,
  searchParams,
}: {
  params: Promise<{ book: string; chapter: string; verse: string }>;
  searchParams: Promise<{ t?: string; compare?: string; original?: string }>;
}) {
  const { book, chapter, verse } = await params;
  const { t: translationParam, compare: compareParam, original: originalParam } = await searchParams;
  const chapterNumber = Number(chapter);
  const verseNumber = Number(verse);
  const supabase = await createClient();
  const cookieStore = await cookies();

  const TRANSLATION_COLUMNS = "id, code, short_name, name, license_type, external_provider, external_identifier";

  // A single round trip for everything that doesn't depend on anything else:
  // the chapter+book (joined, so we don't need the book id back before we
  // can look up the chapter), the active translations, the site default, and
  // both possible original-language translations (we don't know which one —
  // Old or New Testament — applies until the book row comes back, so both
  // are fetched now instead of adding a second sequential round trip later).
  const [{ data: chapterAndBook }, { data: translations }, { data: settings }, { data: originalCandidates }] =
    await Promise.all([
      supabase
        .from("casa_bible_chapters")
        .select("id, verse_count, casa_bible_books!inner(id, slug, default_name, chapter_count, testament)")
        .eq("chapter_number", chapterNumber)
        .eq("casa_bible_books.slug", book)
        .maybeSingle(),
      supabase.from("casa_bible_translations").select(TRANSLATION_COLUMNS).eq("is_active", true).order("position"),
      supabase.from("casa_site_settings").select("default_bible_translation_id").eq("id", 1).maybeSingle(),
      supabase.from("casa_bible_translations").select(TRANSLATION_COLUMNS).in("code", ["WLC", "TR"]),
    ]);

  const bookRow = chapterAndBook?.casa_bible_books as
    | { id: string; slug: string; default_name: string; chapter_count: number; testament: string }
    | undefined;
  const chapterRow = chapterAndBook ? { id: chapterAndBook.id, verse_count: chapterAndBook.verse_count } : null;

  if (
    !bookRow ||
    !Number.isInteger(chapterNumber) ||
    chapterNumber < 1 ||
    chapterNumber > bookRow.chapter_count ||
    !Number.isInteger(verseNumber) ||
    verseNumber < 1 ||
    (chapterRow?.verse_count && verseNumber > chapterRow.verse_count)
  ) {
    notFound();
  }

  const preferredCode = translationParam ?? cookieStore.get("casa_bible_translation")?.value;
  const activeTranslations = translations ?? [];
  const selected =
    activeTranslations.find((t) => t.code === preferredCode) ??
    activeTranslations.find((t) => t.id === settings?.default_bible_translation_id) ??
    activeTranslations[0];
  const compareTranslation = compareParam ? activeTranslations.find((t) => t.code === compareParam) : undefined;
  const original = ORIGINAL_BY_TESTAMENT[bookRow.testament as "old" | "new"];
  const showOriginal = originalParam === "1";
  const originalTranslation = showOriginal
    ? (originalCandidates ?? []).find((t) => t.code === original.code)
    : undefined;

  // The three verse lookups (main, compare, original) don't depend on each
  // other either — including the two live api.bible fetches, which is where
  // most of the latency was coming from when they ran one after another.
  const [verseRow, compareRow, originalRow] = await Promise.all([
    resolveVerseText(supabase, selected, chapterRow?.id, book, chapterNumber, verseNumber),
    resolveVerseText(supabase, compareTranslation, chapterRow?.id, book, chapterNumber, verseNumber),
    resolveVerseText(supabase, originalTranslation ?? undefined, chapterRow?.id, book, chapterNumber, verseNumber),
  ]);

  const prevHref = verseNumber > 1 ? `/biblia/${book}/${chapterNumber}/${verseNumber - 1}` : null;
  const nextHref = `/biblia/${book}/${chapterNumber}/${verseNumber + 1}`;

  return (
    <div>
      <PageHeader eyebrow="Biblia" title={`${bookRow.default_name} ${chapterNumber}:${verseNumber}`} />
      {activeTranslations.length > 0 && selected && (
        <div className="mb-8">
          <BibleTopBar translations={activeTranslations} currentCode={selected.code} />
        </div>
      )}
      <div className="mx-auto max-w-2xl px-4 pb-24 sm:px-6 lg:px-8">
        {verseRow ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {selected?.short_name ?? selected?.name}
            </p>
            <p className="mt-2 font-display text-xl leading-relaxed sm:text-2xl">
              <sup className="mr-1 text-sm font-semibold text-accent">{verseNumber}</sup>
              {verseRow.text}
            </p>
            {verseRow.copyright && <p className="mt-3 text-xs text-muted-foreground">{verseRow.copyright}</p>}

            {compareParam && (
              <div className="mt-6 border-t border-border pt-6 text-left">
                {compareRow ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {compareTranslation?.short_name ?? compareTranslation?.name}
                    </p>
                    <p className="mt-2 font-display text-lg leading-relaxed">
                      <sup className="mr-1 text-xs font-semibold text-accent">{verseNumber}</sup>
                      {compareRow.text}
                    </p>
                    {compareRow.copyright && (
                      <p className="mt-3 text-xs text-muted-foreground">{compareRow.copyright}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este versículo aún no está disponible en {compareTranslation?.name ?? "esa versión"}.
                  </p>
                )}
              </div>
            )}

            {showOriginal && (
              <div className="mt-6 border-t border-border pt-6 text-left">
                {originalRow ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Texto {original.label}
                    </p>
                    <p
                      dir={original.dir}
                      lang={original.lang}
                      className={`mt-2 font-display text-lg leading-relaxed ${original.dir === "rtl" ? "text-right" : ""}`}
                    >
                      <sup className="mr-1 text-xs font-semibold text-accent">{verseNumber}</sup>
                      {originalRow.text}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    El texto original no está disponible para este versículo.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Este versículo aún no está disponible en esta traducción.
          </div>
        )}

        {selected && (
          <VerseTools
            translations={activeTranslations}
            currentCode={selected.code}
            compareCode={compareParam ?? null}
            showOriginal={showOriginal}
            originalAvailable
            originalLabel={original.label}
          />
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          {prevHref ? (
            <Link href={prevHref} className="rounded-full border border-border px-4 py-2 hover:bg-muted">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <Link href={`/biblia/${book}/${chapterNumber}`} className="text-sm font-medium text-primary hover:underline">
            Ver capítulo completo
          </Link>
          <Link href={nextHref} className="rounded-full border border-border px-4 py-2 hover:bg-muted">
            Siguiente →
          </Link>
        </div>

        <ChapterGrid bookSlug={book} chapterCount={bookRow.chapter_count} currentChapter={chapterNumber} />
      </div>
    </div>
  );
}

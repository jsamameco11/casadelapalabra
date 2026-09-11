"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeText, parseReference, suggestBooks, type BookLookup } from "@/lib/bible-search";
import { PageHeader } from "@/components/layout/page-header";
import { BookSuggestions } from "@/components/biblia/book-suggestions";

interface VerseResult {
  verse_number: number;
  text: string;
  chapter: { chapter_number: number; book: { slug: string; default_name: string } | null } | null;
}

export function BibleSearch() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [books, setBooks] = useState<BookLookup[]>([]);
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [results, setResults] = useState<VerseResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    supabase
      .from("casa_bible_books")
      .select("slug, default_name, book_number")
      .then(({ data }) => setBooks((data as BookLookup[]) ?? []));

    supabase
      .from("casa_site_settings")
      .select("default_bible_translation_id")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setTranslationId(data?.default_bible_translation_id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialQuery && books.length > 0 && translationId) {
      runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books.length, translationId]);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError("");

    // Only ever issue ONE router navigation per search: calling replace()
    // and then push() back-to-back raced two client transitions against
    // each other and Next.js silently aborted the second (the actual
    // reference redirect never completed — reported as a dead "Buscar" button).
    const reference = parseReference(trimmed, books);
    if (reference) {
      // A specific verse ("Juan 3:16") goes to the single-verse page — not
      // the whole chapter — per product decision. A bare chapter reference
      // ("Salmos 23") still opens the full chapter.
      const target = reference.verse
        ? `/biblia/${reference.book.slug}/${reference.chapter}/${reference.verse}`
        : `/biblia/${reference.book.slug}/${reference.chapter}`;
      router.push(target);
      return;
    }

    router.replace(`/buscar?q=${encodeURIComponent(trimmed)}`);
    if (!translationId) return;
    setLoading(true);
    const term = normalizeText(trimmed);
    // Word-boundary regex (not a plain %term% ilike) so searching "amor"
    // doesn't also surface "clamor" or "Amorrheo".
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const { data, error } = await supabase
      .from("casa_bible_verses")
      .select("verse_number, text, casa_bible_chapters(chapter_number, casa_bible_books(slug, default_name))")
      .eq("translation_id", translationId)
      .filter("search_text", "imatch", `\\y${escaped}\\y`)
      .limit(50);
    setLoading(false);

    if (error) {
      setError("No se pudo completar la búsqueda.");
      return;
    }
    setResults(
      (data ?? []).map((row) => ({
        verse_number: row.verse_number,
        text: row.text,
        chapter: row.casa_bible_chapters
          ? {
              chapter_number: (row.casa_bible_chapters as unknown as { chapter_number: number }).chapter_number,
              book: (row.casa_bible_chapters as unknown as { casa_bible_books: { slug: string; default_name: string } })
                .casa_bible_books,
            }
          : null,
      }))
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Biblia"
        title="Buscar en la Biblia"
        description='Escribe una referencia ("Juan 3:16"), un libro ("Salmos 23") o una palabra o frase.'
      />
      <div className="mx-auto max-w-2xl px-4 pb-24 sm:px-6 lg:px-8">
        <div ref={wrapperRef} className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowSuggestions(false);
              runSearch(query);
            }}
            className="flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Juan 3:16, Salmos 23, amor…"
              className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Buscar
            </button>
          </form>
          {showSuggestions && <BookSuggestions books={suggestBooks(query, books)} onSelect={() => setShowSuggestions(false)} />}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-center text-sm text-muted-foreground">Buscando…</p>}

        {results && !loading && (
          <div className="mt-8 space-y-3">
            {results.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No se encontraron versículos para “{query}”.
              </p>
            ) : (
              results.map((r, i) => (
                <Link
                  key={i}
                  href={r.chapter?.book ? `/biblia/${r.chapter.book.slug}/${r.chapter.chapter_number}/${r.verse_number}` : "#"}
                  className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <p className="text-xs font-semibold text-accent">
                    {r.chapter?.book?.default_name} {r.chapter?.chapter_number}:{r.verse_number}
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{r.text}</p>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { suggestBooks, type BookLookup } from "@/lib/bible-search";
import { BookSuggestions } from "@/components/biblia/book-suggestions";
import { IconSearch } from "@/components/icons/line-art";

interface Translation {
  id: string;
  code: string;
  short_name: string | null;
  name: string;
}

// The two controls that belong in this row, and only these two (per product
// decision): a verse/passage search on the left, a translation switcher on
// the right. Nothing else gets added here.
export function BibleTopBar({ translations, currentCode }: { translations: Translation[]; currentCode: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<BookLookup[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("casa_bible_books")
      .select("slug, default_name, book_number")
      .then(({ data }) => setBooks((data as BookLookup[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
  }

  function changeTranslation(code: string) {
    document.cookie = `casa_bible_translation=${code}; path=/; max-age=31536000`;
    router.refresh();
  }

  const suggestions = suggestBooks(query, books);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div ref={wrapperRef} className="relative w-full max-w-sm">
        <form
          onSubmit={submitSearch}
          className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 pl-4"
        >
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar versículo o pasaje…"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="flex shrink-0 items-center justify-center rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90"
          >
            <IconSearch className="h-4 w-4" />
          </button>
        </form>
        {showSuggestions && <BookSuggestions books={suggestions} onSelect={() => setShowSuggestions(false)} />}
      </div>

      <select
        value={currentCode}
        onChange={(e) => changeTranslation(e.target.value)}
        className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm sm:w-auto"
      >
        {translations.map((t) => (
          <option key={t.id} value={t.code}>
            {t.short_name ?? t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

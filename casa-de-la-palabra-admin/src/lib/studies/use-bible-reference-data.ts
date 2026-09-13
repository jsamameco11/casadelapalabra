"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface BibleBook {
  slug: string;
  default_name: string;
  testament: string;
  chapter_count: number;
}

export interface BibleTranslationOption {
  code: string;
  short_name: string | null;
  name: string;
}

// Compartido por VerseEditor (versículo de un bloque) y MainVerseEditor
// (versículo principal del estudio) — ambos necesitan el mismo catálogo de
// libros/traducciones, así que se cargan una sola vez desde un solo lugar.
export function useBibleReferenceData() {
  const supabase = createClient();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [translations, setTranslations] = useState<BibleTranslationOption[]>([]);

  useEffect(() => {
    supabase
      .from("casa_bible_books")
      .select("slug, default_name, testament, chapter_count")
      .order("book_number")
      .then(({ data }) => setBooks((data as BibleBook[]) ?? []));

    supabase
      .from("casa_bible_translations")
      .select("code, short_name, name")
      .eq("is_active", true)
      .order("position")
      .then(({ data }) => setTranslations(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { books, translations };
}

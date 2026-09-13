"use client";

import { useState } from "react";
import { useBibleReferenceData } from "@/lib/studies/use-bible-reference-data";
import { fetchStoredVerseText } from "@/lib/studies/fetch-verse-text";
import { formatReference } from "@/lib/studies/blocks";

export interface MainVerseValues {
  main_verse_book_slug: string;
  main_verse_chapter: string;
  main_verse_verse_start: string;
  main_verse_verse_end: string;
  main_verse_translation_code: string;
  main_verse: string;
}

// El versículo principal del estudio: referencia estructurada (libro,
// capítulo, versículo, traducción) + su texto, mostrados por separado —
// no una sola línea de texto libre mezclando cita y contenido.
export function MainVerseFields({
  values,
  onChange,
}: {
  values: MainVerseValues;
  onChange: <K extends keyof MainVerseValues>(key: K, value: MainVerseValues[K]) => void;
}) {
  const { books, translations } = useBibleReferenceData();
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");

  const book = books.find((b) => b.slug === values.main_verse_book_slug);
  const reference =
    values.main_verse_chapter && values.main_verse_book_slug
      ? formatReference(
          {
            book_slug: values.main_verse_book_slug,
            chapter_start: Number(values.main_verse_chapter),
            verse_start: values.main_verse_verse_start ? Number(values.main_verse_verse_start) : null,
            chapter_end: null,
            verse_end: values.main_verse_verse_end ? Number(values.main_verse_verse_end) : null,
            translation_code: null,
            text: null,
            show_reference: true,
            reflection_enabled: false,
            reflection_title: null,
            reflection_content: null,
            reflection_configuration: {},
          },
          book?.default_name
        )
      : "";

  async function fetchFromBible() {
    if (!values.main_verse_book_slug || !values.main_verse_chapter || !values.main_verse_verse_start || !values.main_verse_translation_code) {
      setFetchMessage("Elige libro, capítulo, versículo y traducción primero.");
      return;
    }
    setFetching(true);
    setFetchMessage("");
    const result = await fetchStoredVerseText({
      bookSlug: values.main_verse_book_slug,
      chapterStart: Number(values.main_verse_chapter),
      verseStart: Number(values.main_verse_verse_start),
      verseEnd: values.main_verse_verse_end ? Number(values.main_verse_verse_end) : null,
      translationCode: values.main_verse_translation_code,
    });
    setFetching(false);
    if ("error" in result) {
      setFetchMessage(result.error);
      return;
    }
    onChange("main_verse", result.text);
    setFetchMessage("Texto traído. Puedes editarlo libremente.");
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Libro</p>
          <select
            value={values.main_verse_book_slug}
            onChange={(e) => onChange("main_verse_book_slug", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Elegir libro…</option>
            <optgroup label="Antiguo Testamento">
              {books
                .filter((b) => b.testament === "old")
                .map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.default_name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Nuevo Testamento">
              {books
                .filter((b) => b.testament === "new")
                .map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.default_name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Traducción</p>
          <select
            value={values.main_verse_translation_code}
            onChange={(e) => onChange("main_verse_translation_code", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Sin especificar</option>
            {translations.map((t) => (
              <option key={t.code} value={t.code}>
                {t.short_name ?? t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Capítulo</p>
          <input
            type="number"
            min={1}
            value={values.main_verse_chapter}
            onChange={(e) => onChange("main_verse_chapter", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Versículo</p>
          <input
            type="number"
            min={1}
            value={values.main_verse_verse_start}
            onChange={(e) => onChange("main_verse_verse_start", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Vers. final (opc.)</p>
          <input
            type="number"
            min={1}
            value={values.main_verse_verse_end}
            onChange={(e) => onChange("main_verse_verse_end", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {reference && <p className="text-xs text-muted-foreground">Referencia: <span className="text-foreground">{reference}</span></p>}

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Texto bíblico</p>
        <textarea
          value={values.main_verse}
          onChange={(e) => onChange("main_verse", e.target.value)}
          rows={3}
          placeholder="El texto que abre el estudio"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={fetchFromBible}
          disabled={fetching}
          className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
        >
          {fetching ? "Buscando…" : "Traer texto de la Biblia"}
        </button>
        {fetchMessage && <span className="text-xs text-muted-foreground">{fetchMessage}</span>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { StudyContent, StudyVerse } from "@/lib/studies/blocks";
import { formatReference } from "@/lib/studies/blocks";
import { VERSE_LAYOUT_OPTIONS } from "@/lib/studies/library";
import { useBibleReferenceData } from "@/lib/studies/use-bible-reference-data";
import { fetchStoredVerseText } from "@/lib/studies/fetch-verse-text";
import { CheckboxField, Field, NumberField, SelectField, TextAreaField, TextField } from "./field";

// Editor de versículo. El texto siempre queda en manos del editor: se puede
// traer de la Biblia que ya está en la base, pero es un atajo, no una atadura
// — se sobreescribe a mano cuando haga falta.
export function VerseEditor({
  content,
  onVerseChange,
  onContentChange,
}: {
  content: StudyContent;
  onVerseChange: (patch: Partial<StudyVerse>) => void;
  onContentChange: (patch: Partial<StudyContent>) => void;
}) {
  const verse = content.verse;
  const { books, translations } = useBibleReferenceData();
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");

  if (!verse) return null;

  const book = books.find((b) => b.slug === verse.book_slug);
  const reference = formatReference(verse, book?.default_name);

  async function fetchFromBible() {
    if (!verse?.book_slug || !verse.chapter_start || !verse.verse_start || !verse.translation_code) {
      setFetchMessage("Elige libro, capítulo, versículo y traducción primero.");
      return;
    }
    setFetching(true);
    setFetchMessage("");
    const result = await fetchStoredVerseText({
      bookSlug: verse.book_slug,
      chapterStart: verse.chapter_start,
      verseStart: verse.verse_start,
      verseEnd: verse.verse_end,
      translationCode: verse.translation_code,
    });
    setFetching(false);
    if ("error" in result) {
      setFetchMessage(result.error);
      return;
    }
    onVerseChange({ text: result.text });
    setFetchMessage("Texto traído. Puedes editarlo libremente.");
  }

  return (
    <div className="space-y-4">
      <Field label="Título del bloque (opcional)">
        <TextField
          value={content.title ?? ""}
          placeholder="Ej. El Señor es mi pastor"
          onCommit={(v) => onContentChange({ title: v || null })}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Libro">
          <select
            value={verse.book_slug ?? ""}
            onChange={(e) => onVerseChange({ book_slug: e.target.value || null })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Elegir libro…</option>
            <optgroup label="Antiguo Testamento">
              {books.filter((b) => b.testament === "old").map((b) => (
                <option key={b.slug} value={b.slug}>{b.default_name}</option>
              ))}
            </optgroup>
            <optgroup label="Nuevo Testamento">
              {books.filter((b) => b.testament === "new").map((b) => (
                <option key={b.slug} value={b.slug}>{b.default_name}</option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Traducción">
          <select
            value={verse.translation_code ?? ""}
            onChange={(e) => onVerseChange({ translation_code: e.target.value || null })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Sin especificar</option>
            {translations.map((t) => (
              <option key={t.code} value={t.code}>{t.short_name ?? t.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Capítulo">
          <NumberField value={verse.chapter_start} onCommit={(v) => onVerseChange({ chapter_start: v })} />
        </Field>
        <Field label="Versículo">
          <NumberField value={verse.verse_start} onCommit={(v) => onVerseChange({ verse_start: v })} />
        </Field>
        <Field label="Cap. final (opc.)">
          <NumberField value={verse.chapter_end} onCommit={(v) => onVerseChange({ chapter_end: v })} />
        </Field>
        <Field label="Vers. final (opc.)">
          <NumberField value={verse.verse_end} onCommit={(v) => onVerseChange({ verse_end: v })} />
        </Field>
      </div>

      {reference && (
        <p className="text-xs text-muted-foreground">
          Referencia: <span className="text-foreground">{reference}</span>
        </p>
      )}

      <Field label="Texto bíblico">
        <TextAreaField
          value={verse.text ?? ""}
          rows={4}
          placeholder="Escribe o pega el texto del versículo."
          onCommit={(v) => onVerseChange({ text: v || null })}
        />
      </Field>

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

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <CheckboxField
          checked={verse.show_reference}
          label="Mostrar la referencia"
          onCommit={(v) => onVerseChange({ show_reference: v })}
        />
        <CheckboxField
          checked={verse.reflection_enabled}
          label="Agregar reflexión"
          onCommit={(v) => onVerseChange({ reflection_enabled: v })}
        />
      </div>

      <Field label="Diseño del versículo">
        <SelectField
          value={(content.configuration.layout as string) ?? "classic"}
          options={VERSE_LAYOUT_OPTIONS}
          onCommit={(v) => onContentChange({ configuration: { ...content.configuration, layout: v } })}
        />
      </Field>

      {/* Solo "al costado" e "inmersivo" usan una imagen — los demás diseños
          no la muestran, así que el campo se oculta para no confundir. */}
      {(["side", "immersive"].includes((content.configuration.layout as string) ?? "classic")) && (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <Field label={(content.configuration.layout as string) === "immersive" ? "Imagen de fondo" : "Imagen al costado"}>
            <ImageUploadField
              value={content.media_url ?? ""}
              folder="studies"
              onChange={(v) => onContentChange({ media_url: v || null })}
            />
          </Field>
          <Field label="Texto alternativo (accesibilidad, opcional)">
            <TextField
              value={content.media_alt ?? ""}
              placeholder="Describe la imagen para quien no puede verla"
              onCommit={(v) => onContentChange({ media_alt: v || null })}
            />
          </Field>
        </div>
      )}

      {/* La reflexión solo aparece si se pidió: sin ella el bloque es solo
          referencia + texto, sin huecos ni campos vacíos. */}
      {verse.reflection_enabled && (
        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Reflexión</p>
          <Field label="Título (opcional)">
            <TextField
              value={verse.reflection_title ?? ""}
              placeholder="Ej. Una invitación a confiar"
              onCommit={(v) => onVerseChange({ reflection_title: v || null })}
            />
          </Field>
          <Field label="Texto de la reflexión">
            <TextAreaField
              value={verse.reflection_content ?? ""}
              rows={5}
              onCommit={(v) => onVerseChange({ reflection_content: v || null })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

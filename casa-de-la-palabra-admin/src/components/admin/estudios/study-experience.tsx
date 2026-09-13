"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatReference, sectionNumber, type StudyContent, type StudySection } from "@/lib/studies/blocks";
import { StudyContentBlock } from "./study-content";

interface StudyHeader {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
}

interface MainVerse {
  text: string;
  book_slug: string | null;
  chapter_start: number | null;
  verse_start: number | null;
  verse_end: number | null;
  translation_code: string | null;
}

// Copia adaptada de casa-de-la-palabra-web/src/components/estudios/study-experience.tsx
// — el mismo componente que renderiza el sitio público, reutilizado tal cual
// para que la previsualización del panel sea la experiencia real, no una
// aproximación. Si cambias el diseño acá, cámbialo también allá.
export function StudyExperience({
  study,
  mainVerse,
  sections,
  bookNames,
}: {
  study: StudyHeader;
  mainVerse?: MainVerse | null;
  sections: StudySection[];
  bookNames: Record<string, string>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = useCallback(
    (index: number) => {
      setOpenIndex(index);
      const id = sections[index]?.id;
      if (!id) return;
      setRead((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    [sections]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openIndex !== null && !dialog.open) dialog.showModal();
    if (openIndex === null && dialog.open) dialog.close();
  }, [openIndex]);

  const progress = sections.length ? Math.round((read.length / sections.length) * 100) : 0;
  const nextIndex = sections.findIndex((s) => !read.includes(s.id));
  const current = openIndex !== null ? sections[openIndex] : null;

  return (
    <div className="study-experience min-h-full">
      <StudyTopBar title={study.title} total={sections.length} progress={progress} started={read.length > 0} />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6">
        {study.subtitle && (
          <p className="mb-6 text-center text-sm" style={{ color: "var(--study-muted)" }}>
            {study.subtitle}
          </p>
        )}

        {mainVerse && <MainVerseHero verse={mainVerse} bookNames={bookNames} />}

        <ol className="space-y-3">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              isRead={read.includes(section.id)}
              bookNames={bookNames}
              onOpen={() => open(index)}
            />
          ))}
        </ol>

        {sections.length === 0 && (
          <p className="py-16 text-center text-sm" style={{ color: "var(--study-muted)" }}>
            Todavía no hay secciones. Agrega la primera desde el constructor de la izquierda.
          </p>
        )}
      </main>

      {sections.length > 0 && (
        <div className="px-4 pb-6 pt-2 sm:px-6">
          <div className="mx-auto max-w-[1180px] text-center">
            <button
              type="button"
              onClick={() => open(nextIndex === -1 ? 0 : nextIndex)}
              className="w-full rounded-2xl px-8 py-3.5 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90 sm:w-auto"
              style={{ background: "var(--study-ink)" }}
            >
              {nextIndex === -1 ? "Repasar el estudio" : read.length ? "Continuar el estudio" : "Comenzar el estudio"} →
            </button>
          </div>
        </div>
      )}

      <SectionDialog
        ref={dialogRef}
        section={current}
        index={openIndex}
        total={sections.length}
        bookNames={bookNames}
        onClose={() => setOpenIndex(null)}
        onNavigate={(direction) => {
          if (openIndex === null) return;
          const target = openIndex + direction;
          if (target >= 0 && target < sections.length) open(target);
        }}
      />
    </div>
  );
}

// El versículo principal del estudio: cita destacada arriba de las
// secciones, con la referencia mostrada aparte del texto (nunca en la misma
// línea) para que se note que es un versículo y no un párrafo más.
function MainVerseHero({ verse, bookNames }: { verse: MainVerse; bookNames: Record<string, string> }) {
  const reference = formatReference(
    {
      book_slug: verse.book_slug,
      chapter_start: verse.chapter_start,
      verse_start: verse.verse_start,
      chapter_end: null,
      verse_end: verse.verse_end,
      translation_code: null,
      text: null,
      show_reference: true,
      reflection_enabled: false,
      reflection_title: null,
      reflection_content: null,
      reflection_configuration: {},
    },
    verse.book_slug ? bookNames[verse.book_slug] : undefined
  );
  const translation = verse.translation_code ? ` · ${verse.translation_code}` : "";

  return (
    <figure
      className="mx-auto mb-8 max-w-2xl rounded-3xl p-6 text-center sm:p-8"
      style={{ background: "var(--study-surface)", boxShadow: "var(--study-shadow)" }}
    >
      <blockquote className="font-display text-lg italic leading-relaxed sm:text-xl">{verse.text}</blockquote>
      {reference && (
        <figcaption className="mt-3 text-sm" style={{ color: "var(--study-muted)" }}>
          — {reference}
          {translation}
        </figcaption>
      )}
    </figure>
  );
}

function StudyTopBar({
  title,
  total,
  progress,
  started,
}: {
  title: string;
  total: number;
  progress: number;
  started: boolean;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ borderColor: "var(--study-line)", background: "color-mix(in srgb, var(--study-bg) 88%, transparent)" }}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <h1 className="truncate font-display text-base tracking-wide sm:text-lg">{title || "Sin título"}</h1>
        <div className="shrink-0 text-right">
          <p className="text-xs whitespace-nowrap" style={{ color: "var(--study-muted)" }}>
            {total} {total === 1 ? "sección" : "secciones"}
          </p>
          <div
            className="mt-1.5 h-1 w-24 overflow-hidden rounded-full"
            style={{ background: "var(--study-line)" }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso del estudio"
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progress}%`, background: "var(--study-ink)" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function SectionCard({
  section,
  index,
  isRead,
  bookNames,
  onOpen,
}: {
  section: StudySection;
  index: number;
  isRead: boolean;
  bookNames: Record<string, string>;
  onOpen: () => void;
}) {
  const preview = useMemo(() => buildPreview(section, bookNames), [section, bookNames]);

  return (
    <li>
      <article
        className="group grid grid-cols-[auto_1fr] gap-3 rounded-2xl p-4 transition-shadow sm:gap-4"
        style={{ background: "var(--study-surface)", boxShadow: "var(--study-shadow)" }}
      >
        <div
          className="font-display text-xl leading-none sm:text-2xl"
          style={{ color: isRead ? "var(--study-accent)" : "var(--study-accent-soft)" }}
          aria-hidden
        >
          {sectionNumber(index)}
        </div>

        <div className="border-l pl-3 sm:pl-4" style={{ borderColor: "var(--study-line)" }}>
          <div className="gap-4 sm:flex sm:items-start">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold sm:text-base">
                <button
                  type="button"
                  onClick={onOpen}
                  className="text-left after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4"
                  style={{ outlineColor: "var(--study-accent)" }}
                >
                  <span className="relative">{section.title || "Sección sin nombre"}</span>
                </button>
              </h2>

              {preview.lead && (
                <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--study-muted)" }}>
                  {preview.lead}
                </p>
              )}

              {preview.verseText && (
                <blockquote className="mt-2 font-display text-sm italic leading-relaxed sm:text-base">
                  {preview.verseText}
                  {preview.reference && (
                    <footer className="mt-1 text-xs not-italic" style={{ color: "var(--study-muted)" }}>
                      — {preview.reference}
                    </footer>
                  )}
                </blockquote>
              )}

              {preview.listItems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {preview.listItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(preview.reference || preview.hasReflection || preview.extraCount > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {preview.reference && !preview.verseText && (
                    <Chip icon={<BookIcon />} label={preview.reference} />
                  )}
                  {preview.hasReflection && <Chip icon={<LeafIcon />} label="Reflexión" />}
                  {preview.extraCount > 0 && (
                    <span className="text-xs" style={{ color: "var(--study-muted)" }}>
                      +{preview.extraCount} {preview.extraCount === 1 ? "bloque más" : "bloques más"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.image.url}
                alt={preview.image.alt}
                loading="lazy"
                className="mt-3 h-20 w-full shrink-0 rounded-xl object-cover sm:mt-0 sm:w-32"
              />
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs"
      style={{ background: "color-mix(in srgb, var(--study-accent) 9%, transparent)", color: "var(--study-accent)" }}
    >
      {icon}
      {label}
    </span>
  );
}

const SectionDialog = function SectionDialog({
  ref,
  section,
  index,
  total,
  bookNames,
  onClose,
  onNavigate,
}: {
  ref: React.Ref<HTMLDialogElement>;
  section: StudySection | null;
  index: number | null;
  total: number;
  bookNames: Record<string, string>;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
}) {
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(40rem,90%)] rounded-2xl p-0 backdrop:bg-black/40"
      style={{ background: "var(--study-surface)", color: "var(--study-ink)" }}
      aria-labelledby="seccion-preview-titulo"
    >
      {section && index !== null && (
        <div className="max-h-[80vh] overflow-y-auto">
          <header
            className="sticky top-0 flex items-start gap-3 border-b px-5 py-4 backdrop-blur"
            style={{
              borderColor: "var(--study-line)",
              background: "color-mix(in srgb, var(--study-surface) 92%, transparent)",
            }}
          >
            <span className="font-display text-xl leading-none" style={{ color: "var(--study-accent)" }} aria-hidden>
              {sectionNumber(index)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="seccion-preview-titulo" className="text-base font-semibold">
                {section.title || "Sección sin nombre"}
              </h2>
              {section.subtitle && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--study-muted)" }}>
                  {section.subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full px-2 py-1 text-lg leading-none transition-colors hover:bg-black/5"
              style={{ color: "var(--study-muted)" }}
            >
              ×
            </button>
          </header>

          <div className="space-y-6 px-5 py-6">
            {section.contents.length > 0 ? (
              section.contents
                .filter((c) => c.is_visible)
                .map((content) => <StudyContentBlock key={content.id} content={content} bookNames={bookNames} />)
            ) : (
              <p className="text-sm" style={{ color: "var(--study-muted)" }}>
                Esta sección todavía no tiene contenido.
              </p>
            )}
          </div>

          <footer
            className="sticky bottom-0 flex items-center justify-between gap-3 border-t px-5 py-3 backdrop-blur"
            style={{
              borderColor: "var(--study-line)",
              background: "color-mix(in srgb, var(--study-surface) 92%, transparent)",
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              disabled={index === 0}
              className="rounded-full border px-3 py-1.5 text-xs transition-opacity disabled:opacity-40"
              style={{ borderColor: "var(--study-line)" }}
            >
              ← Anterior
            </button>
            <span className="text-xs" style={{ color: "var(--study-muted)" }}>
              {sectionNumber(index)} / {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => onNavigate(1)}
              disabled={index === total - 1}
              className="rounded-full px-4 py-1.5 text-xs text-white transition-opacity disabled:opacity-40"
              style={{ background: "var(--study-ink)" }}
            >
              Siguiente →
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
};

interface Preview {
  lead: string | null;
  verseText: string | null;
  reference: string | null;
  hasReflection: boolean;
  listItems: string[];
  image: { url: string; alt: string } | null;
  extraCount: number;
}

function buildPreview(section: StudySection, bookNames: Record<string, string>): Preview {
  const contents = section.contents.filter((c) => c.is_visible);
  const verse = contents.find((c) => c.type === "verse" && c.verse);
  const text = contents.find((c) => c.type === "text" || c.type === "highlight");
  const question = contents.find((c) => c.type === "question");
  const list = contents.find((c) => c.type === "list");
  const image = contents.find((c) => (c.type === "image" || c.type === "image-text") && c.media_url);

  const reference =
    verse?.verse && verse.verse.show_reference
      ? formatReference(verse.verse, verse.verse.book_slug ? bookNames[verse.verse.book_slug] : undefined)
      : null;

  const lead = section.subtitle ?? trim(question?.body) ?? trim(text?.body) ?? null;

  const listItems = Array.isArray(list?.configuration.items) ? (list.configuration.items as string[]).slice(0, 4) : [];

  const shown = [verse, text, question, list, image].filter(Boolean).length;

  return {
    lead,
    verseText: trim(verse?.verse?.text, 140),
    reference,
    hasReflection:
      Boolean(verse?.verse?.reflection_enabled) || contents.some((c: StudyContent) => c.type === "reflection"),
    listItems,
    image: image?.media_url ? { url: image.media_url, alt: image.media_alt ?? "" } : null,
    extraCount: Math.max(0, contents.length - shown),
  };
}

function trim(value: string | null | undefined, max = 110): string | null {
  if (!value) return null;
  const clean = value.replace(/\s+/g, " ").trim();
  return clean ? truncate(clean, max) : null;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max).trimEnd()}…`;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--study-accent)" }}>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
      <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h5a2 2 0 012 2v9a2 2 0 00-2-2H3v-9zM17 4.5h-5a2 2 0 00-2 2v9a2 2 0 012-2h5v-9z" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15.5 4.5c0 6-4 9-9.5 9.5 0-6 4-9 9.5-9.5zM6 14c1.5-3 4-5 7-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

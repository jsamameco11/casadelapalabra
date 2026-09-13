"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatReference, sectionNumber, type StudyContent, type StudySection } from "@/lib/studies/blocks";
import { StudyContentBlock } from "@/components/estudios/study-content";

interface StudyHeader {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
}

// La lectura ocurre en tarjetas numeradas; el desglose completo de cada
// sección se abre en un modal. Lo que se ve en la tarjeta sale del contenido
// real: si la sección tiene versículo se muestra su referencia, si tiene lista
// se muestran sus puntos, etc. Nada está escrito a mano acá.
export function StudyExperience({
  study,
  sections,
  bookNames,
}: {
  study: StudyHeader;
  sections: StudySection[];
  bookNames: Record<string, string>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const storageKey = `casa-estudio-${study.id}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setRead(JSON.parse(saved) as string[]);
    } catch {
      // Sin almacenamiento (modo privado): el progreso simplemente no persiste.
    }
  }, [storageKey]);

  const open = useCallback(
    (index: number) => {
      setOpenIndex(index);
      const id = sections[index]?.id;
      if (!id) return;
      setRead((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignorado a propósito */
        }
        return next;
      });
    },
    [sections, storageKey]
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
    <div className="study-experience min-h-screen">
      <StudyTopBar
        title={study.title}
        total={sections.length}
        progress={progress}
        started={read.length > 0}
      />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-32 pt-8 sm:px-6 lg:px-8">
        {study.subtitle && (
          <p className="mb-8 text-center text-base" style={{ color: "var(--study-muted)" }}>
            {study.subtitle}
          </p>
        )}

        <ol className="space-y-4">
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
            Este estudio todavía no tiene secciones publicadas.
          </p>
        )}
      </main>

      {sections.length > 0 && (
        <div className="sticky bottom-0 z-20 px-4 pb-6 pt-2 sm:px-6">
          <div className="mx-auto max-w-[1180px] text-center">
            <button
              type="button"
              onClick={() => open(nextIndex === -1 ? 0 : nextIndex)}
              className="w-full rounded-2xl px-8 py-4 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90 sm:w-auto"
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
      <div className="mx-auto grid max-w-[1180px] grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <p className="hidden text-sm font-medium lg:block">
          Casa de la Palabra
          <span className="block text-xs font-normal" style={{ color: "var(--study-muted)" }}>
            Estudio bíblico
          </span>
        </p>

        <h1 className="font-display text-lg tracking-wide sm:text-2xl lg:text-center">{title}</h1>

        <div className="lg:justify-self-end lg:text-right">
          <p className="text-xs whitespace-nowrap" style={{ color: "var(--study-muted)" }}>
            {total} {total === 1 ? "sección" : "secciones"} · {started ? "En progreso" : "Sin comenzar"}
          </p>
          <div
            className="mt-2 h-1 w-full min-w-[8rem] overflow-hidden rounded-full lg:w-40"
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

// --- Tarjeta de sección -------------------------------------------------

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
        className="group grid grid-cols-[auto_1fr] gap-4 rounded-2xl p-5 transition-shadow sm:gap-6 sm:p-6"
        style={{ background: "var(--study-surface)", boxShadow: "var(--study-shadow)" }}
      >
        <div
          className="font-display text-2xl leading-none sm:text-3xl"
          style={{ color: isRead ? "var(--study-accent)" : "var(--study-accent-soft)" }}
          aria-hidden
        >
          {sectionNumber(index)}
        </div>

        <div
          className="border-l pl-4 sm:pl-6"
          style={{ borderColor: "var(--study-line)" }}
        >
          <div className="gap-6 sm:flex sm:items-start">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold sm:text-lg">
                <button
                  type="button"
                  onClick={onOpen}
                  className="text-left after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4"
                  style={{ outlineColor: "var(--study-accent)" }}
                >
                  <span className="relative">{section.title}</span>
                </button>
              </h2>

              {preview.lead && (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--study-muted)" }}>
                  {preview.lead}
                </p>
              )}

              {preview.verseText && (
                <blockquote className="mt-2 font-display text-base italic leading-relaxed sm:text-lg">
                  {preview.verseText}
                  {preview.reference && (
                    <footer className="mt-1 text-sm not-italic" style={{ color: "var(--study-muted)" }}>
                      — {preview.reference}
                    </footer>
                  )}
                </blockquote>
              )}

              {preview.listItems.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {preview.listItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(preview.reference || preview.hasReflection || preview.extraCount > 0) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
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

            {preview.quote && !preview.image && (
              <aside
                className="mt-4 shrink-0 rounded-xl p-4 sm:mt-0 sm:w-64"
                style={{ background: "color-mix(in srgb, var(--study-accent) 7%, transparent)" }}
              >
                <p className="font-display text-base italic">“{preview.quote.text}”</p>
                {preview.quote.author && (
                  <p className="mt-1 text-sm" style={{ color: "var(--study-muted)" }}>
                    — {preview.quote.author}
                  </p>
                )}
              </aside>
            )}

            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.image.url}
                alt={preview.image.alt}
                loading="lazy"
                className="mt-4 h-32 w-full shrink-0 rounded-xl object-cover sm:mt-0 sm:w-56"
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs"
      style={{ background: "color-mix(in srgb, var(--study-accent) 9%, transparent)", color: "var(--study-accent)" }}
    >
      {icon}
      {label}
    </span>
  );
}

// --- Modal con el desglose completo ------------------------------------

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
        // Cerrar al pulsar fuera: el <dialog> ocupa toda la pantalla, así que
        // el clic sobre el propio elemento (y no sobre su contenido) es "fuera".
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(46rem,92vw)] rounded-2xl p-0 backdrop:bg-black/40"
      style={{ background: "var(--study-surface)", color: "var(--study-ink)" }}
      aria-labelledby="seccion-modal-titulo"
    >
      {section && index !== null && (
        <div className="max-h-[85vh] overflow-y-auto">
          <header
            className="sticky top-0 flex items-start gap-4 border-b px-6 py-5 backdrop-blur"
            style={{
              borderColor: "var(--study-line)",
              background: "color-mix(in srgb, var(--study-surface) 92%, transparent)",
            }}
          >
            <span className="font-display text-2xl leading-none" style={{ color: "var(--study-accent)" }} aria-hidden>
              {sectionNumber(index)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="seccion-modal-titulo" className="text-lg font-semibold">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="mt-0.5 text-sm" style={{ color: "var(--study-muted)" }}>
                  {section.subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full px-2 py-1 text-xl leading-none transition-colors hover:bg-black/5"
              style={{ color: "var(--study-muted)" }}
            >
              ×
            </button>
          </header>

          <div className="space-y-8 px-6 py-8">
            {section.contents.length > 0 ? (
              section.contents.map((content) => (
                <StudyContentBlock key={content.id} content={content} bookNames={bookNames} />
              ))
            ) : (
              <p className="text-sm" style={{ color: "var(--study-muted)" }}>
                Esta sección todavía no tiene contenido.
              </p>
            )}
          </div>

          <footer
            className="sticky bottom-0 flex items-center justify-between gap-3 border-t px-6 py-4 backdrop-blur"
            style={{
              borderColor: "var(--study-line)",
              background: "color-mix(in srgb, var(--study-surface) 92%, transparent)",
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              disabled={index === 0}
              className="rounded-full border px-4 py-2 text-sm transition-opacity disabled:opacity-40"
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
              className="rounded-full px-5 py-2 text-sm text-white transition-opacity disabled:opacity-40"
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

// --- Resumen de la tarjeta a partir del contenido real ------------------

interface Preview {
  lead: string | null;
  verseText: string | null;
  reference: string | null;
  hasReflection: boolean;
  listItems: string[];
  quote: { text: string; author?: string } | null;
  image: { url: string; alt: string } | null;
  extraCount: number;
}

function buildPreview(section: StudySection, bookNames: Record<string, string>): Preview {
  const contents = section.contents;
  const verse = contents.find((c) => c.type === "verse" && c.verse);
  const text = contents.find((c) => c.type === "text" || c.type === "highlight");
  const question = contents.find((c) => c.type === "question");
  const list = contents.find((c) => c.type === "list");
  const quote = contents.find((c) => c.type === "quote");
  const image = contents.find((c) => (c.type === "image" || c.type === "image-text") && c.media_url);

  const reference =
    verse?.verse && verse.verse.show_reference
      ? formatReference(verse.verse, verse.verse.book_slug ? bookNames[verse.verse.book_slug] : undefined)
      : null;

  const lead =
    section.subtitle ??
    trim(question?.body) ??
    trim(text?.body) ??
    null;

  const listItems = Array.isArray(list?.configuration.items)
    ? (list.configuration.items as string[]).slice(0, 4)
    : [];

  const shown = [verse, text, question, list, quote, image].filter(Boolean).length;

  return {
    lead,
    verseText: trim(verse?.verse?.text, 160),
    reference,
    hasReflection:
      Boolean(verse?.verse?.reflection_enabled) || contents.some((c: StudyContent) => c.type === "reflection"),
    listItems,
    quote: quote?.body ? { text: truncate(quote.body, 90), author: quote.configuration.author as string } : null,
    image: image?.media_url ? { url: image.media_url, alt: image.media_alt ?? "" } : null,
    extraCount: Math.max(0, contents.length - shown),
  };
}

function trim(value: string | null | undefined, max = 130): string | null {
  if (!value) return null;
  const clean = value.replace(/\s+/g, " ").trim();
  return clean ? truncate(clean, max) : null;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max).trimEnd()}…`;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4 shrink-0" style={{ color: "var(--study-accent)" }}>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
      <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h5a2 2 0 012 2v9a2 2 0 00-2-2H3v-9zM17 4.5h-5a2 2 0 00-2 2v9a2 2 0 012-2h5v-9z" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15.5 4.5c0 6-4 9-9.5 9.5 0-6 4-9 9.5-9.5zM6 14c1.5-3 4-5 7-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

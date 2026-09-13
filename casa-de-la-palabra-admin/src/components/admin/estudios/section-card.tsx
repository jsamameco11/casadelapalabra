"use client";

import { useRef, useState } from "react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { BlockType, SectionLayout, StudyContent, StudySection, StudyVerse } from "@/lib/studies/blocks";
import { sectionNumber } from "@/lib/studies/blocks";
import { BLOCK_LIBRARY, SECTION_LAYOUT_OPTIONS } from "@/lib/studies/library";
import { ContentCard } from "./content-card";
import { Field, IconButton, SelectField, TextField } from "./field";

export function SectionCard({
  section,
  index,
  onSectionChange,
  onDelete,
  onAddContent,
  onContentChange,
  onVerseChange,
  onDuplicateContent,
  onDeleteContent,
  onReorderContents,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  section: StudySection;
  index: number;
  onSectionChange: (patch: Partial<StudySection>) => void;
  onDelete: () => void;
  onAddContent: (type: BlockType) => void;
  onContentChange: (contentId: string, patch: Partial<StudyContent>) => void;
  onVerseChange: (contentId: string, patch: Partial<StudyVerse>) => void;
  onDuplicateContent: (content: StudyContent) => void;
  onDeleteContent: (contentId: string) => void;
  onReorderContents: (from: number, to: number) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const dragFrom = useRef<number | null>(null);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-3xl border border-border bg-card ${section.is_visible ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <span aria-hidden className="cursor-grab select-none text-muted-foreground" title="Arrastrar para reordenar">
          ☰
        </span>
        <span className="font-display text-sm tracking-widest text-accent">{sectionNumber(index)}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 text-left"
        >
          <span className="block truncate text-sm font-medium">{section.title || "Sección sin nombre"}</span>
          <span className="text-xs text-muted-foreground">
            {section.contents.length} {section.contents.length === 1 ? "contenido" : "contenidos"}
          </span>
        </button>
        <IconButton
          label={section.is_visible ? "Ocultar" : "Mostrar"}
          onClick={() => onSectionChange({ is_visible: !section.is_visible })}
        />
        <IconButton label="Eliminar" danger onClick={onDelete} />
      </div>

      {open && (
        <div className="space-y-5 border-t border-border p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre de la sección">
              <TextField
                value={section.title}
                placeholder="Ej. Lo que Abraham todavía no podía ver"
                onCommit={(v) => onSectionChange({ title: v })}
              />
            </Field>
            <Field label="Subtítulo (opcional)">
              <TextField
                value={section.subtitle ?? ""}
                onCommit={(v) => onSectionChange({ subtitle: v || null })}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Estilo visual">
              <SelectField
                value={section.layout}
                options={SECTION_LAYOUT_OPTIONS}
                onCommit={(v) => onSectionChange({ layout: v as SectionLayout })}
              />
            </Field>
            <Field label="Imagen de la sección (opcional)">
              <ImageUploadField
                value={section.image_url ?? ""}
                folder="studies"
                onChange={(v) => onSectionChange({ image_url: v || null })}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Contenido</p>
            {section.contents.length > 0 ? (
              <ul className="space-y-2">
                {section.contents.map((content, contentIndex) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    index={contentIndex}
                    onContentChange={(patch) => onContentChange(content.id, patch)}
                    onVerseChange={(patch) => onVerseChange(content.id, patch)}
                    onDuplicate={() => onDuplicateContent(content)}
                    onDelete={() => onDeleteContent(content.id)}
                    onDragStart={() => {
                      dragFrom.current = contentIndex;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragFrom.current !== null && dragFrom.current !== contentIndex) {
                        onReorderContents(dragFrom.current, contentIndex);
                      }
                      dragFrom.current = null;
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Esta sección aún no tiene contenido. Puede llevar lo que quieras: un versículo solo, texto, una
                pregunta, varios versículos…
              </p>
            )}
          </div>

          {showLibrary ? (
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Elige un tipo de contenido</p>
                <IconButton label="Cancelar" onClick={() => setShowLibrary(false)} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {BLOCK_LIBRARY.map((block) => (
                  <button
                    key={block.type}
                    type="button"
                    onClick={() => {
                      onAddContent(block.type);
                      setShowLibrary(false);
                    }}
                    className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    <span className="block text-sm">{block.label}</span>
                    <span className="block text-xs text-muted-foreground">{block.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              + Agregar contenido
            </button>
          )}
        </div>
      )}
    </li>
  );
}

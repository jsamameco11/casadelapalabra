"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { StudyContent, StudyVerse } from "@/lib/studies/blocks";
import { formatReference } from "@/lib/studies/blocks";
import { BLOCK_LABEL } from "@/lib/studies/library";
import { VerseEditor } from "./verse-editor";
import { Field, IconButton, TextAreaField, TextField } from "./field";

export function ContentCard({
  content,
  index,
  onContentChange,
  onVerseChange,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  content: StudyContent;
  index: number;
  onContentChange: (patch: Partial<StudyContent>) => void;
  onVerseChange: (patch: Partial<StudyVerse>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-2xl border border-border bg-background ${content.is_visible ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span aria-hidden className="cursor-grab select-none text-muted-foreground" title="Arrastrar para reordenar">
          ☰
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left text-sm"
        >
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {BLOCK_LABEL[content.type] ?? content.type}
          </span>
          <span className="truncate text-muted-foreground">{summarize(content)}</span>
        </button>
        <IconButton
          label={content.is_visible ? "Ocultar" : "Mostrar"}
          onClick={() => onContentChange({ is_visible: !content.is_visible })}
        />
        <IconButton label="Duplicar" onClick={onDuplicate} />
        <IconButton label="Eliminar" danger onClick={onDelete} />
      </div>

      {open && (
        <div className="border-t border-border p-4">
          <ContentFields content={content} onContentChange={onContentChange} onVerseChange={onVerseChange} />
        </div>
      )}
    </li>
  );
}

function summarize(content: StudyContent): string {
  if (content.type === "verse" && content.verse) {
    const ref = formatReference(content.verse);
    return ref || content.verse.text?.slice(0, 60) || "Sin referencia";
  }
  return content.title || content.body?.slice(0, 60) || "Sin contenido todavía";
}

function ContentFields({
  content,
  onContentChange,
  onVerseChange,
}: {
  content: StudyContent;
  onContentChange: (patch: Partial<StudyContent>) => void;
  onVerseChange: (patch: Partial<StudyVerse>) => void;
}) {
  const config = content.configuration ?? {};

  switch (content.type) {
    case "verse":
      return <VerseEditor content={content} onContentChange={onContentChange} onVerseChange={onVerseChange} />;

    case "divider":
      return <p className="text-xs text-muted-foreground">Un separador no necesita configuración.</p>;

    case "image":
    case "image-text":
      return (
        <div className="space-y-3">
          <Field label="Imagen">
            <ImageUploadField
              value={content.media_url ?? ""}
              folder="studies"
              onChange={(v) => onContentChange({ media_url: v || null })}
            />
          </Field>
          <Field label="Texto alternativo (accesibilidad)">
            <TextField
              value={content.media_alt ?? ""}
              placeholder="Describe la imagen para quien no puede verla"
              onCommit={(v) => onContentChange({ media_alt: v || null })}
            />
          </Field>
          {content.type === "image-text" && (
            <>
              <Field label="Título (opcional)">
                <TextField value={content.title ?? ""} onCommit={(v) => onContentChange({ title: v || null })} />
              </Field>
              <Field label="Texto">
                <TextAreaField value={content.body ?? ""} onCommit={(v) => onContentChange({ body: v || null })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.alignment === "right"}
                  onChange={(e) =>
                    onContentChange({
                      configuration: { ...config, alignment: e.target.checked ? "right" : "left" },
                    })
                  }
                />
                <span>Imagen a la derecha</span>
              </label>
            </>
          )}
          {content.type === "image" && (
            <Field label="Pie de imagen (opcional)">
              <TextField value={content.title ?? ""} onCommit={(v) => onContentChange({ title: v || null })} />
            </Field>
          )}
        </div>
      );

    case "video":
    case "audio":
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)">
            <TextField value={content.title ?? ""} onCommit={(v) => onContentChange({ title: v || null })} />
          </Field>
          <Field label={content.type === "video" ? "URL del video (para incrustar)" : "URL del audio"}>
            <TextField
              value={content.media_url ?? ""}
              placeholder={content.type === "video" ? "https://www.youtube.com/embed/…" : "https://…/audio.mp3"}
              onCommit={(v) => onContentChange({ media_url: v || null })}
            />
          </Field>
          <Field label="Descripción (opcional)">
            <TextAreaField value={content.body ?? ""} rows={3} onCommit={(v) => onContentChange({ body: v || null })} />
          </Field>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <Field label="Cita">
            <TextAreaField value={content.body ?? ""} rows={3} onCommit={(v) => onContentChange({ body: v || null })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Autor (opcional)">
              <TextField
                value={(config.author as string) ?? ""}
                onCommit={(v) => onContentChange({ configuration: { ...config, author: v } })}
              />
            </Field>
            <Field label="Fuente (opcional)">
              <TextField
                value={(config.source as string) ?? ""}
                onCommit={(v) => onContentChange({ configuration: { ...config, source: v } })}
              />
            </Field>
          </div>
        </div>
      );

    case "question":
      return (
        <div className="space-y-3">
          <Field label="Etiqueta (opcional)">
            <TextField
              value={content.title ?? ""}
              placeholder="Ej. Para pensar"
              onCommit={(v) => onContentChange({ title: v || null })}
            />
          </Field>
          <Field label="Pregunta">
            <TextAreaField value={content.body ?? ""} rows={3} onCommit={(v) => onContentChange({ body: v || null })} />
          </Field>
          <Field label="Texto complementario (opcional)">
            <TextField value={content.subtitle ?? ""} onCommit={(v) => onContentChange({ subtitle: v || null })} />
          </Field>
        </div>
      );

    case "list":
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)">
            <TextField value={content.title ?? ""} onCommit={(v) => onContentChange({ title: v || null })} />
          </Field>
          <Field label="Puntos (uno por línea)">
            <TextAreaField
              value={(Array.isArray(config.items) ? config.items : []).join("\n")}
              rows={5}
              onCommit={(v) =>
                onContentChange({
                  configuration: { ...config, items: v.split("\n").map((s) => s.trim()).filter(Boolean) },
                })
              }
            />
          </Field>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)">
            <TextField value={content.title ?? ""} onCommit={(v) => onContentChange({ title: v || null })} />
          </Field>
          <Field label="URLs de las imágenes (una por línea)">
            <TextAreaField
              value={(Array.isArray(config.images) ? config.images : []).map((i) => i.url).join("\n")}
              rows={5}
              onCommit={(v) =>
                onContentChange({
                  configuration: {
                    ...config,
                    images: v.split("\n").map((s) => s.trim()).filter(Boolean).map((url) => ({ url })),
                  },
                })
              }
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Sube cada imagen desde un bloque «Imagen» y copia su URL, o pega URLs existentes.
          </p>
        </div>
      );

    // text, reflection, highlight comparten forma: título + cuerpo.
    default:
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)">
            <TextField value={content.title ?? ""} onCommit={(v) => onContentChange({ title: v || null })} />
          </Field>
          {content.type === "text" && (
            <Field label="Subtítulo (opcional)">
              <TextField value={content.subtitle ?? ""} onCommit={(v) => onContentChange({ subtitle: v || null })} />
            </Field>
          )}
          <Field label="Contenido">
            <TextAreaField
              value={content.body ?? ""}
              rows={6}
              placeholder="Separa los párrafos con una línea en blanco."
              onCommit={(v) => onContentChange({ body: v || null })}
            />
          </Field>
        </div>
      );
  }
}

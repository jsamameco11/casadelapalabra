"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockType, StudyContent, StudySection, StudyVerse } from "@/lib/studies/blocks";
import * as api from "@/lib/studies/builder-api";
import { SectionCard } from "./section-card";

type SaveState = "idle" | "saving" | "saved" | "error";

// Constructor de secciones y contenidos. El estado local se actualiza al
// instante y la escritura en la base va detrás: escribir no debe sentirse
// lento por esperar a la red.
export function StudyBuilder({
  studyId,
  onSectionsChange,
}: {
  studyId: string;
  onSectionsChange?: (sections: StudySection[]) => void;
}) {
  const [sections, setSections] = useState<StudySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    api
      .loadSections(studyId)
      .then(setSections)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studyId]);

  // El panel de previsualización vive fuera de este componente (necesita
  // combinarse con los datos generales del estudio), así que cada cambio de
  // estado se refleja hacia arriba en lugar de duplicar el estado ahí.
  useEffect(() => {
    onSectionsChange?.(sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Envuelve cualquier escritura para reflejar "Guardando…" / "Guardado".
  async function persist(action: () => Promise<void>) {
    setSave("saving");
    setError("");
    try {
      await action();
      setSave("saved");
    } catch (e) {
      setSave("error");
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  function patchSection(sectionId: string, patch: Partial<StudySection>) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
    void persist(() => api.updateSection(sectionId, patch));
  }

  function patchContent(sectionId: string, contentId: string, patch: Partial<StudyContent>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, contents: s.contents.map((c) => (c.id === contentId ? { ...c, ...patch } : c)) }
          : s
      )
    );
    void persist(() => api.updateContent(contentId, patch));
  }

  function patchVerse(sectionId: string, contentId: string, patch: Partial<StudyVerse>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              contents: s.contents.map((c) =>
                c.id === contentId && c.verse ? { ...c, verse: { ...c.verse, ...patch } } : c
              ),
            }
          : s
      )
    );
    void persist(() => api.updateVerse(contentId, patch));
  }

  async function addSection() {
    await persist(async () => {
      const section = await api.createSection(studyId, sections.length, "Nueva sección");
      setSections((prev) => [...prev, section]);
    });
  }

  async function removeSection(sectionId: string) {
    if (!confirm("¿Eliminar esta sección y todo su contenido?")) return;
    await persist(async () => {
      await api.deleteSection(sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    });
  }

  async function addContent(sectionId: string, type: BlockType) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    await persist(async () => {
      const content = await api.createContent(sectionId, type, section.contents.length);
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, contents: [...s.contents, content] } : s))
      );
    });
  }

  async function duplicateContent(sectionId: string, content: StudyContent) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    await persist(async () => {
      const copy = await api.duplicateContent({ ...content, section_id: sectionId } as StudyContent, section.contents.length);
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, contents: [...s.contents, copy] } : s))
      );
    });
  }

  async function removeContent(sectionId: string, contentId: string) {
    await persist(async () => {
      await api.deleteContent(contentId);
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, contents: s.contents.filter((c) => c.id !== contentId) } : s))
      );
    });
  }

  function reorderSections(from: number, to: number) {
    const next = move(sections, from, to);
    setSections(next);
    void persist(() => api.persistOrder("casa_study_sections", next.map((s) => s.id)));
  }

  function reorderContents(sectionId: string, from: number, to: number) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const contents = move(section.contents, from, to);
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, contents } : s)));
    void persist(() => api.persistOrder("casa_study_contents", contents.map((c) => c.id)));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando el constructor…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Constructor del estudio</h2>
        <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {save === "saving" && "Guardando…"}
          {save === "saved" && "Guardado"}
          {save === "error" && <span className="text-danger">{error}</span>}
        </span>
      </div>

      {sections.length > 0 ? (
        <ul className="space-y-3">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              onSectionChange={(patch) => patchSection(section.id, patch)}
              onDelete={() => removeSection(section.id)}
              onAddContent={(type) => addContent(section.id, type)}
              onContentChange={(contentId, patch) => patchContent(section.id, contentId, patch)}
              onVerseChange={(contentId, patch) => patchVerse(section.id, contentId, patch)}
              onDuplicateContent={(content) => duplicateContent(section.id, content)}
              onDeleteContent={(contentId) => removeContent(section.id, contentId)}
              onReorderContents={(from, to) => reorderContents(section.id, from, to)}
              onDragStart={() => {
                dragFrom.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom.current !== null && dragFrom.current !== index) {
                  reorderSections(dragFrom.current, index);
                }
                dragFrom.current = null;
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Todavía no hay secciones. Crea la primera y ponle el nombre que quieras: el sistema solo numera.
        </p>
      )}

      <button
        type="button"
        onClick={addSection}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Agregar sección
      </button>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

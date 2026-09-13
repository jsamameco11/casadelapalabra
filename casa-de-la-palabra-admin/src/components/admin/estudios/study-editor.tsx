"use client";

import { useState } from "react";
import type { StudySection } from "@/lib/studies/blocks";
import { StudyBuilder } from "./study-builder";
import { StudyExperience } from "./study-experience";

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

// Constructor + previsualización en vivo, uno al lado del otro. El
// constructor guarda solo (persiste apenas escribes); la previsualización
// simplemente refleja ese mismo estado con los componentes reales del sitio
// público, así que nunca puede desincronizarse "olvidando guardar".
export function StudyEditor({
  study,
  mainVerse,
  bookNames,
}: {
  study: StudyHeader;
  mainVerse?: MainVerse | null;
  bookNames: Record<string, string>;
}) {
  const [sections, setSections] = useState<StudySection[]>([]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
      <div className="min-w-0">
        <StudyBuilder studyId={study.id} onSectionsChange={setSections} />
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Previsualización — así se ve en casadelapalabra.miacademiapreu.com
          </p>
          <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-2 truncate text-xs text-muted-foreground">
                casadelapalabra.miacademiapreu.com/estudios/{study.slug || "…"}
              </span>
            </div>
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
              <StudyExperience study={study} mainVerse={mainVerse} sections={sections} bookNames={bookNames} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

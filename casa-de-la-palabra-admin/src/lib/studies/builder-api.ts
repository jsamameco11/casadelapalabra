"use client";

import { createClient } from "@/lib/supabase/client";
import type { BlockConfiguration, BlockType, StudyContent, StudySection, StudyVerse } from "@/lib/studies/blocks";

// Las filas se crean en la base apenas se agregan (así siempre hay id) y los
// cambios de campos se guardan solos. Evita un estado de borrador paralelo que
// haya que reconciliar después.

const SECTION_COLUMNS = "id, title, subtitle, position, is_visible, layout, image_url, configuration";
const CONTENT_COLUMNS =
  "id, type, position, is_visible, title, subtitle, body, media_url, media_alt, configuration";
const VERSE_COLUMNS =
  "book_slug, chapter_start, verse_start, chapter_end, verse_end, translation_code, text, show_reference, reflection_enabled, reflection_title, reflection_content, reflection_configuration";

// casa_study_content_verses es 1 a 1 (content_id es PK y FK a la vez), así
// que PostgREST la embebe como objeto suelto, no como arreglo.
type RawContent = Omit<StudyContent, "verse"> & { casa_study_content_verses: StudyVerse | null };
type RawSection = Omit<StudySection, "contents"> & { casa_study_contents: RawContent[] | null };

export async function loadSections(studyId: string): Promise<StudySection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("casa_study_sections")
    .select(`${SECTION_COLUMNS}, casa_study_contents (${CONTENT_COLUMNS}, casa_study_content_verses (${VERSE_COLUMNS}))`)
    .eq("study_id", studyId)
    .order("position");

  if (error) throw new Error(error.message);

  return ((data as unknown as RawSection[] | null) ?? []).map((section) => ({
    ...section,
    contents: (section.casa_study_contents ?? [])
      .sort((a, b) => a.position - b.position)
      .map((content) => ({
        ...content,
        verse: content.casa_study_content_verses ?? null,
      })),
  }));
}

export async function createSection(studyId: string, position: number, title: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("casa_study_sections")
    .insert({ study_id: studyId, title, position })
    .select(SECTION_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return { ...(data as Omit<StudySection, "contents">), contents: [] } as StudySection;
}

export async function updateSection(id: string, patch: Partial<StudySection>) {
  const supabase = createClient();
  const { contents: _contents, id: _id, ...fields } = patch as StudySection;
  const { error } = await supabase.from("casa_study_sections").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSection(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("casa_study_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createContent(sectionId: string, type: BlockType, position: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("casa_study_contents")
    .insert({ section_id: sectionId, type, position })
    .select(CONTENT_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  const content = { ...(data as Omit<StudyContent, "verse">), verse: null } as StudyContent;

  // El versículo vive en su propia tabla: se crea vacío para que el editor
  // tenga dónde escribir desde el primer momento.
  if (type === "verse") {
    const { data: verse, error: verseError } = await supabase
      .from("casa_study_content_verses")
      .insert({ content_id: content.id })
      .select(VERSE_COLUMNS)
      .single();
    if (verseError) throw new Error(verseError.message);
    content.verse = verse as StudyVerse;
  }

  return content;
}

export async function updateContent(id: string, patch: Partial<StudyContent>) {
  const supabase = createClient();
  const { verse: _verse, id: _id, ...fields } = patch as StudyContent;
  const { error } = await supabase.from("casa_study_contents").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateVerse(contentId: string, patch: Partial<StudyVerse>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("casa_study_content_verses")
    .upsert({ content_id: contentId, ...patch }, { onConflict: "content_id" });
  if (error) throw new Error(error.message);
}

export async function deleteContent(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("casa_study_contents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Duplica un bloque completo, incluido el versículo y su reflexión. */
export async function duplicateContent(content: StudyContent, position: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("casa_study_contents")
    .insert({
      section_id: (content as StudyContent & { section_id?: string }).section_id,
      type: content.type,
      position,
      is_visible: content.is_visible,
      title: content.title,
      subtitle: content.subtitle,
      body: content.body,
      media_url: content.media_url,
      media_alt: content.media_alt,
      configuration: content.configuration,
    })
    .select(CONTENT_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  const copy = { ...(data as Omit<StudyContent, "verse">), verse: null } as StudyContent;

  if (content.verse) {
    const { data: verse, error: verseError } = await supabase
      .from("casa_study_content_verses")
      .insert({ ...content.verse, content_id: copy.id })
      .select(VERSE_COLUMNS)
      .single();
    if (verseError) throw new Error(verseError.message);
    copy.verse = verse as StudyVerse;
  }

  return copy;
}

/** Reescribe posiciones tras arrastrar. Una llamada por fila movida. */
export async function persistOrder(table: "casa_study_sections" | "casa_study_contents", ids: string[]) {
  const supabase = createClient();
  await Promise.all(
    ids.map((id, index) => supabase.from(table).update({ position: index }).eq("id", id))
  );
}

export function emptyConfiguration(): BlockConfiguration {
  return {};
}

// Contrato compartido entre el panel y el sitio público.
// Si cambias algo acá, cámbialo también en casa-de-la-palabra-admin.

export const BLOCK_TYPES = [
  "text",
  "verse",
  "image",
  "image-text",
  "video",
  "audio",
  "quote",
  "question",
  "list",
  "highlight",
  "divider",
  "gallery",
  "reflection",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const SECTION_LAYOUTS = [
  "standard",
  "editorial",
  "minimal",
  "highlight",
  "immersive",
  "background-image",
] as const;

export type SectionLayout = (typeof SECTION_LAYOUTS)[number];

export const VERSE_LAYOUTS = ["classic", "editorial", "highlight", "immersive", "side"] as const;
export type VerseLayout = (typeof VERSE_LAYOUTS)[number];

// Solo presentación. Nada que debiera poder consultarse vive aquí.
export interface BlockConfiguration {
  layout?: VerseLayout | string;
  alignment?: "left" | "center" | "right";
  overlay?: boolean;
  backgroundPosition?: string;
  items?: string[];
  images?: { url: string; alt?: string }[];
  author?: string;
  source?: string;
  [key: string]: unknown;
}

export interface StudyVerse {
  book_slug: string | null;
  chapter_start: number | null;
  verse_start: number | null;
  chapter_end: number | null;
  verse_end: number | null;
  translation_code: string | null;
  text: string | null;
  show_reference: boolean;
  reflection_enabled: boolean;
  reflection_title: string | null;
  reflection_content: string | null;
  reflection_configuration: BlockConfiguration;
}

export interface StudyContent {
  id: string;
  type: BlockType;
  position: number;
  is_visible: boolean;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  media_url: string | null;
  media_alt: string | null;
  configuration: BlockConfiguration;
  verse?: StudyVerse | null;
}

export interface StudySection {
  id: string;
  title: string;
  subtitle: string | null;
  position: number;
  is_visible: boolean;
  layout: SectionLayout;
  image_url: string | null;
  configuration: BlockConfiguration;
  contents: StudyContent[];
}

/** "Juan 3:16", "Juan 3:16-18", "Salmos 23" — según qué campos estén puestos. */
export function formatReference(verse: StudyVerse, bookName?: string): string {
  const book = bookName ?? verse.book_slug ?? "";
  if (!book || verse.chapter_start == null) return book;

  let ref = `${book} ${verse.chapter_start}`;
  if (verse.verse_start != null) ref += `:${verse.verse_start}`;

  const crossesChapter = verse.chapter_end != null && verse.chapter_end !== verse.chapter_start;
  if (crossesChapter) {
    ref += `—${verse.chapter_end}`;
    if (verse.verse_end != null) ref += `:${verse.verse_end}`;
  } else if (verse.verse_end != null && verse.verse_end !== verse.verse_start) {
    ref += `-${verse.verse_end}`;
  }
  return ref;
}

/** 1 -> "01". La numeración es automática; el nombre siempre lo pone el editor. */
export function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

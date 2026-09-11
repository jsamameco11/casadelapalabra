// Server-only: fetches licensed translations (license_type = 'api_passthrough',
// external_provider = 'api.bible') live from the Digital Bible Library API.
// Their text is NEVER stored in casa_bible_verses — always fetched on demand,
// and every response carries the mandatory copyright line the license requires.
import { OSIS_BOOK } from "./osis";

const BASE_URL = process.env.DBL_API_BASE_URL || "https://api.scripture.api.bible/v1";
const API_KEY = process.env.DBL_API_KEY;

export type ApiBibleVerse = { text: string; copyright: string };
export type ApiBibleChapterVerse = { verseNumber: number; text: string };
export type ApiBibleChapter = { verses: ApiBibleChapterVerse[]; copyright: string };

async function apiBibleGet(path: string): Promise<Record<string, unknown> | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "api-key": API_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function fetchApiBibleVerse(
  bibleId: string,
  slug: string,
  chapter: number,
  verse: number
): Promise<ApiBibleVerse | null> {
  const book = OSIS_BOOK[slug];
  if (!book) return null;
  const verseId = `${book}.${chapter}.${verse}`;
  const json = await apiBibleGet(
    `/bibles/${bibleId}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`
  );
  const data = json?.data as { content?: string; copyright?: string } | undefined;
  if (!data?.content) return null;
  return { text: data.content.trim(), copyright: (json?.data as { copyright?: string })?.copyright ?? "" };
}

export async function fetchApiBibleChapter(
  bibleId: string,
  slug: string,
  chapter: number
): Promise<ApiBibleChapter | null> {
  const book = OSIS_BOOK[slug];
  if (!book) return null;
  const passageId = `${book}.${chapter}`;
  const json = await apiBibleGet(
    `/bibles/${bibleId}/passages/${passageId}?content-type=text&include-verse-numbers=true&include-verse-spans=false&include-notes=false&include-titles=false&include-chapter-numbers=false`
  );
  const data = json?.data as { content?: string; copyright?: string } | undefined;
  if (!data?.content) return null;

  // Verse numbers come back inline as "[12] text text [13] text…" — split on
  // that marker rather than parsing HTML/JSON structure.
  const parts = data.content.split(/\[(\d+)\]\s*/);
  const verses: ApiBibleChapterVerse[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const verseNumber = Number(parts[i]);
    const text = parts[i + 1]?.replace(/\s+/g, " ").trim();
    if (text) verses.push({ verseNumber, text });
  }
  return { verses, copyright: data.copyright ?? "" };
}

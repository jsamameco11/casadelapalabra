// Shared, dependency-free helpers for the Bible search: normalizing text for
// accent/case-insensitive matching, and parsing a query like "juan 3:16" or
// "1 samuel 17" into a book/chapter/verse reference.

// Built from char codes (not a literal \u escape) so the source file can't
// end up with an actual combining-mark character silently substituted in.
const COMBINING_MARKS = new RegExp(
  "[" + String.fromCharCode(92, 117, 48, 51, 48, 48) + "-" + String.fromCharCode(92, 117, 48, 51, 54, 102) + "]",
  "g"
);

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .trim()
    .replace(/\s+/g, " ");
}

export interface BookLookup {
  slug: string;
  default_name: string;
  book_number: number;
}

// Common Spanish abbreviations ("siglas"), keyed by slug, so typing "Jn" or
// "Gn" completes to the full book the same way typing the full name does.
// Deliberately not exhaustive — just the forms people actually type.
export const BOOK_ABBREVIATIONS: Record<string, string[]> = {
  genesis: ["gn", "gen"],
  exodo: ["ex", "exo"],
  levitico: ["lv", "lev"],
  numeros: ["nm", "num"],
  deuteronomio: ["dt", "deut"],
  josue: ["jos"],
  jueces: ["jue", "jc"],
  rut: ["rt"],
  "1-samuel": ["1s", "1sa", "1 sam"],
  "2-samuel": ["2s", "2sa", "2 sam"],
  "1-reyes": ["1r", "1re"],
  "2-reyes": ["2r", "2re"],
  "1-cronicas": ["1cr"],
  "2-cronicas": ["2cr"],
  esdras: ["esd"],
  nehemias: ["neh"],
  ester: ["est"],
  job: ["jb"],
  salmos: ["sal", "sl", "salmo"],
  proverbios: ["prov", "pr"],
  eclesiastes: ["ecl", "qo"],
  cantares: ["cnt", "cant"],
  isaias: ["is", "isa"],
  jeremias: ["jer"],
  lamentaciones: ["lam"],
  ezequiel: ["ez", "eze"],
  daniel: ["dn", "dan"],
  oseas: ["os", "ose"],
  joel: ["jl"],
  amos: ["am"],
  abdias: ["abd"],
  jonas: ["jon"],
  miqueas: ["miq", "mi"],
  nahum: ["nah"],
  habacuc: ["hab"],
  sofonias: ["sof"],
  hageo: ["hag"],
  zacarias: ["zac"],
  malaquias: ["mal"],
  mateo: ["mt"],
  marcos: ["mr", "mc"],
  lucas: ["lc"],
  juan: ["jn"],
  hechos: ["hch"],
  romanos: ["ro", "rom"],
  "1-corintios": ["1co", "1cor"],
  "2-corintios": ["2co", "2cor"],
  galatas: ["ga", "gal"],
  efesios: ["ef", "efe"],
  filipenses: ["fil", "flp"],
  colosenses: ["col"],
  "1-tesalonicenses": ["1ts", "1tes"],
  "2-tesalonicenses": ["2ts", "2tes"],
  "1-timoteo": ["1ti", "1tim"],
  "2-timoteo": ["2ti", "2tim"],
  tito: ["tit"],
  filemon: ["flm"],
  hebreos: ["heb"],
  santiago: ["stg", "sant"],
  "1-pedro": ["1p", "1pe"],
  "2-pedro": ["2p", "2pe"],
  "1-juan": ["1jn"],
  "2-juan": ["2jn"],
  "3-juan": ["3jn"],
  judas: ["jud"],
  apocalipsis: ["ap", "apoc", "rev"],
};

function matchesAbbreviation(slug: string, normalizedQuery: string): boolean {
  return (BOOK_ABBREVIATIONS[slug] ?? []).some((a) => a === normalizedQuery || a.startsWith(normalizedQuery));
}

export interface ParsedReference {
  book: BookLookup;
  chapter: number;
  verse: number | null;
}

/**
 * Parses queries like "juan 3:16", "juan 3", "1 samuel 17", "génesis 1:1".
 * Matches the book name as a normalized prefix of the query, then reads the
 * trailing "chapter[:verse]". Returns null when it doesn't look like a
 * reference (caller should fall back to full-text search).
 */
export function parseReference(query: string, books: BookLookup[]): ParsedReference | null {
  const normalizedQuery = normalizeText(query);
  const match = normalizedQuery.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3}))?$/);
  if (!match) return null;

  const [, bookPart, chapterStr, verseStr] = match;
  const candidates = books
    .map((b) => ({ book: b, name: normalizeText(b.default_name), slug: normalizeText(b.slug.replace(/-/g, " ")) }))
    .filter(
      (c) =>
        c.name === bookPart ||
        c.slug === bookPart ||
        c.name.startsWith(bookPart) ||
        matchesAbbreviation(c.book.slug, bookPart)
    );

  if (candidates.length === 0) return null;
  // Prefer an exact name or abbreviation match over a loose prefix match
  // (e.g. "juan" alone should not accidentally prefer "juan" over "1 juan"
  // style ambiguity — exact wins).
  const exact = candidates.find(
    (c) => c.name === bookPart || c.slug === bookPart || matchesAbbreviation(c.book.slug, bookPart)
  );
  const chosen = exact ?? candidates[0];

  return {
    book: chosen.book,
    chapter: parseInt(chapterStr, 10),
    verse: verseStr ? parseInt(verseStr, 10) : null,
  };
}

/**
 * Book-name suggestions for the search input's autocomplete dropdown, e.g.
 * typing "ma" surfaces "Mateo", "Marcos", "Malaquías"… Only fires while the
 * user is still typing a book name (no chapter/verse numbers yet), matching
 * on a normalized prefix of either the book's name or its slug.
 */
export function suggestBooks(query: string, books: BookLookup[], limit = 6): BookLookup[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || /\d/.test(normalizedQuery)) return [];

  return books
    .filter((b) => {
      const name = normalizeText(b.default_name);
      const slug = normalizeText(b.slug.replace(/-/g, " "));
      return name.startsWith(normalizedQuery) || slug.startsWith(normalizedQuery) || matchesAbbreviation(b.slug, normalizedQuery);
    })
    .sort((a, b) => a.book_number - b.book_number)
    .slice(0, limit);
}

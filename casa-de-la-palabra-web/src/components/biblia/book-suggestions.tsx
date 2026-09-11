import Link from "next/link";
import type { BookLookup } from "@/lib/bible-search";

export function BookSuggestions({ books, onSelect }: { books: BookLookup[]; onSelect?: () => void }) {
  if (books.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
      {books.map((b) => (
        <Link
          key={b.slug}
          href={`/biblia/${b.slug}/1`}
          onClick={onSelect}
          className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
        >
          {b.default_name}
        </Link>
      ))}
    </div>
  );
}

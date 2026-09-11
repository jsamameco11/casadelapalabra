import Link from "next/link";

export function ChapterGrid({
  bookSlug,
  chapterCount,
  currentChapter,
}: {
  bookSlug: string;
  chapterCount: number;
  currentChapter: number;
}) {
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Capítulos</p>
      <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
        {chapters.map((n) => (
          <Link
            key={n}
            href={`/biblia/${bookSlug}/${n}`}
            aria-current={n === currentChapter ? "page" : undefined}
            className={`flex h-9 items-center justify-center rounded-lg text-sm transition-colors ${
              n === currentChapter
                ? "bg-primary font-medium text-primary-foreground"
                : "border border-border text-foreground/70 hover:border-primary/40 hover:text-primary"
            }`}
          >
            {n}
          </Link>
        ))}
      </div>
    </div>
  );
}

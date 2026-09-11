import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { BibleTopBar } from "@/components/biblia/bible-top-bar";

interface BookRow {
  slug: string;
  default_name: string;
  testament: "old" | "new";
  book_number: number;
}

export const metadata = { title: "Biblia" };

export default async function BibliaPage() {
  const supabase = await createClient();
  const [{ data: booksData }, { data: translationsData }, { data: settings }, cookieStore] = await Promise.all([
    supabase.from("casa_bible_books").select("slug, default_name, testament, book_number").order("book_number", { ascending: true }),
    supabase.from("casa_bible_translations").select("id, code, short_name, name").eq("is_active", true).order("position"),
    supabase.from("casa_site_settings").select("default_bible_translation_id").eq("id", 1).maybeSingle(),
    cookies(),
  ]);

  const books = (booksData as BookRow[]) ?? [];
  const oldTestament = books.filter((b) => b.testament === "old");
  const newTestament = books.filter((b) => b.testament === "new");

  const translations = translationsData ?? [];
  const defaultTranslation = translations.find((t) => t.id === settings?.default_bible_translation_id);
  const currentCode = cookieStore.get("casa_bible_translation")?.value ?? defaultTranslation?.code ?? translations[0]?.code ?? "";

  return (
    <div>
      <PageHeader
        eyebrow="Biblia"
        title="Explora la Palabra"
        description="Elige un libro para comenzar a leer."
      />
      {translations.length > 0 && (
        <div className="mb-10">
          <BibleTopBar translations={translations} currentCode={currentCode} />
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <BookGroup title="Antiguo Testamento" books={oldTestament} />
        <BookGroup title="Nuevo Testamento" books={newTestament} />
      </div>
    </div>
  );
}

function BookGroup({ title, books }: { title: string; books: BookRow[] }) {
  if (books.length === 0) return null;
  return (
    <div className="mb-12">
      <h2 className="mb-4 font-display text-xl font-medium">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {books.map((b) => (
          <Link
            key={b.slug}
            href={`/biblia/${b.slug}/1`}
            className="rounded-xl border border-border bg-card px-3 py-3 text-center text-sm hover:border-primary/40 hover:text-primary transition-colors"
          >
            {b.default_name}
          </Link>
        ))}
      </div>
    </div>
  );
}

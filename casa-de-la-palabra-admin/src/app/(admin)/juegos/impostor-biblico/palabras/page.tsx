import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { WordsFilter } from "@/components/admin/impostor/words-filter";

export const metadata = { title: "Palabras — El Impostor Bíblico" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
  scheduled: "Programada",
};

export default async function PalabrasPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const { category, status } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("casa_impostor_categories")
    .select("id, slug, name")
    .order("position", { ascending: true });

  let query = supabase
    .from("casa_impostor_words")
    .select("id, word, hint_reference, status, category_id, casa_impostor_categories(name)")
    .order("word", { ascending: true });

  if (category) {
    const cat = categories?.find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: words } = await query;

  return (
    <PageShell
      eyebrow="Juegos → El Impostor Bíblico"
      title="Palabras"
      description="Banco de palabras secretas. Archivar en vez de borrar preserva el historial de partidas que ya la usaron."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <WordsFilter categories={categories ?? []} selectedCategory={category} selectedStatus={status} />
        <Link
          href="/juegos/impostor-biblico/palabras/nueva"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Nueva palabra
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Palabra</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Referencia</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {(words ?? []).map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{w.word}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {(w.casa_impostor_categories as unknown as { name: string } | null)?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{w.hint_reference ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      w.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[w.status] ?? w.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/impostor-biblico/palabras/${w.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(words ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  No hay palabras con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

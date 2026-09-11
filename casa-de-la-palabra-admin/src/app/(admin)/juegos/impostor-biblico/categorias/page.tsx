import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { CategoryActiveToggle } from "@/components/admin/impostor/category-active-toggle";

export const metadata = { title: "Categorías — El Impostor Bíblico" };

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_impostor_categories")
    .select("id, slug, name, position, is_active")
    .order("position", { ascending: true });

  const categories = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → El Impostor Bíblico"
      title="Categorías"
      description="Las categorías organizan el banco de palabras. Desactivar una categoría oculta sus palabras del juego sin borrarlas."
    >
      <div className="mb-4 flex justify-end">
        <Link
          href="/juegos/impostor-biblico/categorias/nueva"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Nueva categoría
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Posición</th>
              <th className="px-5 py-3">Activa</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.position}</td>
                <td className="px-5 py-3">
                  <CategoryActiveToggle id={c.id} initialActive={c.is_active} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/impostor-biblico/categorias/${c.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

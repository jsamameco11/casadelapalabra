import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { CategoriasFilter } from "@/components/admin/categorias-filter";
import { MODULE_OPTIONS } from "@/lib/categories";

export const metadata = { title: "Categorías" };

const MODULE_LABELS = Object.fromEntries(MODULE_OPTIONS.map((m) => [m.value, m.label]));

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>;
}) {
  const { modulo } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("casa_categories").select("id, slug, name, module, position").order("module").order("position");
  if (modulo) query = query.eq("module", modulo);
  const { data } = await query;

  const categorias = data ?? [];

  return (
    <PageShell
      eyebrow="Contenido"
      title="Categorías"
      description="Las categorías organizan Estudios, Videos, Podcast, Cursos y Conferencias, y alimentan el filtro que ven los usuarios en cada sección."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CategoriasFilter selectedModule={modulo} />
        <Link href="/categorias/nueva" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva categoría
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Sección</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Posición</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{MODULE_LABELS[c.module] ?? c.module}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.position}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/categorias/${c.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
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

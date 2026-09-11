import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { UnitsFilter } from "@/components/admin/lingobible/units-filter";

export const metadata = { title: "Unidades — LINGOBIBLE" };

export default async function UnidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path } = await searchParams;
  const supabase = await createClient();

  const { data: paths } = await supabase.from("casa_lingobible_paths").select("id, title").order("position");

  let query = supabase
    .from("casa_lingobible_units")
    .select("id, title, position, path_id, casa_lingobible_paths(title)")
    .order("position", { ascending: true });
  if (path) query = query.eq("path_id", path);
  const { data } = await query;

  const units = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → LINGOBIBLE"
      title="Unidades"
      description="Cada unidad agrupa lecciones dentro de una ruta."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <UnitsFilter paths={paths ?? []} selectedPath={path} />
        <Link href="/juegos/lingobible/unidades/nueva" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva unidad
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Ruta</th>
              <th className="px-5 py-3">Posición</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{u.title}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {(u.casa_lingobible_paths as unknown as { title: string } | null)?.title ?? "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{u.position}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/lingobible/unidades/${u.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay unidades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

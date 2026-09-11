import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Rutas — LINGOBIBLE" };

export default async function RutasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_lingobible_paths")
    .select("id, slug, title, position, status")
    .order("position", { ascending: true });

  const paths = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → LINGOBIBLE"
      title="Rutas"
      description="Las rutas agrupan unidades y lecciones (por ejemplo: Fundamentos de la fe, Antiguo Testamento)."
    >
      <div className="mb-4 flex justify-end">
        <Link href="/juegos/lingobible/rutas/nueva" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva ruta
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Posición</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {paths.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{p.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.slug}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.position}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.status}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/lingobible/rutas/${p.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {paths.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay rutas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

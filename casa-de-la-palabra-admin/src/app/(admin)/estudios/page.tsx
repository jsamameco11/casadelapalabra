import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Estudios bíblicos" };

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado", scheduled: "Programado" };

export default async function EstudiosAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_studies")
    .select("id, title, level, status, position, casa_categories(name)")
    .order("position", { ascending: true });

  const studies = data ?? [];

  return (
    <PageShell eyebrow="Contenido" title="Estudios bíblicos" description="CRUD de estudios, con categoría, nivel y orden manual.">
      <div className="mb-4 flex justify-end">
        <Link href="/estudios/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo estudio
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Orden</th>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Nivel</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {studies.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{s.position}</td>
                <td className="px-5 py-3">
                  {s.title.trim() || <span className="text-muted-foreground italic">(Sin título)</span>}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {(s.casa_categories as unknown as { name: string } | null)?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.level}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${s.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/estudios/${s.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {studies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay estudios creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

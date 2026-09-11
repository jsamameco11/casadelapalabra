import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Cursos" };

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado", scheduled: "Programado" };

export default async function CursosAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_courses")
    .select("id, title, is_premium, status, position")
    .order("position", { ascending: true });

  const courses = data ?? [];

  return (
    <PageShell eyebrow="Contenido" title="Cursos" description="CRUD de cursos. Módulos y lecciones se editan en la siguiente fase.">
      <div className="mb-4 flex justify-end">
        <Link href="/media/cursos/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo curso
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Orden</th>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{c.position}</td>
                <td className="px-5 py-3">{c.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.is_premium ? "Premium" : "Gratuito"}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${c.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/media/cursos/${c.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay cursos creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

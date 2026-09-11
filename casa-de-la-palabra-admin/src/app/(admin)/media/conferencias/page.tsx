import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Conferencias" };

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado", scheduled: "Programado" };

export default async function ConferenciasAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_conferences")
    .select("id, title, speaker, event_date, status, position")
    .order("position", { ascending: true });

  const conferences = data ?? [];

  return (
    <PageShell eyebrow="Contenido" title="Conferencias" description="CRUD de conferencias pasadas.">
      <div className="mb-4 flex justify-end">
        <Link href="/media/conferencias/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva conferencia
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Orden</th>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Expositor</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {conferences.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{c.position}</td>
                <td className="px-5 py-3">{c.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.speaker}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.event_date ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${c.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/media/conferencias/${c.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {conferences.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay conferencias creadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

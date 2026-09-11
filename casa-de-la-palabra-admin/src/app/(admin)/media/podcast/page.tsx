import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Podcast" };

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado", scheduled: "Programado" };

export default async function PodcastAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_podcast_episodes")
    .select("id, title, status, position")
    .order("position", { ascending: true });

  const episodes = data ?? [];

  return (
    <PageShell eyebrow="Contenido" title="Podcast" description="CRUD de episodios de podcast.">
      <div className="mb-4 flex justify-end">
        <Link href="/media/podcast/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo episodio
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Orden</th>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {episodes.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{e.position}</td>
                <td className="px-5 py-3">{e.title}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${e.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[e.status] ?? e.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/media/podcast/${e.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {episodes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay episodios creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

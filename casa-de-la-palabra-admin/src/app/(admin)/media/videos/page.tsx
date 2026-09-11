import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Videos" };

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado", scheduled: "Programado" };

export default async function VideosAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_videos")
    .select("id, title, status, position, casa_categories(name)")
    .order("position", { ascending: true });

  const videos = data ?? [];

  return (
    <PageShell eyebrow="Contenido" title="Videos" description="CRUD de videos con embed de YouTube.">
      <div className="mb-4 flex justify-end">
        <Link href="/media/videos/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo video
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Orden</th>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{v.position}</td>
                <td className="px-5 py-3">{v.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{(v.casa_categories as unknown as { name: string } | null)?.name ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${v.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[v.status] ?? v.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/media/videos/${v.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay videos creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

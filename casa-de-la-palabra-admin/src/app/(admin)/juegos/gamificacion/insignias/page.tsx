import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Insignias — Gamificación" };

export default async function InsigniasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_badges")
    .select("id, slug, name, is_active")
    .order("name", { ascending: true });

  const badges = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → Gamificación"
      title="Insignias"
      description="Reconocimientos otorgados a los usuarios por logros específicos."
    >
      <div className="mb-4 flex justify-end">
        <Link href="/juegos/gamificacion/insignias/nueva" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva insignia
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Activa</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {badges.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{b.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.slug}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.is_active ? "Sí" : "No"}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/gamificacion/insignias/${b.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {badges.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay insignias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

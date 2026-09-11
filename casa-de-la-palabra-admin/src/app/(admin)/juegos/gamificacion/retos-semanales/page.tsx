import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Retos semanales — Gamificación" };

export default async function RetosSemanalesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_weekly_challenges")
    .select("id, title, xp_reward, starts_on, ends_on")
    .order("starts_on", { ascending: false });

  const challenges = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → Gamificación"
      title="Retos semanales"
      description="Metas de una semana completa que otorgan una bonificación de XP mayor."
    >
      <div className="mb-4 flex justify-end">
        <Link href="/juegos/gamificacion/retos-semanales/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo reto semanal
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Inicio</th>
              <th className="px-5 py-3">Fin</th>
              <th className="px-5 py-3">XP</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{c.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.starts_on}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.ends_on}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.xp_reward}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/gamificacion/retos-semanales/${c.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {challenges.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay retos semanales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

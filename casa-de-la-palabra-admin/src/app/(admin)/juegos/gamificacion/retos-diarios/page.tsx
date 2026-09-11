import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Retos diarios — Gamificación" };

export default async function RetosDiariosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_daily_challenges")
    .select("id, title, challenge_type, xp_reward, active_date")
    .order("active_date", { ascending: false });

  const challenges = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → Gamificación"
      title="Retos diarios"
      description="Un reto por fecha que otorga XP extra al completarse."
    >
      <div className="mb-4 flex justify-end">
        <Link href="/juegos/gamificacion/retos-diarios/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo reto diario
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">XP</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{c.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.challenge_type}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.active_date}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.xp_reward}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/gamificacion/retos-diarios/${c.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {challenges.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay retos diarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

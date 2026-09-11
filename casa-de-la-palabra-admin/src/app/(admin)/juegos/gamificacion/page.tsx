import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Gamificación" };

export default async function GamificacionAdminPage() {
  const supabase = await createClient();
  const [{ count: levels }, { count: badges }, { count: daily }, { count: weekly }] = await Promise.all([
    supabase.from("casa_levels").select("*", { count: "exact", head: true }),
    supabase.from("casa_badges").select("*", { count: "exact", head: true }),
    supabase.from("casa_daily_challenges").select("*", { count: "exact", head: true }),
    supabase.from("casa_weekly_challenges").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PageShell
      eyebrow="Juegos"
      title="Gamificación"
      description="Niveles, insignias, retos diarios y semanales, rankings."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Niveles" value={levels ?? 0} />
        <Stat label="Insignias" value={badges ?? 0} />
        <Stat label="Retos diarios" value={daily ?? 0} />
        <Stat label="Retos semanales" value={weekly ?? 0} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/juegos/gamificacion/niveles" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Ver y editar niveles
        </Link>
        <Link href="/juegos/gamificacion/insignias" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted/50">
          Ver y editar insignias
        </Link>
        <Link href="/juegos/gamificacion/retos-diarios" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted/50">
          Ver y editar retos diarios
        </Link>
        <Link href="/juegos/gamificacion/retos-semanales" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted/50">
          Ver y editar retos semanales
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        El otorgamiento automático de insignias según su criterio y los rankings en vivo quedan para la siguiente
        fase.
      </p>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

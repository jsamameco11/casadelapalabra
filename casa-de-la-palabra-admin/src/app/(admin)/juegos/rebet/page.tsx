import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "REBET" };

export default async function RebetAdminPage() {
  const supabase = await createClient();
  const [{ count: questions }, { count: categories }, { count: games }] = await Promise.all([
    supabase.from("casa_rebet_questions").select("*", { count: "exact", head: true }),
    supabase.from("casa_rebet_categories").select("*", { count: "exact", head: true }),
    supabase.from("casa_rebet_games").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PageShell
      eyebrow="Juegos"
      title="REBET"
      description="Preguntas, categorías, dificultades y fórmula de puntuación."
    >
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Preguntas" value={questions ?? 0} />
        <Stat label="Categorías" value={categories ?? 0} />
        <Stat label="Partidas jugadas" value={games ?? 0} />
      </div>
      <div className="mt-8">
        <Link href="/juegos/rebet/preguntas" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Ver y editar preguntas
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        La importación por CSV/JSON y el ajuste fino de la fórmula de puntuación quedan para la
        siguiente fase.
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

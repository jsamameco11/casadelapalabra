import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "LINGOBIBLE" };

export default async function LingobibleAdminPage() {
  const supabase = await createClient();
  const [{ count: paths }, { count: units }, { count: lessons }] = await Promise.all([
    supabase.from("casa_lingobible_paths").select("*", { count: "exact", head: true }),
    supabase.from("casa_lingobible_units").select("*", { count: "exact", head: true }),
    supabase.from("casa_lingobible_lessons").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PageShell eyebrow="Juegos" title="LINGOBIBLE" description="Rutas, unidades, lecciones y ejercicios.">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Rutas" value={paths ?? 0} />
        <Stat label="Unidades" value={units ?? 0} />
        <Stat label="Lecciones" value={lessons ?? 0} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/juegos/lingobible/rutas" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Ver y editar rutas
        </Link>
        <Link href="/juegos/lingobible/unidades" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted/50">
          Ver y editar unidades
        </Link>
        <Link href="/juegos/lingobible/lecciones" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted/50">
          Ver y editar lecciones
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        El editor de ejercicios individuales dentro de cada lección queda para la siguiente fase.
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

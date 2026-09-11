import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Niveles — Gamificación" };

export default async function NivelesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_levels")
    .select("level_number, name, min_xp, icon_url")
    .order("level_number", { ascending: true });

  const levels = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → Gamificación"
      title="Niveles"
      description="La escala de niveles define cuánta XP acumulada se necesita para subir de nivel."
    >
      <div className="mb-4 flex justify-end">
        <Link href="/juegos/gamificacion/niveles/nuevo" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nuevo nivel
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Nivel</th>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">XP mínimo</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.level_number} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{l.level_number}</td>
                <td className="px-5 py-3">{l.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{l.min_xp}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/gamificacion/niveles/${l.level_number}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {levels.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay niveles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

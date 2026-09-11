import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { LessonsFilter } from "@/components/admin/lingobible/lessons-filter";

export const metadata = { title: "Lecciones — LINGOBIBLE" };

export default async function LeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const { unit } = await searchParams;
  const supabase = await createClient();

  const { data: units } = await supabase.from("casa_lingobible_units").select("id, title").order("position");

  let query = supabase
    .from("casa_lingobible_lessons")
    .select("id, title, xp_reward, position, status, unit_id, casa_lingobible_units(title)")
    .order("position", { ascending: true });
  if (unit) query = query.eq("unit_id", unit);
  const { data } = await query;

  const lessons = data ?? [];

  return (
    <PageShell
      eyebrow="Juegos → LINGOBIBLE"
      title="Lecciones"
      description="Cada lección otorga XP al completarse y contiene sus propios ejercicios."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <LessonsFilter units={units ?? []} selectedUnit={unit} />
        <Link href="/juegos/lingobible/lecciones/nueva" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva lección
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Unidad</th>
              <th className="px-5 py-3">XP</th>
              <th className="px-5 py-3">Posición</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{l.title}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {(l.casa_lingobible_units as unknown as { title: string } | null)?.title ?? "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{l.xp_reward}</td>
                <td className="px-5 py-3 text-muted-foreground">{l.position}</td>
                <td className="px-5 py-3 text-muted-foreground">{l.status}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/lingobible/lecciones/${l.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {lessons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay lecciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

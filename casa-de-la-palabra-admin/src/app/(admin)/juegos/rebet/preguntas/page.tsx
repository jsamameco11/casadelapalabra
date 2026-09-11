import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { RebetQuestionsFilter } from "@/components/admin/rebet/questions-filter";

export const metadata = { title: "Preguntas REBET" };

const DIFFICULTY_LABELS: Record<string, string> = { easy: "Fácil", medium: "Intermedio", hard: "Difícil", expert: "Experto" };
const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicada", archived: "Archivada" };

export default async function RebetPreguntasPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string }>;
}) {
  const { category, difficulty } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase.from("casa_rebet_categories").select("id, slug, name").order("position");

  let query = supabase
    .from("casa_rebet_questions")
    .select("id, question, difficulty, status, category_id, casa_rebet_categories(name)")
    .order("created_at", { ascending: false });

  if (category) {
    const cat = categories?.find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data: questions } = await query;

  return (
    <PageShell eyebrow="Juegos → REBET" title="Preguntas" description="Banco de preguntas de REBET, por categoría y dificultad.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RebetQuestionsFilter categories={categories ?? []} selectedCategory={category} selectedDifficulty={difficulty} />
        <Link href="/juegos/rebet/preguntas/nueva" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Nueva pregunta
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Pregunta</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Dificultad</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {(questions ?? []).map((q) => (
              <tr key={q.id} className="border-b border-border last:border-0">
                <td className="max-w-md truncate px-5 py-3">{q.question}</td>
                <td className="px-5 py-3 text-muted-foreground">{(q.casa_rebet_categories as unknown as { name: string } | null)?.name ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${q.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[q.status] ?? q.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/juegos/rebet/preguntas/${q.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(questions ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  No hay preguntas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

async function count(table: string) {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function DashboardPage() {
  const [studies, videos, podcasts, courses, conferences, rebetQuestions, lingobibleLessons, users, donations] =
    await Promise.all([
      count("casa_studies"),
      count("casa_videos"),
      count("casa_podcast_episodes"),
      count("casa_courses"),
      count("casa_conferences"),
      count("casa_rebet_questions"),
      count("casa_lingobible_lessons"),
      count("casa_profiles"),
      count("casa_donation_methods"),
    ]);

  const stats = [
    { label: "Estudios", value: studies },
    { label: "Videos", value: videos },
    { label: "Episodios de podcast", value: podcasts },
    { label: "Cursos", value: courses },
    { label: "Conferencias", value: conferences },
    { label: "Preguntas REBET", value: rebetQuestions },
    { label: "Lecciones LINGOBIBLE", value: lingobibleLessons },
    { label: "Usuarios", value: users },
    { label: "Métodos de donación", value: donations },
  ];

  return (
    <div className="p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">General</p>
      <h1 className="mt-1 font-display text-2xl font-medium">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

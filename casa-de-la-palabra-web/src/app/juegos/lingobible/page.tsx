import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, ComingSoon } from "@/components/layout/page-header";

export const metadata = { title: "LINGOBIBLE" };

export default async function LingobiblePage() {
  const supabase = await createClient();
  const { data: path } = await supabase
    .from("casa_lingobible_paths")
    .select("id, title, description")
    .eq("status", "published")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!path) {
    return (
      <div>
        <PageHeader eyebrow="Juegos" title="LINGOBIBLE" />
        <ComingSoon label="El camino de aprendizaje" />
      </div>
    );
  }

  const { data: units } = await supabase
    .from("casa_lingobible_units")
    .select("id, title, description, position")
    .eq("path_id", path.id)
    .order("position", { ascending: true });

  const { data: lessons } = await supabase
    .from("casa_lingobible_lessons")
    .select("id, unit_id, title, xp_reward, position")
    .eq("status", "published")
    .order("position", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: progress } = user
    ? await supabase.from("casa_lingobible_user_progress").select("lesson_id, status, stars").eq("user_id", user.id)
    : { data: [] };

  return (
    <div>
      <PageHeader eyebrow="Juegos" title={path.title} description={path.description ?? undefined} />
      <div className="mx-auto max-w-2xl space-y-10 px-4 pb-24 sm:px-6 lg:px-8">
        {(units ?? []).map((unit) => (
          <div key={unit.id}>
            <h2 className="font-display text-lg font-medium">{unit.title}</h2>
            <div className="mt-3 space-y-2">
              {(lessons ?? [])
                .filter((l) => l.unit_id === unit.id)
                .map((lesson) => {
                  const p = progress?.find((pr) => pr.lesson_id === lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/juegos/lingobible/leccion/${lesson.id}`}
                      className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40"
                    >
                      <span className="text-sm font-medium">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {p ? "★".repeat(p.stars ?? 0) || "En progreso" : `+${lesson.xp_reward} XP`}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

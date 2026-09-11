import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { WeeklyChallengeForm } from "@/components/admin/gamificacion/weekly-challenge-form";

export default async function EditarRetoSemanalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_weekly_challenges")
    .select("id, title, description, goal, xp_reward, starts_on, ends_on")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Editar reto semanal">
      <WeeklyChallengeForm
        initial={{
          id: data.id,
          title: data.title,
          description: data.description ?? "",
          goal: JSON.stringify(data.goal ?? {}, null, 2),
          xp_reward: data.xp_reward,
          starts_on: data.starts_on,
          ends_on: data.ends_on,
        }}
      />
    </PageShell>
  );
}

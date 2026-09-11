import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { DailyChallengeForm } from "@/components/admin/gamificacion/daily-challenge-form";

export default async function EditarRetoDiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_daily_challenges")
    .select("id, title, description, challenge_type, target, xp_reward, active_date")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Editar reto diario">
      <DailyChallengeForm
        initial={{
          id: data.id,
          title: data.title,
          description: data.description ?? "",
          challenge_type: data.challenge_type,
          target: JSON.stringify(data.target ?? {}, null, 2),
          xp_reward: data.xp_reward,
          active_date: data.active_date,
        }}
      />
    </PageShell>
  );
}

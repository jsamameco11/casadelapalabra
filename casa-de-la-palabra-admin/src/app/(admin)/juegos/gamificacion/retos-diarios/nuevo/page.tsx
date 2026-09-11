import { PageShell } from "@/components/admin/page-shell";
import { DailyChallengeForm } from "@/components/admin/gamificacion/daily-challenge-form";

export const metadata = { title: "Nuevo reto diario" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NuevoRetoDiarioPage() {
  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Nuevo reto diario">
      <DailyChallengeForm
        initial={{
          title: "",
          description: "",
          challenge_type: "answer_questions",
          target: "{}",
          xp_reward: 100,
          active_date: todayISO(),
        }}
      />
    </PageShell>
  );
}

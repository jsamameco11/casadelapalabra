import { PageShell } from "@/components/admin/page-shell";
import { WeeklyChallengeForm } from "@/components/admin/gamificacion/weekly-challenge-form";

export const metadata = { title: "Nuevo reto semanal" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function inSevenDaysISO() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function NuevoRetoSemanalPage() {
  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Nuevo reto semanal">
      <WeeklyChallengeForm
        initial={{
          title: "",
          description: "",
          goal: "{}",
          xp_reward: 500,
          starts_on: todayISO(),
          ends_on: inSevenDaysISO(),
        }}
      />
    </PageShell>
  );
}

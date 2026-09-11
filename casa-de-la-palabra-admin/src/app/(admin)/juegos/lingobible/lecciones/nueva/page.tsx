import { PageShell } from "@/components/admin/page-shell";
import { LessonForm } from "@/components/admin/lingobible/lesson-form";

export const metadata = { title: "Nueva lección" };

export default function NuevaLeccionPage() {
  return (
    <PageShell eyebrow="Juegos → LINGOBIBLE" title="Nueva lección">
      <LessonForm initial={{ unit_id: "", title: "", xp_reward: 20, position: 0, status: "draft" }} />
    </PageShell>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { LessonForm } from "@/components/admin/lingobible/lesson-form";

export default async function EditarLeccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_lingobible_lessons")
    .select("id, unit_id, title, xp_reward, position, status")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → LINGOBIBLE" title="Editar lección">
      <LessonForm
        initial={{
          id: data.id,
          unit_id: data.unit_id,
          title: data.title,
          xp_reward: data.xp_reward,
          position: data.position,
          status: data.status,
        }}
      />
    </PageShell>
  );
}

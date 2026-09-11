import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { LevelForm } from "@/components/admin/gamificacion/level-form";

export default async function EditarNivelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_levels")
    .select("level_number, name, min_xp, icon_url")
    .eq("level_number", Number(level))
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Editar nivel">
      <LevelForm
        initial={{
          isNew: false,
          level_number: data.level_number,
          name: data.name,
          min_xp: data.min_xp,
          icon_url: data.icon_url ?? "",
        }}
      />
    </PageShell>
  );
}

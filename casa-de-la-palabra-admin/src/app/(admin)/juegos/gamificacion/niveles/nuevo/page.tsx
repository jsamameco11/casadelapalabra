import { PageShell } from "@/components/admin/page-shell";
import { LevelForm } from "@/components/admin/gamificacion/level-form";

export const metadata = { title: "Nuevo nivel" };

export default function NuevoNivelPage() {
  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Nuevo nivel">
      <LevelForm initial={{ isNew: true, level_number: 1, name: "", min_xp: 0, icon_url: "" }} />
    </PageShell>
  );
}

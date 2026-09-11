import { PageShell } from "@/components/admin/page-shell";
import { BadgeForm } from "@/components/admin/gamificacion/badge-form";

export const metadata = { title: "Nueva insignia" };

export default function NuevaInsigniaPage() {
  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Nueva insignia">
      <BadgeForm initial={{ slug: "", name: "", description: "", icon_url: "", criteria: "{}", is_active: true }} />
    </PageShell>
  );
}

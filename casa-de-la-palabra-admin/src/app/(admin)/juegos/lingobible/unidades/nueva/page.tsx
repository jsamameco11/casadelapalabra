import { PageShell } from "@/components/admin/page-shell";
import { UnitForm } from "@/components/admin/lingobible/unit-form";

export const metadata = { title: "Nueva unidad" };

export default function NuevaUnidadPage() {
  return (
    <PageShell eyebrow="Juegos → LINGOBIBLE" title="Nueva unidad">
      <UnitForm initial={{ path_id: "", title: "", description: "", position: 0 }} />
    </PageShell>
  );
}

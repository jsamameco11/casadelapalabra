import { PageShell } from "@/components/admin/page-shell";
import { CategoriaForm } from "@/components/admin/categoria-form";

export const metadata = { title: "Nueva categoría" };

export default function NuevaCategoriaPage() {
  return (
    <PageShell eyebrow="Contenido" title="Nueva categoría">
      <CategoriaForm initial={{ slug: "", name: "", description: "", module: "studies", position: 0 }} />
    </PageShell>
  );
}

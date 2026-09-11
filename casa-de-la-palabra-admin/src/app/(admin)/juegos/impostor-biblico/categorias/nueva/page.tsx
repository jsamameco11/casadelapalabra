import { PageShell } from "@/components/admin/page-shell";
import { CategoryForm } from "@/components/admin/impostor/category-form";

export const metadata = { title: "Nueva categoría" };

export default function NuevaCategoriaPage() {
  return (
    <PageShell eyebrow="Juegos → El Impostor Bíblico" title="Nueva categoría">
      <CategoryForm initial={{ slug: "", name: "", position: 0, is_active: true }} />
    </PageShell>
  );
}

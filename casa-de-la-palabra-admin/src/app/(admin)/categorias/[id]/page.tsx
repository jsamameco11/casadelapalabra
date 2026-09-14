import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { CategoriaForm } from "@/components/admin/categoria-form";

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_categories")
    .select("id, slug, name, description, module, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Contenido" title="Editar categoría">
      <CategoriaForm
        initial={{
          id: data.id,
          slug: data.slug,
          name: data.name,
          description: data.description ?? "",
          module: data.module,
          position: data.position,
        }}
      />
    </PageShell>
  );
}

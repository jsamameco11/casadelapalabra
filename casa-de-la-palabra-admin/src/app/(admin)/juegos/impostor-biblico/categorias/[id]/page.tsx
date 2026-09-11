import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { CategoryForm } from "@/components/admin/impostor/category-form";

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_impostor_categories")
    .select("id, slug, name, position, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → El Impostor Bíblico" title="Editar categoría">
      <CategoryForm initial={data} />
    </PageShell>
  );
}

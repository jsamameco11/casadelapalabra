import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { UnitForm } from "@/components/admin/lingobible/unit-form";

export default async function EditarUnidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_lingobible_units")
    .select("id, path_id, title, description, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → LINGOBIBLE" title="Editar unidad">
      <UnitForm
        initial={{
          id: data.id,
          path_id: data.path_id,
          title: data.title,
          description: data.description ?? "",
          position: data.position,
        }}
      />
    </PageShell>
  );
}

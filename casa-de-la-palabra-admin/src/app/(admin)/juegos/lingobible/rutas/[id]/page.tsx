import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { PathForm } from "@/components/admin/lingobible/path-form";

export default async function EditarRutaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_lingobible_paths")
    .select("id, slug, title, description, icon_url, position, status")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → LINGOBIBLE" title="Editar ruta">
      <PathForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description ?? "",
          icon_url: data.icon_url ?? "",
          position: data.position,
          status: data.status,
        }}
      />
    </PageShell>
  );
}

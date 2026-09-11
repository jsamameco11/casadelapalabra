import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { StudyForm } from "@/components/admin/study-form";

export default async function EditarEstudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_studies")
    .select("id, slug, title, description, cover_image_url, category_id, level, duration_minutes, status, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Contenido" title="Editar estudio">
      <StudyForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description ?? "",
          cover_image_url: data.cover_image_url ?? "",
          category_id: data.category_id ?? "",
          level: data.level,
          duration_minutes: data.duration_minutes ? String(data.duration_minutes) : "",
          status: data.status,
          position: data.position,
        }}
      />
    </PageShell>
  );
}

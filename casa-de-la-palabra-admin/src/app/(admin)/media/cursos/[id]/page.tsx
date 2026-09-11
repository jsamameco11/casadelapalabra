import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { CourseForm } from "@/components/admin/course-form";

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_courses")
    .select("id, slug, title, description, cover_image_url, is_premium, status, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Contenido" title="Editar curso">
      <CourseForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description ?? "",
          cover_image_url: data.cover_image_url ?? "",
          is_premium: data.is_premium,
          status: data.status,
          position: data.position,
        }}
      />
    </PageShell>
  );
}

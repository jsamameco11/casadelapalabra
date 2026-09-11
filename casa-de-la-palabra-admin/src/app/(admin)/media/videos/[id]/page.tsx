import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { VideoForm } from "@/components/admin/video-form";

export default async function EditarVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_videos")
    .select("id, slug, title, summary, description, youtube_url, category_id, status, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Contenido" title="Editar video">
      <VideoForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          summary: data.summary ?? "",
          description: data.description ?? "",
          youtube_url: data.youtube_url,
          category_id: data.category_id ?? "",
          status: data.status,
          position: data.position,
        }}
      />
    </PageShell>
  );
}

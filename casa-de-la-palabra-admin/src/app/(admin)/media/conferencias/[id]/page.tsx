import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { ConferenceForm } from "@/components/admin/conference-form";

export default async function EditarConferenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_conferences")
    .select("id, slug, title, speaker, event_date, location, summary, description, video_url, category_id, status, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Contenido" title="Editar conferencia">
      <ConferenceForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          speaker: data.speaker,
          event_date: data.event_date ?? "",
          location: data.location ?? "",
          summary: data.summary ?? "",
          description: data.description ?? "",
          video_url: data.video_url ?? "",
          category_id: data.category_id ?? "",
          status: data.status,
          position: data.position,
        }}
      />
    </PageShell>
  );
}

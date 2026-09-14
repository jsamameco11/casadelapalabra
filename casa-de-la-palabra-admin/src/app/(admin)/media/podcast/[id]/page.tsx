import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { PodcastForm } from "@/components/admin/podcast-form";

export default async function EditarEpisodioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_podcast_episodes")
    .select("id, slug, title, description, cover_image_url, audio_url, spotify_url, apple_podcasts_url, youtube_url, category_id, status, position")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Contenido" title="Editar episodio">
      <PodcastForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description ?? "",
          cover_image_url: data.cover_image_url ?? "",
          audio_url: data.audio_url ?? "",
          spotify_url: data.spotify_url ?? "",
          apple_podcasts_url: data.apple_podcasts_url ?? "",
          youtube_url: data.youtube_url ?? "",
          category_id: data.category_id ?? "",
          status: data.status,
          position: data.position,
        }}
      />
    </PageShell>
  );
}

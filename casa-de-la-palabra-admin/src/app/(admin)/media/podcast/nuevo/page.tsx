import { PageShell } from "@/components/admin/page-shell";
import { PodcastForm } from "@/components/admin/podcast-form";

export const metadata = { title: "Nuevo episodio" };

export default function NuevoEpisodioPage() {
  return (
    <PageShell eyebrow="Contenido" title="Nuevo episodio">
      <PodcastForm
        initial={{
          slug: "",
          title: "",
          description: "",
          cover_image_url: "",
          audio_url: "",
          spotify_url: "",
          apple_podcasts_url: "",
          youtube_url: "",
          status: "draft",
          position: 0,
        }}
      />
    </PageShell>
  );
}

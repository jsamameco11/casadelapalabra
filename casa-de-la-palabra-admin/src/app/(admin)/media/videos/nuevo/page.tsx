import { PageShell } from "@/components/admin/page-shell";
import { VideoForm } from "@/components/admin/video-form";

export const metadata = { title: "Nuevo video" };

export default function NuevoVideoPage() {
  return (
    <PageShell eyebrow="Contenido" title="Nuevo video">
      <VideoForm
        initial={{ slug: "", title: "", summary: "", description: "", youtube_url: "", category_id: "", status: "draft", position: 0 }}
      />
    </PageShell>
  );
}

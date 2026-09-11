import { PageShell } from "@/components/admin/page-shell";
import { ConferenceForm } from "@/components/admin/conference-form";

export const metadata = { title: "Nueva conferencia" };

export default function NuevaConferenciaPage() {
  return (
    <PageShell eyebrow="Contenido" title="Nueva conferencia">
      <ConferenceForm
        initial={{
          slug: "",
          title: "",
          speaker: "",
          event_date: "",
          location: "",
          summary: "",
          description: "",
          video_url: "",
          status: "draft",
          position: 0,
        }}
      />
    </PageShell>
  );
}

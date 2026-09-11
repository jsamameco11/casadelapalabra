import { PageShell } from "@/components/admin/page-shell";
import { StudyForm } from "@/components/admin/study-form";

export const metadata = { title: "Nuevo estudio" };

export default function NuevoEstudioPage() {
  return (
    <PageShell eyebrow="Contenido" title="Nuevo estudio">
      <StudyForm
        initial={{
          slug: "",
          title: "",
          description: "",
          cover_image_url: "",
          category_id: "",
          level: "beginner",
          duration_minutes: "",
          status: "draft",
          position: 0,
        }}
      />
    </PageShell>
  );
}

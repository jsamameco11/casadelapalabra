import { PageShell } from "@/components/admin/page-shell";
import { CourseForm } from "@/components/admin/course-form";

export const metadata = { title: "Nuevo curso" };

export default function NuevoCursoPage() {
  return (
    <PageShell eyebrow="Contenido" title="Nuevo curso">
      <CourseForm
        initial={{
          slug: "",
          title: "",
          description: "",
          cover_image_url: "",
          is_premium: false,
          category_id: "",
          status: "draft",
          position: 0,
        }}
      />
    </PageShell>
  );
}

import { PageShell } from "@/components/admin/page-shell";
import { StudyForm } from "@/components/admin/study-form";

export const metadata = { title: "Nuevo estudio" };

export default function NuevoEstudioPage() {
  return (
    <PageShell
      eyebrow="Contenido"
      title="Nuevo estudio"
      description="Guarda los datos generales y pasarás directo al editor completo: secciones, versículos, párrafos y una previsualización en vivo de cómo se verá en la página principal."
    >
      <StudyForm
        initial={{
          slug: "",
          title: "",
          subtitle: "",
          description: "",
          main_verse: "",
          main_verse_book_slug: "",
          main_verse_chapter: "",
          main_verse_verse_start: "",
          main_verse_verse_end: "",
          main_verse_translation_code: "",
          cover_image_url: "",
          social_image_url: "",
          category_id: "",
          level: "beginner",
          duration_minutes: "",
          status: "draft",
          position: 0,
          seo_title: "",
          seo_description: "",
        }}
      />
    </PageShell>
  );
}

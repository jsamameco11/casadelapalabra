import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { StudyForm } from "@/components/admin/study-form";
import { StudyEditor } from "@/components/admin/estudios/study-editor";

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://casadelapalabra.miacademiapreu.com";

export default async function EditarEstudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: books }] = await Promise.all([
    supabase
      .from("casa_studies")
      .select(
        "id, slug, title, subtitle, description, main_verse, cover_image_url, social_image_url, category_id, level, duration_minutes, status, position, seo_title, seo_description"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("casa_bible_books").select("slug, default_name"),
  ]);

  if (!data) notFound();

  const bookNames = Object.fromEntries((books ?? []).map((b) => [b.slug, b.default_name]));

  return (
    <PageShell
      eyebrow="Contenido"
      title="Editar estudio"
      description="Arriba los datos generales; abajo, la narrativa: secciones con el nombre que tú elijas y dentro los contenidos que quieras, en el orden que quieras."
    >
      <div className="space-y-12">
        <section>
          <h2 className="mb-4 font-display text-lg font-medium">Datos del estudio</h2>
          <StudyForm
            initial={{
              id: data.id,
              slug: data.slug,
              title: data.title,
              subtitle: data.subtitle ?? "",
              description: data.description ?? "",
              main_verse: data.main_verse ?? "",
              cover_image_url: data.cover_image_url ?? "",
              social_image_url: data.social_image_url ?? "",
              category_id: data.category_id ?? "",
              level: data.level,
              duration_minutes: data.duration_minutes ? String(data.duration_minutes) : "",
              status: data.status,
              position: data.position,
              seo_title: data.seo_title ?? "",
              seo_description: data.seo_description ?? "",
            }}
            stayOnSave
          />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-medium">Secciones y previsualización</h2>
            <Link
              href={`${SITE_URL}/estudios/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Abrir en el sitio público ↗
            </Link>
          </div>
          <StudyEditor
            study={{ id: data.id, slug: data.slug, title: data.title, subtitle: data.subtitle }}
            bookNames={bookNames}
          />
        </section>
      </div>
    </PageShell>
  );
}

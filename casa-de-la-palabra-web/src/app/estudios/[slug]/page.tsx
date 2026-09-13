import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudySection } from "@/lib/studies/blocks";
import { StudyExperience } from "@/components/estudios/study-experience";

// Una sola consulta trae el estudio con sus secciones y contenidos anidados;
// un estudio con muchas secciones no debe convertirse en decenas de viajes.
const STUDY_QUERY = `
  id, slug, title, subtitle, description, main_verse, main_verse_book_slug, main_verse_chapter,
  main_verse_verse_start, main_verse_verse_end, main_verse_translation_code, level, duration_minutes,
  cover_image_url, social_image_url, seo_title, seo_description, published_at,
  casa_study_sections (
    id, title, subtitle, position, is_visible, layout, image_url, configuration,
    casa_study_contents (
      id, type, position, is_visible, title, subtitle, body, media_url, media_alt, configuration,
      casa_study_content_verses (
        book_slug, chapter_start, verse_start, chapter_end, verse_end, translation_code,
        text, show_reference, reflection_enabled, reflection_title, reflection_content,
        reflection_configuration
      )
    )
  )
`;

type StudyRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  main_verse: string | null;
  main_verse_book_slug: string | null;
  main_verse_chapter: number | null;
  main_verse_verse_start: number | null;
  main_verse_verse_end: number | null;
  main_verse_translation_code: string | null;
  level: string | null;
  duration_minutes: number | null;
  cover_image_url: string | null;
  social_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  casa_study_sections: RawSection[] | null;
};

type RawSection = Omit<StudySection, "contents"> & { casa_study_contents: RawContent[] | null };
// casa_study_content_verses es 1 a 1 (content_id es PK y FK a la vez), así
// que PostgREST la embebe como objeto suelto, no como arreglo — a diferencia
// de una relación 1 a muchos normal.
type RawContent = Omit<StudySection["contents"][number], "verse"> & {
  casa_study_content_verses: StudySection["contents"][number]["verse"] | null;
};

async function loadStudy(slug: string) {
  const supabase = await createClient();
  // No se filtra por status aquí: la política RLS "casa_studies_public_read_published"
  // ya deja pasar published para cualquiera y unpublished solo para staff — filtrar
  // otra vez acá bloquearía justamente el caso que esa política existe para permitir
  // (que el equipo editorial pueda previsualizar un borrador en la URL real).
  const { data } = await supabase.from("casa_studies").select(STUDY_QUERY).eq("slug", slug).maybeSingle();
  return (data as StudyRow | null) ?? null;
}

// Lo oculto se filtra acá además de en RLS: el staff sí puede leerlo, pero en
// la página pública nunca debe aparecer.
function visibleSections(study: StudyRow): StudySection[] {
  return (study.casa_study_sections ?? [])
    .filter((section) => section.is_visible)
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      ...section,
      contents: (section.casa_study_contents ?? [])
        .filter((content) => content.is_visible)
        .sort((a, b) => a.position - b.position)
        .map((content) => ({
          ...content,
          verse: content.casa_study_content_verses ?? null,
        })),
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = await loadStudy(slug);
  if (!study) return {};

  const title = study.seo_title ?? study.title;
  const description = study.seo_description ?? study.subtitle ?? study.description?.slice(0, 160) ?? undefined;
  const image = study.social_image_url ?? study.cover_image_url ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/estudios/${study.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/estudios/${study.slug}`,
      images: image ? [image] : undefined,
      publishedTime: study.published_at ?? undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function EstudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = await loadStudy(slug);
  if (!study) notFound();

  const sections = visibleSections(study);

  // Los nombres de libro salen de la Biblia que ya vive en la base, así que la
  // referencia se muestra bien aunque el editor solo eligiera el libro.
  const supabase = await createClient();
  const { data: books } = await supabase.from("casa_bible_books").select("slug, default_name");
  const bookNames = Object.fromEntries((books ?? []).map((b) => [b.slug, b.default_name]));

  const mainVerse = study.main_verse
    ? {
        text: study.main_verse,
        book_slug: study.main_verse_book_slug,
        chapter_start: study.main_verse_chapter,
        verse_start: study.main_verse_verse_start,
        verse_end: study.main_verse_verse_end,
        translation_code: study.main_verse_translation_code,
      }
    : null;

  return (
    <article>
      <StudyExperience
        study={{ id: study.id, slug: study.slug, title: study.title, subtitle: study.subtitle }}
        mainVerse={mainVerse}
        sections={sections}
        bookNames={bookNames}
      />
    </article>
  );
}

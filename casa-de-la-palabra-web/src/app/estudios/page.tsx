import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/layout/page-header";
import { ContentPageHeader } from "@/components/layout/content-page-header";

export const metadata = { title: "Estudios Bíblicos" };

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Primeros pasos",
  intermediate: "Creciendo en fe",
  advanced: "Alimento sólido",
};

const LEVEL_OPTIONS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));

export default async function EstudiosPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string }>;
}) {
  const { nivel } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("casa_studies")
    .select("id, slug, title, description, level, cover_image_url")
    .eq("status", "published")
    .order("position", { ascending: true });
  if (nivel) query = query.eq("level", nivel);
  const { data } = await query;

  const studies = data ?? [];

  return (
    <div>
      <ContentPageHeader
        eyebrow="Estudios Bíblicos"
        title="Profundiza en la Palabra"
        description="Una biblioteca de estudios organizados por tema y nivel."
        basePath="/estudios"
        paramName="nivel"
        filterLabel="Todos los niveles"
        options={LEVEL_OPTIONS}
        selected={nivel}
      />
      {studies.length === 0 ? (
        <ComingSoon label="La biblioteca de estudios" />
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {studies.map((s) => (
            <Link
              key={s.id}
              href={`/estudios/${s.slug}`}
              className="overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              {s.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover_image_url} alt={s.title} className="h-36 w-full object-cover" />
              )}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{LEVEL_LABELS[s.level] ?? s.level}</p>
                <h2 className="mt-2 font-display text-lg font-medium">{s.title}</h2>
                {s.description && <p className="mt-2 line-clamp-3 text-sm text-foreground/70">{s.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

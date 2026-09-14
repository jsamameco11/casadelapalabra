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

// PostgREST usa "," y "()" como separadores dentro de .or(...) — se quitan
// del término de búsqueda para que un usuario escribiendo algo como
// "fe, esperanza" no rompa el filtro ni se interprete como otra condición.
function sanitizeSearchTerm(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

export default async function EstudiosPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; q?: string }>;
}) {
  const { nivel, q } = await searchParams;
  const term = sanitizeSearchTerm(q ?? "");
  const supabase = await createClient();
  let query = supabase
    .from("casa_studies")
    .select("id, slug, title, description, level, cover_image_url")
    .eq("status", "published")
    .order("position", { ascending: true });
  if (nivel) query = query.eq("level", nivel);
  if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
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
        search={{ paramName: "q", placeholder: "Buscar estudios…", value: q }}
      />
      {studies.length === 0 ? (
        term || nivel ? (
          <p className="mx-auto max-w-2xl px-4 pb-24 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            Ningún estudio coincide con tu búsqueda. Prueba con otra palabra o quita el filtro de nivel.
          </p>
        ) : (
          <ComingSoon label="La biblioteca de estudios" />
        )
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/layout/page-header";
import { ContentPageHeader } from "@/components/layout/content-page-header";

export const metadata = { title: "Conferencias Pasadas" };

export default async function ConferenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();
  const [{ data: categories }, conferenceResult] = await Promise.all([
    supabase.from("casa_categories").select("id, name").eq("module", "conferences").order("position"),
    (async () => {
      let query = supabase
        .from("casa_conferences")
        .select("id, slug, title, speaker, event_date")
        .eq("status", "published")
        .order("position", { ascending: true });
      if (categoria) query = query.eq("category_id", categoria);
      return query;
    })(),
  ]);

  const conferences = conferenceResult.data ?? [];

  return (
    <div>
      <ContentPageHeader
        eyebrow="Media"
        title="Conferencias Pasadas"
        basePath="/media/conferencias"
        paramName="categoria"
        filterLabel="Todas las categorías"
        options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        selected={categoria}
      />
      {conferences.length === 0 ? (
        <ComingSoon label="El archivo de conferencias" />
      ) : (
        <div className="mx-auto max-w-4xl space-y-4 px-4 pb-24 sm:px-6 lg:px-8">
          {conferences.map((c) => (
            <Link
              key={c.id}
              href={`/media/conferencias/${c.slug}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
            >
              <div>
                <h2 className="font-display text-lg font-medium">{c.title}</h2>
                <p className="text-sm text-muted-foreground">{c.speaker}</p>
              </div>
              {c.event_date && <span className="text-xs text-muted-foreground">{c.event_date}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

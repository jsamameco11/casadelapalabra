import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, ComingSoon } from "@/components/layout/page-header";

export const metadata = { title: "Conferencias Pasadas" };

export default async function ConferenciasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_conferences")
    .select("id, slug, title, speaker, event_date")
    .eq("status", "published")
    .order("position", { ascending: true });

  const conferences = data ?? [];

  return (
    <div>
      <PageHeader eyebrow="Media" title="Conferencias Pasadas" />
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, ComingSoon } from "@/components/layout/page-header";

export const metadata = { title: "Cursos" };

export default async function CursosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_courses")
    .select("id, slug, title, description, is_premium, cover_image_url")
    .eq("status", "published")
    .order("position", { ascending: true });

  const courses = data ?? [];

  return (
    <div>
      <PageHeader eyebrow="Media" title="Cursos" />
      {courses.length === 0 ? (
        <ComingSoon label="El catálogo de cursos" />
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/media/cursos/${c.slug}`}
              className="overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              {c.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover_image_url} alt={c.title} className="h-36 w-full object-cover" />
              )}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{c.is_premium ? "Premium" : "Gratuito"}</p>
                <h2 className="mt-2 font-display text-lg font-medium">{c.title}</h2>
                {c.description && <p className="mt-2 line-clamp-3 text-sm text-foreground/70">{c.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

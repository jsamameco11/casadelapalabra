import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const LEVEL_LABELS: Record<string, string> = { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" };

export default async function EstudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: study } = await supabase
    .from("casa_studies")
    .select("title, description, level, duration_minutes, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!study) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {study.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={study.cover_image_url} alt={study.title} className="mb-6 h-56 w-full rounded-3xl object-cover" />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        {LEVEL_LABELS[study.level] ?? study.level}
        {study.duration_minutes ? ` · ${study.duration_minutes} min` : ""}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">{study.title}</h1>
      {study.description && (
        <div className="mt-6 space-y-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base">
          {study.description}
        </div>
      )}
    </div>
  );
}

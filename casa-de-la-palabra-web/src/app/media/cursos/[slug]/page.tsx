import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("casa_courses")
    .select("title, description, is_premium, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!course) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {course.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.cover_image_url} alt={course.title} className="mb-6 h-56 w-full rounded-3xl object-cover" />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{course.is_premium ? "Premium" : "Gratuito"}</p>
      <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">{course.title}</h1>
      {course.description && (
        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base">{course.description}</div>
      )}
      <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Los módulos y lecciones de este curso se publican en la siguiente fase.
      </div>
    </div>
  );
}

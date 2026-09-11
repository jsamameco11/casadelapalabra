import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: video } = await supabase
    .from("casa_videos")
    .select("title, description, summary, youtube_id, topics, bible_references")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!video) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <h1 className="mt-6 font-display text-2xl font-medium sm:text-3xl">{video.title}</h1>
      {video.summary && <p className="mt-3 text-sm text-foreground/70">{video.summary}</p>}
      {video.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{video.description}</p>}

      {video.topics?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {video.topics.map((t: string) => (
            <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70">
              {t}
            </span>
          ))}
        </div>
      )}

      {video.bible_references?.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Versículos relacionados</p>
          <p className="mt-2 text-sm">{video.bible_references.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}

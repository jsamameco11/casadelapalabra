import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function youtubeIdFrom(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default async function ConferenciaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: conf } = await supabase
    .from("casa_conferences")
    .select("title, speaker, event_date, location, summary, description, video_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!conf) notFound();

  const youtubeId = youtubeIdFrom(conf.video_url);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {youtubeId && (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={conf.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-accent">
        {conf.speaker}
        {conf.event_date ? ` · ${conf.event_date}` : ""}
        {conf.location ? ` · ${conf.location}` : ""}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">{conf.title}</h1>
      {conf.summary && <p className="mt-3 text-sm text-foreground/70">{conf.summary}</p>}
      {conf.description && (
        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base">{conf.description}</div>
      )}
    </div>
  );
}

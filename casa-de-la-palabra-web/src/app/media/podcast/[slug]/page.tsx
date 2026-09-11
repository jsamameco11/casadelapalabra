import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PodcastEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: ep } = await supabase
    .from("casa_podcast_episodes")
    .select("title, description, cover_image_url, audio_url, spotify_url, apple_podcasts_url, youtube_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!ep) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {ep.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ep.cover_image_url} alt={ep.title} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
        )}
        <h1 className="font-display text-2xl font-medium sm:text-3xl">{ep.title}</h1>
      </div>

      {ep.audio_url && (
        <audio controls className="mt-6 w-full">
          <source src={ep.audio_url} />
        </audio>
      )}

      <div className="mt-4 flex gap-4 text-sm text-primary">
        {ep.spotify_url && <a href={ep.spotify_url}>Escuchar en Spotify</a>}
        {ep.apple_podcasts_url && <a href={ep.apple_podcasts_url}>Apple Podcasts</a>}
        {ep.youtube_url && <a href={ep.youtube_url}>YouTube</a>}
      </div>

      {ep.description && <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{ep.description}</p>}
    </div>
  );
}

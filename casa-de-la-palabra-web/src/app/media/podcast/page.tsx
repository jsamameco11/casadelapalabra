import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/layout/page-header";
import { ContentPageHeader } from "@/components/layout/content-page-header";

export const metadata = { title: "Podcast" };

export default async function PodcastPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();
  const [{ data: categories }, episodeResult] = await Promise.all([
    supabase.from("casa_categories").select("id, name").eq("module", "podcasts").order("position"),
    (async () => {
      let query = supabase
        .from("casa_podcast_episodes")
        .select("id, slug, title, description, cover_image_url, spotify_url, apple_podcasts_url, youtube_url")
        .eq("status", "published")
        .order("position", { ascending: true });
      if (categoria) query = query.eq("category_id", categoria);
      return query;
    })(),
  ]);

  const episodes = episodeResult.data ?? [];

  return (
    <div>
      <ContentPageHeader
        eyebrow="Media"
        title="Podcast"
        basePath="/media/podcast"
        paramName="categoria"
        filterLabel="Todas las categorías"
        options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        selected={categoria}
      />
      {episodes.length === 0 ? (
        <ComingSoon label="El podcast" />
      ) : (
        <div className="mx-auto max-w-3xl space-y-4 px-4 pb-24 sm:px-6 lg:px-8">
          {episodes.map((ep) => (
            <div key={ep.id} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              {ep.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ep.cover_image_url} alt={ep.title} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              )}
              <div>
                <Link href={`/media/podcast/${ep.slug}`} className="font-display text-lg font-medium hover:text-primary">
                  {ep.title}
                </Link>
                {ep.description && <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{ep.description}</p>}
                <div className="mt-3 flex gap-4 text-xs text-primary">
                  {ep.spotify_url && <a href={ep.spotify_url}>Spotify</a>}
                  {ep.apple_podcasts_url && <a href={ep.apple_podcasts_url}>Apple Podcasts</a>}
                  {ep.youtube_url && <a href={ep.youtube_url}>YouTube</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

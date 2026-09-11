import { createClient } from "@/lib/supabase/server";
import { PageHeader, ComingSoon } from "@/components/layout/page-header";
import Link from "next/link";

export const metadata = { title: "Videos" };

export default async function VideosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_videos")
    .select("id, slug, title, thumbnail_url")
    .eq("status", "published")
    .order("position", { ascending: true });

  const videos = data ?? [];

  return (
    <div>
      <PageHeader eyebrow="Media" title="Videos" />
      {videos.length === 0 ? (
        <ComingSoon label="La galería de videos" />
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {videos.map((v) => (
            <Link key={v.id} href={`/media/videos/${v.slug}`} className="group">
              <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                {v.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail_url} alt={v.title} className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-3 text-sm font-medium">{v.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

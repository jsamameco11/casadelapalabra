import { createClient } from "@/lib/supabase/server";
import type { Conference, PodcastEpisode, Study, Video } from "@/lib/types/content";

export async function getFeaturedStudies(limit = 3): Promise<Study[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_studies")
    .select("id, slug, title, description, cover_image_url, level, duration_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as Study[]) ?? [];
}

export async function getFeaturedVideos(limit = 3): Promise<Video[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_videos")
    .select("id, slug, title, thumbnail_url, youtube_id, duration_seconds")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as Video[]) ?? [];
}

export async function getFeaturedPodcasts(limit = 3): Promise<PodcastEpisode[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_podcast_episodes")
    .select("id, slug, title, cover_image_url, duration_seconds, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as PodcastEpisode[]) ?? [];
}

export async function getFeaturedConferences(limit = 3): Promise<Conference[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_conferences")
    .select("id, slug, title, speaker, event_date")
    .eq("status", "published")
    .order("event_date", { ascending: false })
    .limit(limit);
  return (data as Conference[]) ?? [];
}

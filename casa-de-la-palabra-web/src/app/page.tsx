import { getSiteSettings, getTodaysDevotional } from "@/lib/data/site";
import { getFeaturedConferences, getFeaturedPodcasts, getFeaturedStudies, getFeaturedVideos } from "@/lib/data/home";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/home/hero";
import { DevotionalGate } from "@/components/home/devotional-gate";
import {
  BibleTeaser,
  DonationCta,
  GamesTeaser,
  MediaTeaser,
  StudiesTeaser,
  VerseOfDay,
} from "@/components/home/sections";

export default async function HomePage() {
  const supabase = await createClient();
  const [settings, devotional, studies, videos, podcasts, conferences, { data: { user } }] = await Promise.all([
    getSiteSettings(),
    getTodaysDevotional(),
    getFeaturedStudies(),
    getFeaturedVideos(),
    getFeaturedPodcasts(),
    getFeaturedConferences(),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      {settings.devotional_enabled && devotional && (
        <DevotionalGate devotional={devotional} isAuthenticated={!!user} />
      )}
      <Hero settings={settings} />
      <BibleTeaser />
      <GamesTeaser />
      <VerseOfDay devotional={devotional} />
      <StudiesTeaser studies={studies} />
      <MediaTeaser videos={videos} podcasts={podcasts} conferences={conferences} />
      <DonationCta settings={settings} />
    </>
  );
}

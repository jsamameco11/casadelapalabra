// Hand-authored types matching the casa_* schema (see casa-de-la-palabra-database).
// TODO: once the Supabase project is linked, replace with generated types via
// `supabase gen types typescript --project-id kxiunxdjtaesswgexsij`.

export interface SiteSettings {
  id: number;
  site_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  dark_mode_enabled: boolean;
  hero_title: string;
  hero_subtitle: string;
  hero_primary_cta_label: string;
  hero_primary_cta_href: string;
  hero_secondary_cta_label: string;
  hero_secondary_cta_href: string;
  hero_image_url: string | null;
  devotional_enabled: boolean;
  devotional_title: string;
  donation_cta_title: string;
  maintenance_mode: boolean;
}

export interface Devotional {
  id: string;
  title: string;
  body: string;
  verse_reference: string | null;
  verse_text: string | null;
  cover_image_url: string | null;
  publish_date: string;
  ai_generated: boolean;
}

export interface NavItem {
  id: string;
  parent_id: string | null;
  label: string;
  href: string | null;
  position: number;
  opens_in_new_tab: boolean;
}

export interface FooterColumn {
  id: string;
  title: string;
  position: number;
  links: { id: string; label: string; href: string; position: number }[];
}

export interface SocialLink {
  id: string;
  platform: "facebook" | "instagram" | "youtube" | "tiktok" | "spotify" | "x";
  url: string;
}

export interface DonationMethod {
  id: string;
  method: "yape" | "plin" | "bank_transfer" | "card" | "stripe" | "paypal";
  label: string;
  details: Record<string, unknown>;
}

export interface RebetCategory {
  id: string;
  slug: string;
  name: string;
  icon_url: string | null;
}

export interface LingobiblePath {
  id: string;
  slug: string;
  title: string;
  description: string | null;
}

export interface Study {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  level: "beginner" | "intermediate" | "advanced";
  duration_minutes: number | null;
}

export interface Video {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  youtube_id: string;
  duration_seconds: number | null;
}

export interface PodcastEpisode {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
}

export interface Conference {
  id: string;
  slug: string;
  title: string;
  speaker: string;
  event_date: string | null;
}

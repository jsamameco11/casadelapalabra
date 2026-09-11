import { createClient } from "@/lib/supabase/server";
import type {
  Devotional,
  DonationMethod,
  FooterColumn,
  NavItem,
  SiteSettings,
  SocialLink,
} from "@/lib/types/content";

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  site_name: "Casa de la Palabra",
  logo_url: null,
  primary_color: "#1F3B34",
  accent_color: "#C9A24B",
  dark_mode_enabled: true,
  hero_title: "Conoce, estudia y vive la Palabra",
  hero_subtitle:
    "Un espacio para acercarte a Dios a través de la Biblia, el aprendizaje, el contenido y la comunidad.",
  hero_primary_cta_label: "Explorar la Biblia",
  hero_primary_cta_href: "/biblia",
  hero_secondary_cta_label: "Comenzar a aprender",
  hero_secondary_cta_href: "/juegos",
  hero_image_url: null,
  devotional_enabled: false,
  devotional_title: "Devocional de hoy",
  donation_cta_title: "Tu apoyo nos ayuda a llevar la Palabra más lejos.",
  maintenance_mode: false,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("casa_site_settings")
    .select(
      "id, site_name, logo_url, primary_color, accent_color, dark_mode_enabled, hero_title, hero_subtitle, hero_primary_cta_label, hero_primary_cta_href, hero_secondary_cta_label, hero_secondary_cta_href, hero_image_url, devotional_enabled, devotional_title, donation_cta_title, maintenance_mode"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SITE_SETTINGS;
  return data as SiteSettings;
}

export async function getTodaysDevotional(): Promise<Devotional | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("casa_devotionals")
    .select(
      "id, title, body, verse_reference, verse_text, cover_image_url, publish_date, ai_generated"
    )
    .eq("status", "published")
    .lte("publish_date", today)
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Devotional) ?? null;
}

export async function getNavigation(): Promise<NavItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_navigation_items")
    .select("id, parent_id, label, href, position, opens_in_new_tab")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (data as NavItem[]) ?? [];
}

export async function getFooter(): Promise<FooterColumn[]> {
  const supabase = await createClient();
  const { data: columns } = await supabase
    .from("casa_footer_columns")
    .select("id, title, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (!columns?.length) return [];

  const { data: links } = await supabase
    .from("casa_footer_links")
    .select("id, column_id, label, href, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return columns.map((col) => ({
    ...col,
    links: (links ?? []).filter((l) => l.column_id === col.id),
  }));
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_social_links")
    .select("id, platform, url")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (data as SocialLink[]) ?? [];
}

export async function getDonationMethods(): Promise<DonationMethod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_donation_methods")
    .select("id, method, label, details")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (data as DonationMethod[]) ?? [];
}

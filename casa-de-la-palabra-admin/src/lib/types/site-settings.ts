export interface SiteSettingsRow {
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
  devotional_enabled: boolean;
  devotional_title: string;
  donation_cta_title: string;
  maintenance_mode: boolean;
}

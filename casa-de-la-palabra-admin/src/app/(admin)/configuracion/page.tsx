import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/settings-form";
import type { SiteSettingsRow } from "@/lib/types/site-settings";

export const metadata = { title: "Configuración" };

const DEFAULTS: SiteSettingsRow = {
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
  devotional_enabled: false,
  devotional_title: "Devocional de hoy",
  donation_cta_title: "Tu apoyo nos ayuda a llevar la Palabra más lejos.",
  maintenance_mode: false,
};

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_site_settings")
    .select(
      "id, site_name, logo_url, primary_color, accent_color, dark_mode_enabled, hero_title, hero_subtitle, hero_primary_cta_label, hero_primary_cta_href, hero_secondary_cta_label, hero_secondary_cta_href, devotional_enabled, devotional_title, donation_cta_title, maintenance_mode"
    )
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Cuenta</p>
      <h1 className="mt-1 font-display text-2xl font-medium">Configuración</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Controla lo que se muestra en la web pública: portada, devocional, donaciones y
        mantenimiento.
      </p>

      <div className="mt-8">
        <SettingsForm initial={(data as SiteSettingsRow) ?? DEFAULTS} />
      </div>
    </div>
  );
}

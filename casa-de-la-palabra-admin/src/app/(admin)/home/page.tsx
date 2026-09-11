import { PageShell, BuildingNotice } from "@/components/admin/page-shell";

export const metadata = { title: "Home" };

export default function HomeAdminPage() {
  return (
    <PageShell
      eyebrow="Sitio"
      title="Home"
      description="Edición de la portada, secciones destacadas y contenido relacionado."
    >
      <BuildingNotice label="El editor visual de la Home" />
      <p className="mt-4 text-sm text-muted-foreground">
        El hero, el CTA de donaciones y el devocional ya se editan desde{" "}
        <span className="font-medium text-foreground">Cuenta → Configuración</span> y{" "}
        <span className="font-medium text-foreground">Sitio → Devocionales</span>.
      </p>
    </PageShell>
  );
}

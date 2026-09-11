import { PageShell, BuildingNotice } from "@/components/admin/page-shell";

export const metadata = { title: "Navegación y footer" };

export default function NavegacionAdminPage() {
  return (
    <PageShell
      eyebrow="Sitio"
      title="Navegación y footer"
      description="Menú principal, dropdowns, columnas del footer y redes sociales."
    >
      <BuildingNotice label="El editor de navegación y footer" />
    </PageShell>
  );
}

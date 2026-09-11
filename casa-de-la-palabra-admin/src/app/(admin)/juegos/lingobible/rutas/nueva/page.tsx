import { PageShell } from "@/components/admin/page-shell";
import { PathForm } from "@/components/admin/lingobible/path-form";

export const metadata = { title: "Nueva ruta" };

export default function NuevaRutaPage() {
  return (
    <PageShell eyebrow="Juegos → LINGOBIBLE" title="Nueva ruta">
      <PathForm
        initial={{
          slug: "",
          title: "",
          description: "",
          icon_url: "",
          position: 0,
          status: "draft",
        }}
      />
    </PageShell>
  );
}

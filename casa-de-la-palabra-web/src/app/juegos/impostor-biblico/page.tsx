import { PageHeader } from "@/components/layout/page-header";
import { ImpostorHome } from "@/components/impostor/impostor-home";

export const metadata = { title: "El Impostor Bíblico" };

export default function ImpostorBiblicoPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Juegos"
        title="El Impostor Bíblico"
        description="Un juego de deducción social con temática bíblica. Todos reciben la misma palabra secreta… menos el impostor."
      />
      <ImpostorHome />
    </div>
  );
}

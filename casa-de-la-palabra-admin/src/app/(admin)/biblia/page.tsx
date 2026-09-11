import { PageShell, BuildingNotice } from "@/components/admin/page-shell";

export const metadata = { title: "Biblia y traducciones" };

export default function BibliaAdminPage() {
  return (
    <PageShell
      eyebrow="Contenido"
      title="Biblia y traducciones"
      description="Administra idiomas, traducciones, licencias y referencias cruzadas."
    >
      <BuildingNotice label="El importador de traducciones y el editor de referencias cruzadas" />
    </PageShell>
  );
}

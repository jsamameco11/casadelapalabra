import { PageShell } from "@/components/admin/page-shell";
import { WordForm } from "@/components/admin/impostor/word-form";

export const metadata = { title: "Nueva palabra" };

export default function NuevaPalabraPage() {
  return (
    <PageShell eyebrow="Juegos → El Impostor Bíblico" title="Nueva palabra">
      <WordForm initial={{ category_id: "", word: "", hint_reference: "", status: "draft" }} />
    </PageShell>
  );
}

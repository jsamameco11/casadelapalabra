import { PageShell } from "@/components/admin/page-shell";
import { DevotionalForm } from "@/components/admin/devotional-form";

export const metadata = { title: "Nuevo devocional" };

export default function NuevoDevocionalPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <PageShell eyebrow="Sitio" title="Nuevo devocional">
      <DevotionalForm
        initial={{
          title: "",
          body: "",
          verse_reference: "",
          verse_text: "",
          publish_date: today,
          status: "draft",
          ai_generated: false,
        }}
      />
    </PageShell>
  );
}

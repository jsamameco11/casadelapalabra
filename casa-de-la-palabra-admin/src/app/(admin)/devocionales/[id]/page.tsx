import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { DevotionalForm } from "@/components/admin/devotional-form";

export default async function EditarDevocionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_devotionals")
    .select("id, title, body, verse_reference, verse_text, publish_date, status, ai_generated")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Sitio" title="Editar devocional">
      <DevotionalForm
        initial={{
          id: data.id,
          title: data.title,
          body: data.body,
          verse_reference: data.verse_reference ?? "",
          verse_text: data.verse_text ?? "",
          publish_date: data.publish_date,
          status: data.status,
          ai_generated: data.ai_generated,
        }}
      />
    </PageShell>
  );
}

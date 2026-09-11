import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { BadgeForm } from "@/components/admin/gamificacion/badge-form";

export default async function EditarInsigniaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_badges")
    .select("id, slug, name, description, icon_url, criteria, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → Gamificación" title="Editar insignia">
      <BadgeForm
        initial={{
          id: data.id,
          slug: data.slug,
          name: data.name,
          description: data.description ?? "",
          icon_url: data.icon_url ?? "",
          criteria: JSON.stringify(data.criteria ?? {}, null, 2),
          is_active: data.is_active,
        }}
      />
    </PageShell>
  );
}

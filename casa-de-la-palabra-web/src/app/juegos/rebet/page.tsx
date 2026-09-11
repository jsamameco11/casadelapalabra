import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { RebetSetup } from "@/components/rebet/rebet-setup";

export const metadata = { title: "REBET" };

export default async function RebetPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_rebet_categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (
    <div>
      <PageHeader
        eyebrow="Juegos"
        title="REBET"
        description="Elige una categoría, una dificultad y pon a prueba tus conocimientos bíblicos."
      />
      <RebetSetup categories={data ?? []} />
    </div>
  );
}

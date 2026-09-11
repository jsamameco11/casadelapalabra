import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { WordForm } from "@/components/admin/impostor/word-form";

export default async function EditarPalabraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_impostor_words")
    .select("id, category_id, word, hint_reference, status")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <PageShell eyebrow="Juegos → El Impostor Bíblico" title="Editar palabra">
      <WordForm
        initial={{
          id: data.id,
          category_id: data.category_id,
          word: data.word,
          hint_reference: data.hint_reference ?? "",
          status: data.status,
        }}
      />
    </PageShell>
  );
}

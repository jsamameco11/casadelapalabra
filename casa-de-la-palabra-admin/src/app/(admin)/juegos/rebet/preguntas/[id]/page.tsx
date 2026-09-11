import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { QuestionForm } from "@/components/admin/rebet/question-form";

export default async function EditarPreguntaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: q } = await supabase
    .from("casa_rebet_questions")
    .select("id, category_id, difficulty, question, explanation, bible_reference, time_limit_seconds, base_points, image_url, audio_url, status")
    .eq("id", id)
    .maybeSingle();

  if (!q) notFound();

  const { data: options } = await supabase
    .from("casa_rebet_question_options")
    .select("label, option_text, is_correct")
    .eq("question_id", id)
    .order("position");

  const ordered = ["A", "B", "C", "D"].map((label) => options?.find((o) => o.label === label)?.option_text ?? "");
  const correctIndex = Math.max(
    0,
    ["A", "B", "C", "D"].findIndex((label) => options?.find((o) => o.label === label)?.is_correct)
  );

  return (
    <PageShell eyebrow="Juegos → REBET" title="Editar pregunta">
      <QuestionForm
        initial={{
          id: q.id,
          category_id: q.category_id,
          difficulty: q.difficulty,
          question: q.question,
          explanation: q.explanation ?? "",
          bible_reference: q.bible_reference ?? "",
          time_limit_seconds: q.time_limit_seconds,
          base_points: q.base_points,
          image_url: q.image_url ?? "",
          audio_url: q.audio_url ?? "",
          status: q.status,
          options: ordered as [string, string, string, string],
          correctIndex,
        }}
      />
    </PageShell>
  );
}

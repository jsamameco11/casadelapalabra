import { PageShell } from "@/components/admin/page-shell";
import { QuestionForm } from "@/components/admin/rebet/question-form";

export const metadata = { title: "Nueva pregunta" };

export default function NuevaPreguntaPage() {
  return (
    <PageShell eyebrow="Juegos → REBET" title="Nueva pregunta">
      <QuestionForm
        initial={{
          category_id: "",
          difficulty: "medium",
          question: "",
          explanation: "",
          bible_reference: "",
          time_limit_seconds: 20,
          base_points: 1000,
          image_url: "",
          audio_url: "",
          status: "draft",
          options: ["", "", "", ""],
          correctIndex: 0,
        }}
      />
    </PageShell>
  );
}

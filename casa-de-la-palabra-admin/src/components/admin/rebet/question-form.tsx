"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export interface QuestionFormValues {
  id?: string;
  category_id: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  question: string;
  explanation: string;
  bible_reference: string;
  time_limit_seconds: number;
  base_points: number;
  image_url: string;
  audio_url: string;
  status: "draft" | "published" | "archived";
  options: [string, string, string, string];
  correctIndex: number;
}

const LABELS = ["A", "B", "C", "D"] as const;

export function QuestionForm({ initial }: { initial: QuestionFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_rebet_categories")
      .select("id, name")
      .order("position")
      .then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof QuestionFormValues>(key: K, value: QuestionFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setOption(i: number, text: string) {
    const next = [...values.options] as QuestionFormValues["options"];
    next[i] = text;
    set("options", next);
  }

  async function save() {
    if (!values.question.trim() || !values.category_id) {
      setError("Pregunta y categoría son obligatorias.");
      return;
    }
    if (values.options.some((o) => !o.trim())) {
      setError("Las 4 opciones son obligatorias.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      category_id: values.category_id,
      difficulty: values.difficulty,
      question: values.question.trim(),
      explanation: values.explanation.trim() || null,
      bible_reference: values.bible_reference.trim() || null,
      time_limit_seconds: values.time_limit_seconds,
      base_points: values.base_points,
      image_url: values.image_url.trim() || null,
      audio_url: values.audio_url.trim() || null,
      status: values.status,
    };

    let questionId = values.id;
    if (questionId) {
      const { error } = await supabase.from("casa_rebet_questions").update(payload).eq("id", questionId);
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
      await supabase.from("casa_rebet_question_options").delete().eq("question_id", questionId);
    } else {
      const { data, error } = await supabase.from("casa_rebet_questions").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        setError(error?.message ?? "No se pudo crear la pregunta.");
        return;
      }
      questionId = data.id;
    }

    const optionRows = values.options.map((text, i) => ({
      question_id: questionId,
      label: LABELS[i],
      option_text: text.trim(),
      is_correct: i === values.correctIndex,
      position: i + 1,
    }));
    const { error: optError } = await supabase.from("casa_rebet_question_options").insert(optionRows);

    setSaving(false);
    if (optError) {
      setError(optError.message);
      return;
    }
    router.push("/juegos/rebet/preguntas");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar esta pregunta?")) return;
    await supabase.from("casa_rebet_questions").delete().eq("id", values.id);
    router.push("/juegos/rebet/preguntas");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Label>Pregunta</Label>
        <textarea
          value={values.question}
          onChange={(e) => set("question", e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <Label>Opciones (marca la correcta)</Label>
        <div className="space-y-2">
          {values.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={values.correctIndex === i}
                onChange={() => set("correctIndex", i)}
                className="shrink-0"
              />
              <span className="w-5 shrink-0 text-sm font-semibold text-muted-foreground">{LABELS[i]}</span>
              <input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Explicación (se muestra después de responder)</Label>
        <textarea
          value={values.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Categoría</Label>
          <select
            value={values.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Dificultad</Label>
          <select
            value={values.difficulty}
            onChange={(e) => set("difficulty", e.target.value as QuestionFormValues["difficulty"])}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Intermedio</option>
            <option value="hard">Difícil</option>
            <option value="expert">Experto</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Referencia bíblica</Label>
        <input
          value={values.bible_reference}
          onChange={(e) => set("bible_reference", e.target.value)}
          placeholder="Génesis 6-9"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tiempo límite (segundos)</Label>
          <input
            type="number"
            value={values.time_limit_seconds}
            onChange={(e) => set("time_limit_seconds", Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <Label>Puntos base</Label>
          <input
            type="number"
            value={values.base_points}
            onChange={(e) => set("base_points", Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Imagen (opcional)</Label>
          <ImageUploadField value={values.image_url} onChange={(v) => set("image_url", v)} folder="rebet" />
        </div>
        <div>
          <Label>Audio (URL, opcional)</Label>
          <input
            value={values.audio_url}
            onChange={(e) => set("audio_url", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <Label>Estado</Label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as QuestionFormValues["status"])}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicada</option>
          <option value="archived">Archivada</option>
        </select>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button onClick={save} disabled={saving} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {values.id && (
          <button onClick={remove} className="text-sm text-danger hover:underline">
            Eliminar
          </button>
        )}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-medium text-muted-foreground">{children}</p>;
}

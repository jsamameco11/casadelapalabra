"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ExerciseOption {
  id: string;
  option_text: string;
}

interface Exercise {
  id: string;
  exercise_type: string;
  prompt: string;
  options: ExerciseOption[];
}

type Phase = "loading" | "auth_required" | "playing" | "answered" | "finished" | "error";

export function LingobibleLesson({ lessonId }: { lessonId: string }) {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>("loading");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [stars, setStars] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhase("auth_required");
        return;
      }

      const { data: exerciseRows } = await supabase
        .from("casa_lingobible_exercises_public")
        .select("id, exercise_type, prompt, position")
        .eq("lesson_id", lessonId)
        .order("position", { ascending: true });

      if (!exerciseRows || exerciseRows.length === 0) {
        setErrorMsg("Esta lección todavía no tiene ejercicios publicados.");
        setPhase("error");
        return;
      }

      const ids = exerciseRows.map((e) => e.id);
      const { data: options } = await supabase
        .from("casa_lingobible_exercise_options_public")
        .select("id, exercise_id, option_text, position")
        .in("exercise_id", ids)
        .order("position", { ascending: true });

      setExercises(
        exerciseRows.map((e) => ({
          id: e.id,
          exercise_type: e.exercise_type,
          prompt: e.prompt,
          options: (options ?? []).filter((o) => o.exercise_id === e.id),
        }))
      );
      setPhase("playing");
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function answer(value: unknown, optionId?: string) {
    if (phase !== "playing") return;
    setSelected(optionId ?? null);
    const current = exercises[index];
    const { data, error } = await supabase.rpc("casa_lingobible_submit_exercise", {
      p_exercise_id: current.id,
      p_answer: value,
    });
    if (error) {
      setErrorMsg(error.message);
      setPhase("error");
      return;
    }
    setLastCorrect(Boolean(data));
    if (data) setCorrectCount((c) => c + 1);
    setPhase("answered");
  }

  async function next() {
    if (index + 1 >= exercises.length) {
      const { data } = await supabase.rpc("casa_lingobible_complete_lesson", { p_lesson_id: lessonId });
      setStars(data?.stars ?? 0);
      const { data: rewards } = await supabase
        .from("casa_lingobible_rewards")
        .select("xp_awarded")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setXpAwarded(rewards?.xp_awarded ?? 0);
      setPhase("finished");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setLastCorrect(null);
    setPhase("playing");
  }

  if (phase === "loading") return <Status message="Cargando lección…" />;
  if (phase === "auth_required")
    return (
      <Status message="Inicia sesión para hacer esta lección y guardar tu progreso.">
        <Link href="/login" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
          Iniciar sesión
        </Link>
      </Status>
    );
  if (phase === "error") return <Status message={errorMsg} />;

  if (phase === "finished") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-5xl">{"★".repeat(stars) || "…"}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {correctCount} / {exercises.length} correctas
        </p>
        <p className="mt-2 text-sm font-medium text-primary">+{xpAwarded} XP</p>
        <Link href="/juegos/lingobible" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Volver al camino
        </Link>
      </div>
    );
  }

  const current = exercises[index];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${((index + 1) / exercises.length) * 100}%` }} />
      </div>

      <h1 className="mt-8 font-display text-xl font-medium sm:text-2xl">{current.prompt}</h1>

      {current.exercise_type === "true_false" ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <OptionButton
            label="Verdadero"
            disabled={phase === "answered"}
            active={selected === "true"}
            onClick={() => answer({ answer: true }, "true")}
          />
          <OptionButton
            label="Falso"
            disabled={phase === "answered"}
            active={selected === "false"}
            onClick={() => answer({ answer: false }, "false")}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {current.options.map((opt, i) => (
            <OptionButton
              key={opt.id}
              label={opt.option_text}
              disabled={phase === "answered"}
              active={selected === opt.id}
              onClick={() => answer({ correct_option_index: i }, opt.id)}
            />
          ))}
        </div>
      )}

      {phase === "answered" && (
        <div className="mt-6 rounded-2xl bg-muted p-5">
          <p className="text-sm font-semibold">{lastCorrect ? "¡Correcto!" : "Sigue intentando"}</p>
          <button onClick={next} className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">
            {index + 1 >= exercises.length ? "Terminar lección" : "Continuar"}
          </button>
        </div>
      )}
    </div>
  );
}

function OptionButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border px-5 py-4 text-left text-sm transition-colors ${
        active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function Status({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

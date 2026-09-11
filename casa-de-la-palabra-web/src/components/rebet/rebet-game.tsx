"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface QuestionOption {
  id: string;
  label: string;
  option_text: string;
}

interface Question {
  id: string;
  question: string;
  bible_reference: string | null;
  time_limit_seconds: number;
  options: QuestionOption[];
}

interface AnswerResult {
  is_correct: boolean;
  points_awarded: number;
  correct_option_id: string;
  explanation: string | null;
}

interface FinalResult {
  score: number;
  correct_count: number;
  incorrect_count: number;
  accuracy: number;
  max_streak: number;
  xp_awarded: number;
  total_questions: number;
}

type Phase = "loading" | "auth_required" | "playing" | "answered" | "finished" | "error";

export function RebetGame() {
  const params = useSearchParams();
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [errorMsg, setErrorMsg] = useState("");
  const startedAtRef = useRef<number>(0);

  const categorySlug = params.get("category") ?? "";
  const difficulty = params.get("difficulty") ?? "medium";
  const count = Number(params.get("count") ?? 10);

  useEffect(() => {
    async function init() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setPhase("auth_required");
        return;
      }
      setUser(authUser);

      const { data: category } = await supabase
        .from("casa_rebet_categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (!category) {
        setErrorMsg("Categoría no encontrada.");
        setPhase("error");
        return;
      }

      const { data: questionRows } = await supabase
        .from("casa_rebet_questions_public")
        .select("id")
        .eq("category_id", category.id)
        .eq("difficulty", difficulty)
        .limit(count * 3);

      if (!questionRows || questionRows.length === 0) {
        setErrorMsg("No hay preguntas publicadas para esta combinación todavía.");
        setPhase("error");
        return;
      }

      const shuffled = [...questionRows].sort(() => Math.random() - 0.5).slice(0, count);
      const questionIds = shuffled.map((q) => q.id);

      const { data: game, error: gameError } = await supabase
        .from("casa_rebet_games")
        .insert({
          user_id: authUser.id,
          mode: "solo",
          category_id: category.id,
          difficulty,
          question_ids: questionIds,
        })
        .select("id")
        .single();

      if (gameError || !game) {
        setErrorMsg("No se pudo crear la partida.");
        setPhase("error");
        return;
      }

      const { data: fullQuestions } = await supabase
        .from("casa_rebet_questions_public")
        .select("id, question, bible_reference, time_limit_seconds")
        .in("id", questionIds);

      const { data: options } = await supabase
        .from("casa_rebet_question_options_public")
        .select("id, question_id, label, option_text")
        .in("question_id", questionIds);

      const ordered: Question[] = questionIds.map((id) => {
        const q = fullQuestions!.find((f) => f.id === id)!;
        return {
          id: q.id,
          question: q.question,
          bible_reference: q.bible_reference,
          time_limit_seconds: q.time_limit_seconds,
          options: (options ?? [])
            .filter((o) => o.question_id === id)
            .sort((a, b) => a.label.localeCompare(b.label)),
        };
      });

      setGameId(game.id);
      setQuestions(ordered);
      setTimeLeft(ordered[0]?.time_limit_seconds ?? 20);
      startedAtRef.current = Date.now();
      setPhase("playing");
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      submitAnswer(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  async function submitAnswer(optionId: string | null) {
    if (phase !== "playing" || !gameId) return;
    setSelected(optionId);
    setPhase("answered");
    const responseTimeMs = Date.now() - startedAtRef.current;
    const current = questions[index];

    const { data, error } = await supabase.rpc("casa_rebet_submit_answer", {
      p_game_id: gameId,
      p_question_id: current.id,
      p_selected_option_id: optionId,
      p_response_time_ms: responseTimeMs,
    });

    if (error) {
      setErrorMsg(error.message);
      setPhase("error");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setResult(row as AnswerResult);
    setScore((s) => s + (row?.points_awarded ?? 0));
  }

  async function next() {
    if (index + 1 >= questions.length) {
      const { data } = await supabase.rpc("casa_rebet_finish_game", { p_game_id: gameId });
      setFinalResult(data as FinalResult);
      setPhase("finished");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setSelected(null);
    setResult(null);
    setTimeLeft(questions[nextIndex].time_limit_seconds);
    startedAtRef.current = Date.now();
    setPhase("playing");
  }

  if (phase === "loading") {
    return <StatusScreen message="Preparando tu partida…" />;
  }

  if (phase === "auth_required") {
    return (
      <StatusScreen message="Inicia sesión para jugar REBET y guardar tu puntaje.">
        <Link href="/login" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
          Iniciar sesión
        </Link>
      </StatusScreen>
    );
  }

  if (phase === "error") {
    return <StatusScreen message={errorMsg} />;
  }

  if (phase === "finished" && finalResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Resultado</p>
        <p className="mt-3 font-display text-4xl font-medium">{finalResult.score.toLocaleString()}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <Stat label="Correctas" value={finalResult.correct_count} />
          <Stat label="Incorrectas" value={finalResult.incorrect_count} />
          <Stat label="Precisión" value={`${finalResult.accuracy}%`} />
          <Stat label="Racha máxima" value={finalResult.max_streak} />
        </div>
        <p className="mt-6 text-sm text-primary">+{finalResult.xp_awarded} XP</p>
        <Link href="/juegos/rebet" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Jugar de nuevo
        </Link>
      </div>
    );
  }

  const current = questions[index];
  if (!current) return <StatusScreen message="Cargando pregunta…" />;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Pregunta {index + 1} / {questions.length}
        </span>
        <span className="font-semibold text-primary">{timeLeft}s</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(timeLeft / current.time_limit_seconds) * 100}%` }}
        />
      </div>

      <h1 className="mt-8 font-display text-xl font-medium sm:text-2xl">{current.question}</h1>

      <div className="mt-6 grid gap-3">
        {current.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrectAnswer = result && opt.id === result.correct_option_id;
          const isWrongSelected = result && isSelected && !result.is_correct;
          return (
            <button
              key={opt.id}
              disabled={phase === "answered"}
              onClick={() => submitAnswer(opt.id)}
              className={`rounded-2xl border px-5 py-4 text-left text-sm transition-colors ${
                isCorrectAnswer
                  ? "border-green-600 bg-green-600/10"
                  : isWrongSelected
                  ? "border-red-600 bg-red-600/10"
                  : isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="mr-2 font-semibold text-muted-foreground">{opt.label}.</span>
              {opt.option_text}
            </button>
          );
        })}
      </div>

      {result && (
        <div className="mt-6 rounded-2xl bg-muted p-5">
          <p className="text-sm font-semibold">
            {result.is_correct ? "¡Correcto!" : "Incorrecto"} · +{result.points_awarded} pts
          </p>
          {result.explanation && <p className="mt-2 text-sm text-foreground/80">{result.explanation}</p>}
          {current.bible_reference && (
            <p className="mt-2 text-xs font-medium text-primary">{current.bible_reference}</p>
          )}
          <button
            onClick={next}
            className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            {index + 1 >= questions.length ? "Ver resultados" : "Siguiente"}
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">Puntaje acumulado: {score}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusScreen({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

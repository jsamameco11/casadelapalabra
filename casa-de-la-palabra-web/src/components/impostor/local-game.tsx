"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconPhone } from "@/components/impostor/icons";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface RoundPlayer {
  name: string;
  isImpostor: boolean;
}

interface WordPick {
  word_id: string;
  word: string;
  hint_reference: string | null;
  category_name: string;
}

type Phase = "setup" | "reveal-prompt" | "card" | "clues" | "voting" | "result";

const CLUE_ROUNDS = 2;

export function LocalGame() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("mixed");
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [impostorCount, setImpostorCount] = useState(1);
  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState("");

  const [players, setPlayers] = useState<RoundPlayer[]>([]);
  const [wordPick, setWordPick] = useState<WordPick | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [clueRound, setClueRound] = useState(1);
  const [clueTurn, setClueTurn] = useState(0);
  const [suspectIndex, setSuspectIndex] = useState<number | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  useEffect(() => {
    supabase
      .from("casa_impostor_categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  function addPlayer() {
    setNames((prev) => [...prev, ""]);
  }

  function removePlayer(i: number) {
    setNames((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function startRound() {
    setError("");
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);
    if (cleanNames.length < 3) {
      setError("Se necesitan al menos 3 jugadores.");
      return;
    }
    if (impostorCount >= cleanNames.length) {
      setError("Demasiados impostores para esta cantidad de jugadores.");
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("casa_impostor_random_word", {
      p_category_slug: category,
    });
    const pick = Array.isArray(data) ? data[0] : data;
    if (rpcError || !pick) {
      setError("No hay palabras publicadas para esta categoría.");
      return;
    }

    const shuffled = [...cleanNames].sort(() => Math.random() - 0.5);
    const impostorSet = new Set(shuffled.slice(0, impostorCount));
    const roundPlayers = cleanNames.map((name) => ({ name, isImpostor: impostorSet.has(name) }));

    setPlayers(roundPlayers);
    setWordPick(pick as WordPick);
    setRevealIndex(0);
    setClueRound(1);
    setClueTurn(0);
    setSuspectIndex(null);
    setXpAwarded(false);
    setPhase("reveal-prompt");
  }

  function confirmSeen() {
    if (revealIndex + 1 >= players.length) {
      setPhase("clues");
    } else {
      setRevealIndex((i) => i + 1);
      setPhase("reveal-prompt");
    }
  }

  function nextClueTurn() {
    if (clueTurn + 1 >= players.length) {
      if (clueRound >= CLUE_ROUNDS) {
        setPhase("voting");
      } else {
        setClueRound((r) => r + 1);
        setClueTurn(0);
      }
    } else {
      setClueTurn((t) => t + 1);
    }
  }

  async function reveal() {
    setPhase("result");
    if (wordPick && !xpAwarded) {
      const { error } = await supabase.rpc("casa_impostor_complete_local_round", {
        p_word_id: wordPick.word_id,
      });
      if (!error) setXpAwarded(true);
    }
  }

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
        <IconPhone className="h-8 w-8 text-primary" />
        <h1 className="mt-3 font-display text-2xl font-medium">Un solo celular</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa a los jugadores presentes. El teléfono se irá pasando para que cada uno vea su
          carta en privado.
        </p>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Categoría</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
          >
            <option value="mixed">Mixta</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Número de impostores</p>
          <div className="flex gap-2">
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setImpostorCount(n)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  impostorCount === n ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Jugadores</p>
          <div className="space-y-2">
            {names.map((name, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Jugador ${i + 1}`}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
                {names.length > 3 && (
                  <button onClick={() => removePlayer(i)} className="px-2 text-sm text-muted-foreground">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addPlayer} className="mt-2 text-sm text-primary hover:underline">
            + Agregar jugador
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={startRound}
          className="mt-8 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Repartir cartas
        </button>
      </div>
    );
  }

  if (phase === "reveal-prompt" || phase === "card") {
    const player = players[revealIndex];
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center sm:px-6">
        {phase === "reveal-prompt" ? (
          <>
            <p className="text-sm text-muted-foreground">Jugador {revealIndex + 1} de {players.length}</p>
            <h2 className="mt-2 font-display text-2xl font-medium">Pasa el teléfono a</h2>
            <p className="mt-1 text-3xl font-semibold text-primary">{player.name}</p>
            <button
              onClick={() => setPhase("card")}
              className="mt-8 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Ver mi carta
            </button>
          </>
        ) : (
          <>
            {player.isImpostor ? (
              <div className="rounded-3xl border-2 border-accent bg-card p-10">
                <p className="font-display text-2xl font-medium text-accent">Eres el impostor</p>
                <p className="mt-2 text-sm text-foreground/70">Categoría: {wordPick?.category_name}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  No conoces la palabra secreta. Escucha con atención y trata de mezclarte.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-primary bg-card p-10">
                <p className="text-xs uppercase tracking-widest text-accent">{wordPick?.category_name}</p>
                <p className="mt-2 font-display text-3xl font-medium">{wordPick?.word}</p>
                <p className="mt-3 text-xs text-muted-foreground">No digas esta palabra en voz alta.</p>
              </div>
            )}
            <button
              onClick={confirmSeen}
              className="mt-8 rounded-full border border-border px-8 py-3.5 text-sm font-medium hover:bg-muted"
            >
              Ocultar y continuar
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === "clues") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Ronda de pistas {clueRound} / {CLUE_ROUNDS}
        </p>
        <h2 className="mt-3 font-display text-2xl font-medium">Turno de</h2>
        <p className="mt-1 text-3xl font-semibold text-primary">{players[clueTurn].name}</p>
        <p className="mt-4 max-w-xs text-sm text-foreground/70">
          Dice en voz alta una palabra o pista corta relacionada con la palabra secreta, sin decirla.
        </p>
        <button
          onClick={nextClueTurn}
          className="mt-8 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Siguiente turno
        </button>
      </div>
    );
  }

  if (phase === "voting") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center sm:px-6">
        <h2 className="font-display text-2xl font-medium">¿A quién señaló el grupo?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Discutan en voz alta y elijan entre todos a quién creen que es el impostor.
        </p>
        <div className="mt-6 grid gap-2">
          {players.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setSuspectIndex(i)}
              className={`rounded-2xl border px-5 py-3 text-sm ${
                suspectIndex === i ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={reveal}
          disabled={suspectIndex === null}
          className="mt-8 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          Revelar resultado
        </button>
      </div>
    );
  }

  const suspect = suspectIndex !== null ? players[suspectIndex] : null;
  const caught = suspect?.isImpostor ?? false;
  const impostors = players.filter((p) => p.isImpostor);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Resultado</p>
      <h2 className="mt-2 font-display text-2xl font-medium">
        {caught ? "¡El grupo descubrió al impostor!" : "El impostor escapó"}
      </h2>
      <p className="mt-3 text-sm text-foreground/70">
        {impostors.length === 1 ? "El impostor era" : "Los impostores eran"}:{" "}
        <strong>{impostors.map((p) => p.name).join(", ")}</strong>
      </p>
      <div className="mt-5 rounded-2xl bg-muted p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Palabra secreta</p>
        <p className="mt-1 font-display text-xl font-medium">{wordPick?.word}</p>
        {wordPick?.hint_reference && <p className="mt-1 text-sm text-primary">{wordPick.hint_reference}</p>}
      </div>
      {xpAwarded && <p className="mt-4 text-sm text-primary">+20 XP por participar</p>}

      <div className="mt-8 flex flex-col gap-2">
        <button
          onClick={startRound}
          className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Otra ronda con los mismos jugadores
        </button>
        <Link
          href="/juegos/impostor-biblico"
          className="rounded-full border border-border py-3 text-sm font-medium hover:bg-muted"
        >
          Volver
        </Link>
      </div>
    </div>
  );
}

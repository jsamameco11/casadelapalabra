"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIFFICULTIES = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Intermedio" },
  { value: "hard", label: "Difícil" },
  { value: "expert", label: "Experto" },
];

const COUNTS = [5, 10, 15, 20];

export function RebetSetup({ categories }: { categories: { id: string; slug: string; name: string }[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(categories[0]?.slug ?? "");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(10);

  function start() {
    const params = new URLSearchParams({ category, difficulty, count: String(count) });
    router.push(`/juegos/rebet/jugar?${params.toString()}`);
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Aún no hay categorías publicadas. Se configuran desde el panel de control.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-medium">Categoría</p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              category === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="mt-8 mb-3 text-sm font-medium">Dificultad</p>
      <div className="flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => setDifficulty(d.value)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              difficulty === d.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="mt-8 mb-3 text-sm font-medium">Cantidad de preguntas</p>
      <div className="flex flex-wrap gap-2">
        {COUNTS.map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              count === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={start}
        className="mt-10 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Crear partida
      </button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

export function RebetQuestionsFilter({
  categories,
  selectedCategory,
  selectedDifficulty,
}: {
  categories: { id: string; slug: string; name: string }[];
  selectedCategory?: string;
  selectedDifficulty?: string;
}) {
  const router = useRouter();

  function updateParam(key: "category" | "difficulty", value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/juegos/rebet/preguntas?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={selectedCategory ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="rounded-full border border-border bg-card px-4 py-2 text-sm"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={selectedDifficulty ?? ""}
        onChange={(e) => updateParam("difficulty", e.target.value)}
        className="rounded-full border border-border bg-card px-4 py-2 text-sm"
      >
        <option value="">Todas las dificultades</option>
        <option value="easy">Fácil</option>
        <option value="medium">Intermedio</option>
        <option value="hard">Difícil</option>
        <option value="expert">Experto</option>
      </select>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

interface Category {
  id: string;
  slug: string;
  name: string;
}

export function WordsFilter({
  categories,
  selectedCategory,
  selectedStatus,
}: {
  categories: Category[];
  selectedCategory?: string;
  selectedStatus?: string;
}) {
  const router = useRouter();

  function updateParam(key: "category" | "status", value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/juegos/impostor-biblico/palabras?${params.toString()}`);
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
        value={selectedStatus ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-full border border-border bg-card px-4 py-2 text-sm"
      >
        <option value="">Todos los estados</option>
        <option value="published">Publicada</option>
        <option value="draft">Borrador</option>
        <option value="archived">Archivada</option>
      </select>
    </div>
  );
}

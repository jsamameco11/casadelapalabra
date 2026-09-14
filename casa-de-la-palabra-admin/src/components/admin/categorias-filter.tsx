"use client";

import { useRouter } from "next/navigation";
import { MODULE_OPTIONS } from "@/lib/categories";

export function CategoriasFilter({ selectedModule }: { selectedModule?: string }) {
  const router = useRouter();

  function updateParam(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("modulo", value);
    else params.delete("modulo");
    router.push(`/categorias?${params.toString()}`);
  }

  return (
    <select
      value={selectedModule ?? ""}
      onChange={(e) => updateParam(e.target.value)}
      className="rounded-full border border-border bg-card px-4 py-2 text-sm"
    >
      <option value="">Todas las secciones</option>
      {MODULE_OPTIONS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

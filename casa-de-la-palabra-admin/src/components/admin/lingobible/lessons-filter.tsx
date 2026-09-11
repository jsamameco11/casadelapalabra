"use client";

import { useRouter } from "next/navigation";

export function LessonsFilter({
  units,
  selectedUnit,
}: {
  units: { id: string; title: string }[];
  selectedUnit?: string;
}) {
  const router = useRouter();

  function updateParam(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("unit", value);
    else params.delete("unit");
    router.push(`/juegos/lingobible/lecciones?${params.toString()}`);
  }

  return (
    <select
      value={selectedUnit ?? ""}
      onChange={(e) => updateParam(e.target.value)}
      className="rounded-full border border-border bg-card px-4 py-2 text-sm"
    >
      <option value="">Todas las unidades</option>
      {units.map((u) => (
        <option key={u.id} value={u.id}>
          {u.title}
        </option>
      ))}
    </select>
  );
}

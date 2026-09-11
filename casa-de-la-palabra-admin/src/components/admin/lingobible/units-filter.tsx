"use client";

import { useRouter } from "next/navigation";

export function UnitsFilter({
  paths,
  selectedPath,
}: {
  paths: { id: string; title: string }[];
  selectedPath?: string;
}) {
  const router = useRouter();

  function updateParam(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("path", value);
    else params.delete("path");
    router.push(`/juegos/lingobible/unidades?${params.toString()}`);
  }

  return (
    <select
      value={selectedPath ?? ""}
      onChange={(e) => updateParam(e.target.value)}
      className="rounded-full border border-border bg-card px-4 py-2 text-sm"
    >
      <option value="">Todas las rutas</option>
      {paths.map((p) => (
        <option key={p.id} value={p.id}>
          {p.title}
        </option>
      ))}
    </select>
  );
}

"use client";

import { useRouter } from "next/navigation";

interface FilterOption {
  value: string;
  label: string;
}

// Cabecera de las páginas de contenido (Estudios, Videos, Podcast, Cursos,
// Conferencias): título a la izquierda, filtro desplegable a la derecha
// cuando hay algo por lo que filtrar. Sin categorías/niveles, el filtro
// simplemente no se muestra — no hay un desplegable vacío.
export function ContentPageHeader({
  eyebrow,
  title,
  description,
  basePath,
  paramName,
  filterLabel,
  options,
  selected,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  basePath: string;
  paramName: string;
  filterLabel: string;
  options: FilterOption[];
  selected?: string;
}) {
  const router = useRouter();

  function updateParam(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(paramName, value);
    else params.delete(paramName);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-medium sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-xl text-sm text-foreground/70 sm:text-base">{description}</p>}
        </div>

        {options.length > 0 && (
          <select
            value={selected ?? ""}
            onChange={(e) => updateParam(e.target.value)}
            aria-label={filterLabel}
            className="rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">{filterLabel}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

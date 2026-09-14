"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface FilterOption {
  value: string;
  label: string;
}

// Cabecera de las páginas de contenido (Estudios, Videos, Podcast, Cursos,
// Conferencias): título a la izquierda; a la derecha, la búsqueda (si se
// pide) y el filtro desplegable (si hay algo por lo que filtrar). Sin
// categorías/niveles, el filtro simplemente no se muestra — no hay un
// desplegable vacío.
export function ContentPageHeader({
  eyebrow,
  title,
  description,
  basePath,
  paramName,
  filterLabel,
  options,
  selected,
  search,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  basePath: string;
  paramName: string;
  filterLabel: string;
  options: FilterOption[];
  selected?: string;
  search?: { paramName: string; placeholder: string; value?: string };
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search?.value ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El valor puede cambiar por navegación (atrás/adelante, o al limpiar el
  // filtro de nivel) sin que este input dispare el cambio — hay que
  // resincronizar en vez de asumir que el estado local manda siempre.
  useEffect(() => {
    setSearchValue(search?.value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.value]);

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(name, value);
    else params.delete(name);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    if (!search) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam(search.paramName, value.trim()), 400);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-medium sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-xl text-sm text-foreground/70 sm:text-base">{description}</p>}
        </div>

        {(search || options.length > 0) && (
          <div className="flex flex-wrap items-center gap-3">
            {search && (
              <div className="relative">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={search.placeholder}
                  aria-label={search.placeholder}
                  className="w-56 rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary sm:w-64"
                />
              </div>
            )}

            {options.length > 0 && (
              <select
                value={selected ?? ""}
                onChange={(e) => updateParam(paramName, e.target.value)}
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
        )}
      </div>
    </div>
  );
}

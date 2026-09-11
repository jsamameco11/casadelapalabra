"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Translation {
  code: string;
  short_name: string | null;
  name: string;
}

// The two extra controls that belong on a single-verse page only (not the
// chapter view, not the top bar): compare against another version, and show
// the original-language wording. Both are plain URL search params so the
// page itself stays a server component.
export function VerseTools({
  translations,
  currentCode,
  compareCode,
  showOriginal,
  originalAvailable,
  originalLabel,
}: {
  translations: Translation[];
  currentCode: string;
  compareCode: string | null;
  showOriginal: boolean;
  originalAvailable: boolean;
  originalLabel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const compareOptions = translations.filter((t) => t.code !== currentCode);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-sm">
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground">Comparar con</span>
        <select
          value={compareCode ?? ""}
          onChange={(e) => updateParam("compare", e.target.value || null)}
          className="rounded-lg border border-border bg-background px-2 py-1"
        >
          <option value="">— Ninguna —</option>
          {compareOptions.map((t) => (
            <option key={t.code} value={t.code}>
              {t.short_name ?? t.name}
            </option>
          ))}
        </select>
      </label>

      {originalAvailable && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showOriginal}
            onChange={(e) => updateParam("original", e.target.checked ? "1" : null)}
          />
          <span className="text-muted-foreground">Ver {originalLabel}</span>
        </label>
      )}
    </div>
  );
}

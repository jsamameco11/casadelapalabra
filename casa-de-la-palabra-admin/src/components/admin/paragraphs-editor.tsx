"use client";

// A simple multi-paragraph body editor: each paragraph is its own textarea,
// addable/removable, joined with blank lines into one text column on save
// and split back apart on load. Deliberately not a full rich-text editor —
// "at least multiple paragraph blocks" is what was asked for.

export function paragraphsToText(paragraphs: string[]): string {
  return paragraphs.map((p) => p.trim()).filter(Boolean).join("\n\n");
}

export function textToParagraphs(text: string | null | undefined): string[] {
  const parts = (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [""];
}

export function ParagraphsEditor({
  paragraphs,
  onChange,
}: {
  paragraphs: string[];
  onChange: (paragraphs: string[]) => void;
}) {
  function updateAt(i: number, value: string) {
    onChange(paragraphs.map((p, idx) => (idx === i ? value : p)));
  }

  function removeAt(i: number) {
    onChange(paragraphs.filter((_, idx) => idx !== i));
  }

  function add() {
    onChange([...paragraphs, ""]);
  }

  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            value={p}
            onChange={(e) => updateAt(i, e.target.value)}
            rows={3}
            placeholder={`Párrafo ${i + 1}`}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          {paragraphs.length > 1 && (
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="shrink-0 self-start px-2 py-2 text-sm text-muted-foreground hover:text-danger"
              aria-label="Quitar párrafo"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-primary hover:underline">
        + Agregar párrafo
      </button>
    </div>
  );
}

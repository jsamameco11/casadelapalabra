"use client";

import { useRef, useState } from "react";

export function ImageUploadField({
  value,
  onChange,
  folder,
  placeholder,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "studies" | "courses" | "podcasts" | "rebet";
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Eso no es una imagen.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3 transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
            🖼️
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {uploading ? "Subiendo…" : "Arrastra una imagen aquí o haz clic para elegirla"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {value || "JPG, PNG, WebP o GIF, hasta 8 MB"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={value}
          placeholder={placeholder ?? "…o pega una URL"}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs text-muted-foreground outline-none focus:border-primary"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-xs text-muted-foreground hover:text-danger"
          >
            Quitar
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface CategoryFormValues {
  id?: string;
  slug: string;
  name: string;
  position: number;
  is_active: boolean;
}

// Diacritical marks left behind by NFD normalization (e.g. the accent on "í").
// Built from char codes rather than a literal escape to avoid any editor/tool
// silently re-composing the escape back into a literal combining character.
const COMBINING_MARKS = new RegExp("[" + String.fromCharCode(92, 117, 48, 51, 48, 48) + "-" + String.fromCharCode(92, 117, 48, 51, 54, 102) + "]", "g");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryForm({ initial }: { initial: CategoryFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onNameChange(name: string) {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  }

  async function save() {
    if (!values.name.trim() || !values.slug.trim()) {
      setError("Nombre y slug son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      slug: values.slug.trim(),
      name: values.name.trim(),
      position: values.position,
      is_active: values.is_active,
    };

    const { error } = values.id
      ? await supabase.from("casa_impostor_categories").update(payload).eq("id", values.id)
      : await supabase.from("casa_impostor_categories").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/impostor-biblico/categorias");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Nombre</Label>
        <TextInput value={values.name} onChange={onNameChange} placeholder="Personajes bíblicos" />
      </div>
      <div>
        <Label>Slug (identificador usado por el juego)</Label>
        <TextInput
          value={values.slug}
          onChange={(v) => {
            setSlugTouched(true);
            set("slug", slugify(v));
          }}
          placeholder="personajes"
        />
      </div>
      <div>
        <Label>Posición</Label>
        <input
          type="number"
          value={values.position}
          onChange={(e) => set("position", Number(e.target.value))}
          className="w-32 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.is_active} onChange={(e) => set("is_active", e.target.checked)} />
        Categoría activa (visible en el juego)
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-medium text-muted-foreground">{children}</p>;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
    />
  );
}

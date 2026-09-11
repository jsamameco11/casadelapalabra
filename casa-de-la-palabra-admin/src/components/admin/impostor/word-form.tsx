"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface WordFormValues {
  id?: string;
  category_id: string;
  word: string;
  hint_reference: string;
  status: "draft" | "published" | "archived";
}

interface Category {
  id: string;
  name: string;
}

export function WordForm({ initial }: { initial: WordFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_impostor_categories")
      .select("id, name")
      .order("position", { ascending: true })
      .then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof WordFormValues>(key: K, value: WordFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    if (!values.word.trim() || !values.category_id) {
      setError("Palabra y categoría son obligatorias.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      category_id: values.category_id,
      word: values.word.trim(),
      hint_reference: values.hint_reference.trim() || null,
      status: values.status,
    };

    const { error } = values.id
      ? await supabase.from("casa_impostor_words").update(payload).eq("id", values.id)
      : await supabase.from("casa_impostor_words").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/impostor-biblico/palabras");
    router.refresh();
  }

  async function archive() {
    if (!values.id) return;
    if (!confirm("¿Archivar esta palabra? Dejará de aparecer en partidas nuevas, pero se conserva el historial.")) return;
    setSaving(true);
    const { error } = await supabase.from("casa_impostor_words").update({ status: "archived" }).eq("id", values.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/impostor-biblico/palabras");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Categoría</Label>
        <select
          value={values.category_id}
          onChange={(e) => set("category_id", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Palabra secreta</Label>
        <TextInput value={values.word} onChange={(v) => set("word", v)} placeholder="Noé" />
      </div>

      <div>
        <Label>Referencia bíblica (opcional)</Label>
        <TextInput
          value={values.hint_reference}
          onChange={(v) => set("hint_reference", v)}
          placeholder="Génesis 6-9 — déjalo vacío si no hay una cita única y clara"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Se muestra al público solo después de revelar el resultado de la partida. No inventes una
          referencia si el tema no tiene una cita única e inequívoca.
        </p>
      </div>

      <div>
        <Label>Estado</Label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as WordFormValues["status"])}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicada</option>
          <option value="archived">Archivada</option>
        </select>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {values.id && values.status !== "archived" && (
          <button onClick={archive} className="text-sm text-danger hover:underline">
            Archivar (no se borra)
          </button>
        )}
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

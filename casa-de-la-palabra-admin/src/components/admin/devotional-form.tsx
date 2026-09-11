"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface DevotionalFormValues {
  id?: string;
  title: string;
  body: string;
  verse_reference: string;
  verse_text: string;
  publish_date: string;
  status: "draft" | "published";
  ai_generated: boolean;
}

export function DevotionalForm({ initial }: { initial: DevotionalFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof DevotionalFormValues>(key: K, value: DevotionalFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const payload = {
      title: values.title,
      body: values.body,
      verse_reference: values.verse_reference || null,
      verse_text: values.verse_text || null,
      publish_date: values.publish_date,
      status: values.status,
      ai_generated: values.ai_generated,
    };

    const { error } = values.id
      ? await supabase.from("casa_devotionals").update(payload).eq("id", values.id)
      : await supabase.from("casa_devotionals").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/devocionales");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar este devocional?")) return;
    await supabase.from("casa_devotionals").delete().eq("id", values.id);
    router.push("/devocionales");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Label>Título</Label>
        <TextInput value={values.title} onChange={(v) => set("title", v)} />
      </div>
      <div>
        <Label>Fecha de publicación</Label>
        <input
          type="date"
          value={values.publish_date}
          onChange={(e) => set("publish_date", e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>Reflexión</Label>
        <textarea
          value={values.body}
          onChange={(e) => set("body", e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Referencia bíblica</Label>
          <TextInput value={values.verse_reference} onChange={(v) => set("verse_reference", v)} placeholder="Juan 3:16" />
        </div>
        <div>
          <Label>Texto del versículo</Label>
          <TextInput value={values.verse_text} onChange={(v) => set("verse_text", v)} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.ai_generated}
          onChange={(e) => set("ai_generated", e.target.checked)}
        />
        Reflexión generada/explicativa por IA (se mostrará una nota aclaratoria al público)
      </label>

      <div>
        <Label>Estado</Label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as "draft" | "published")}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
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
        {values.id && (
          <button onClick={remove} className="text-sm text-danger hover:underline">
            Eliminar
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

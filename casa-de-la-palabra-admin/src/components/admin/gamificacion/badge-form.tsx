"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

export interface BadgeFormValues {
  id?: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  criteria: string;
  is_active: boolean;
}

export function BadgeForm({ initial }: { initial: BadgeFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof BadgeFormValues>(key: K, value: BadgeFormValues[K]) {
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
    let criteria: unknown;
    try {
      criteria = values.criteria.trim() ? JSON.parse(values.criteria) : {};
    } catch {
      setError('El criterio debe ser JSON válido, por ejemplo: {"type":"streak_days","value":7}');
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      slug: values.slug.trim(),
      name: values.name.trim(),
      description: values.description.trim() || null,
      icon_url: values.icon_url.trim() || null,
      criteria,
      is_active: values.is_active,
    };

    const { error } = values.id
      ? await supabase.from("casa_badges").update(payload).eq("id", values.id)
      : await supabase.from("casa_badges").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/gamificacion/insignias");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar esta insignia?")) return;
    await supabase.from("casa_badges").delete().eq("id", values.id);
    router.push("/juegos/gamificacion/insignias");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Nombre</Label>
        <input
          value={values.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Racha de 7 días"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>Slug</Label>
        <input
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", slugify(e.target.value));
          }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>Descripción</Label>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>Ícono (URL, opcional)</Label>
        <input
          value={values.icon_url}
          onChange={(e) => set("icon_url", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>Criterio (JSON)</Label>
        <textarea
          value={values.criteria}
          onChange={(e) => set("criteria", e.target.value)}
          rows={3}
          placeholder='{"type":"streak_days","value":7}'
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-xs outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Define la condición para otorgar la insignia. El otorgamiento automático según este criterio queda para la
          siguiente fase; por ahora sirve como referencia para el equipo.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.is_active} onChange={(e) => set("is_active", e.target.checked)} />
        Insignia activa
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button onClick={save} disabled={saving} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
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

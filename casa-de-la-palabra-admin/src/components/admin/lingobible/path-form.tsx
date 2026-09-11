"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

export interface PathFormValues {
  id?: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string;
  position: number;
  status: "draft" | "published" | "scheduled" | "archived";
}

export function PathForm({ initial }: { initial: PathFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof PathFormValues>(key: K, value: PathFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onTitleChange(title: string) {
    set("title", title);
    if (!slugTouched) set("slug", slugify(title));
  }

  async function save() {
    if (!values.title.trim() || !values.slug.trim()) {
      setError("Título y slug son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      slug: values.slug.trim(),
      title: values.title.trim(),
      description: values.description.trim() || null,
      icon_url: values.icon_url.trim() || null,
      position: values.position,
      status: values.status,
    };

    const { error } = values.id
      ? await supabase.from("casa_lingobible_paths").update(payload).eq("id", values.id)
      : await supabase.from("casa_lingobible_paths").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/lingobible/rutas");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar esta ruta? Se eliminarán también sus unidades y lecciones.")) return;
    await supabase.from("casa_lingobible_paths").delete().eq("id", values.id);
    router.push("/juegos/lingobible/rutas");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Título</Label>
        <input
          value={values.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Fundamentos de la fe"
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Posición</Label>
          <input
            type="number"
            value={values.position}
            onChange={(e) => set("position", Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <Label>Estado</Label>
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value as PathFormValues["status"])}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="scheduled">Programada</option>
            <option value="archived">Archivada</option>
          </select>
        </div>
      </div>

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

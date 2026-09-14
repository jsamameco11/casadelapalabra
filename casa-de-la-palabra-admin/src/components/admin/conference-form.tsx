"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import { ParagraphsEditor, paragraphsToText, textToParagraphs } from "@/components/admin/paragraphs-editor";

export interface ConferenceFormValues {
  id?: string;
  slug: string;
  title: string;
  speaker: string;
  event_date: string;
  location: string;
  summary: string;
  description: string;
  video_url: string;
  category_id: string;
  status: "draft" | "published" | "archived";
  position: number;
}

export function ConferenceForm({ initial }: { initial: ConferenceFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [values, setValues] = useState(initial);
  const [paragraphs, setParagraphs] = useState(textToParagraphs(initial.description));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_categories")
      .select("id, name")
      .eq("module", "conferences")
      .order("position")
      .then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof ConferenceFormValues>(key: K, value: ConferenceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onTitleChange(title: string) {
    set("title", title);
    if (!slugTouched) set("slug", slugify(title));
  }

  async function save() {
    if (!values.title.trim() || !values.slug.trim() || !values.speaker.trim()) {
      setError("Título, slug y expositor son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      slug: values.slug.trim(),
      title: values.title.trim(),
      speaker: values.speaker.trim(),
      event_date: values.event_date || null,
      location: values.location.trim() || null,
      summary: values.summary.trim() || null,
      description: paragraphsToText(paragraphs),
      video_url: values.video_url.trim() || null,
      category_id: values.category_id || null,
      status: values.status,
      position: values.position,
      published_at: values.status === "published" ? new Date().toISOString() : null,
    };

    const { error } = values.id
      ? await supabase.from("casa_conferences").update(payload).eq("id", values.id)
      : await supabase.from("casa_conferences").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/media/conferencias");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar esta conferencia?")) return;
    await supabase.from("casa_conferences").delete().eq("id", values.id);
    router.push("/media/conferencias");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Label>Título</Label>
        <TextInput value={values.title} onChange={onTitleChange} />
      </div>
      <div>
        <Label>Slug</Label>
        <TextInput
          value={values.slug}
          onChange={(v) => {
            setSlugTouched(true);
            set("slug", slugify(v));
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Expositor</Label>
          <TextInput value={values.speaker} onChange={(v) => set("speaker", v)} />
        </div>
        <div>
          <Label>Fecha</Label>
          <input
            type="date"
            value={values.event_date}
            onChange={(e) => set("event_date", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <Label>Ubicación</Label>
          <TextInput value={values.location} onChange={(v) => set("location", v)} />
        </div>
      </div>
      <div>
        <Label>Video (URL de YouTube, opcional)</Label>
        <TextInput value={values.video_url} onChange={(v) => set("video_url", v)} />
      </div>
      <div>
        <Label>Resumen corto</Label>
        <TextInput value={values.summary} onChange={(v) => set("summary", v)} />
      </div>
      <div>
        <Label>Descripción</Label>
        <ParagraphsEditor paragraphs={paragraphs} onChange={setParagraphs} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Categoría</Label>
          <select
            value={values.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Orden</Label>
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
            onChange={(e) => set("status", e.target.value as ConferenceFormValues["status"])}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
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

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
    />
  );
}

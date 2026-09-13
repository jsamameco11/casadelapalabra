"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import { ParagraphsEditor, paragraphsToText, textToParagraphs } from "@/components/admin/paragraphs-editor";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { MainVerseFields } from "@/components/admin/estudios/main-verse-fields";

export interface StudyFormValues {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  main_verse: string;
  main_verse_book_slug: string;
  main_verse_chapter: string;
  main_verse_verse_start: string;
  main_verse_verse_end: string;
  main_verse_translation_code: string;
  cover_image_url: string;
  social_image_url: string;
  category_id: string;
  level: "beginner" | "intermediate" | "advanced";
  duration_minutes: string;
  status: "draft" | "published" | "archived";
  position: number;
  seo_title: string;
  seo_description: string;
}

// stayOnSave: en la pantalla de edición el constructor está debajo, así que
// guardar no debe sacarte de la página.
export function StudyForm({ initial, stayOnSave }: { initial: StudyFormValues; stayOnSave?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [values, setValues] = useState(initial);
  const [paragraphs, setParagraphs] = useState(textToParagraphs(initial.description));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_categories")
      .select("id, name")
      .eq("module", "studies")
      .order("position")
      .then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof StudyFormValues>(key: K, value: StudyFormValues[K]) {
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
      subtitle: values.subtitle.trim() || null,
      description: paragraphsToText(paragraphs),
      main_verse: values.main_verse.trim() || null,
      main_verse_book_slug: values.main_verse_book_slug || null,
      main_verse_chapter: values.main_verse_chapter ? Number(values.main_verse_chapter) : null,
      main_verse_verse_start: values.main_verse_verse_start ? Number(values.main_verse_verse_start) : null,
      main_verse_verse_end: values.main_verse_verse_end ? Number(values.main_verse_verse_end) : null,
      main_verse_translation_code: values.main_verse_translation_code || null,
      cover_image_url: values.cover_image_url.trim() || null,
      social_image_url: values.social_image_url.trim() || null,
      category_id: values.category_id || null,
      level: values.level,
      duration_minutes: values.duration_minutes ? Number(values.duration_minutes) : null,
      status: values.status,
      position: values.position,
      seo_title: values.seo_title.trim() || null,
      seo_description: values.seo_description.trim() || null,
      published_at: values.status === "published" ? new Date().toISOString() : null,
    };

    if (values.id) {
      const { error } = await supabase.from("casa_studies").update(payload).eq("id", values.id);
      setSaving(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (stayOnSave) {
        setSavedAt(new Date());
        router.refresh();
        return;
      }
      router.push("/estudios");
      router.refresh();
      return;
    }

    // Al crear, se entra directo al editor completo (secciones, versículos,
    // previsualización) en lugar de volver a la lista — recién creado es
    // cuando tiene sentido seguir construyendo el estudio.
    const { data, error } = await supabase.from("casa_studies").insert(payload).select("id").single();
    setSaving(false);
    if (error || !data) {
      setError(error?.message ?? "No se pudo crear el estudio.");
      return;
    }
    router.push(`/estudios/${data.id}`);
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar este estudio?")) return;
    await supabase.from("casa_studies").delete().eq("id", values.id);
    router.push("/estudios");
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
      <div>
        <Label>Subtítulo</Label>
        <TextInput
          value={values.subtitle}
          onChange={(v) => set("subtitle", v)}
          placeholder="Una línea que acompañe al título"
        />
      </div>
      <div>
        <Label>Descripción</Label>
        <ParagraphsEditor paragraphs={paragraphs} onChange={setParagraphs} />
      </div>
      <div>
        <Label>Versículo principal (opcional)</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Referencia y texto van por separado, para que se muestren de forma especial en la página del estudio y no
          como una sola línea de texto.
        </p>
        <MainVerseFields values={values} onChange={set} />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
          <Label>Nivel</Label>
          <select
            value={values.level}
            onChange={(e) => set("level", e.target.value as StudyFormValues["level"])}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Imagen de portada</Label>
          <ImageUploadField value={values.cover_image_url} onChange={(v) => set("cover_image_url", v)} folder="studies" />
        </div>
        <div>
          <Label>Duración (min)</Label>
          <input
            type="number"
            value={values.duration_minutes}
            onChange={(e) => set("duration_minutes", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
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
      </div>
      <details className="rounded-2xl border border-border p-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">SEO y redes sociales</summary>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Título SEO</Label>
            <TextInput
              value={values.seo_title}
              onChange={(v) => set("seo_title", v)}
              placeholder="Si se deja vacío se usa el título del estudio"
            />
          </div>
          <div>
            <Label>Meta descripción</Label>
            <TextInput
              value={values.seo_description}
              onChange={(v) => set("seo_description", v)}
              placeholder="Resumen que aparece en Google y al compartir"
            />
          </div>
          <div>
            <Label>Imagen para compartir</Label>
            <ImageUploadField
              value={values.social_image_url}
              onChange={(v) => set("social_image_url", v)}
              folder="studies"
            />
          </div>
        </div>
      </details>

      <div>
        <Label>Estado</Label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as StudyFormValues["status"])}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
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
        {savedAt && !error && (
          <span className="text-xs text-muted-foreground">
            Guardado {savedAt.toLocaleTimeString("es-PE")}
          </span>
        )}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-medium text-muted-foreground">{children}</p>;
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
    />
  );
}

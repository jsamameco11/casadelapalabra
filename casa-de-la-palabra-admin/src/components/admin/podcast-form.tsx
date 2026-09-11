"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import { ParagraphsEditor, paragraphsToText, textToParagraphs } from "@/components/admin/paragraphs-editor";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export interface PodcastFormValues {
  id?: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string;
  audio_url: string;
  spotify_url: string;
  apple_podcasts_url: string;
  youtube_url: string;
  status: "draft" | "published" | "archived";
  position: number;
}

export function PodcastForm({ initial }: { initial: PodcastFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [paragraphs, setParagraphs] = useState(textToParagraphs(initial.description));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof PodcastFormValues>(key: K, value: PodcastFormValues[K]) {
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
      description: paragraphsToText(paragraphs),
      cover_image_url: values.cover_image_url.trim() || null,
      audio_url: values.audio_url.trim() || null,
      spotify_url: values.spotify_url.trim() || null,
      apple_podcasts_url: values.apple_podcasts_url.trim() || null,
      youtube_url: values.youtube_url.trim() || null,
      status: values.status,
      position: values.position,
      published_at: values.status === "published" ? new Date().toISOString() : null,
    };

    const { error } = values.id
      ? await supabase.from("casa_podcast_episodes").update(payload).eq("id", values.id)
      : await supabase.from("casa_podcast_episodes").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/media/podcast");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar este episodio?")) return;
    await supabase.from("casa_podcast_episodes").delete().eq("id", values.id);
    router.push("/media/podcast");
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
        <Label>Descripción</Label>
        <ParagraphsEditor paragraphs={paragraphs} onChange={setParagraphs} />
      </div>
      <div>
        <Label>Imagen de portada</Label>
        <ImageUploadField value={values.cover_image_url} onChange={(v) => set("cover_image_url", v)} folder="podcasts" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Audio propio (URL)</Label>
          <TextInput value={values.audio_url} onChange={(v) => set("audio_url", v)} />
        </div>
        <div>
          <Label>Spotify (URL)</Label>
          <TextInput value={values.spotify_url} onChange={(v) => set("spotify_url", v)} />
        </div>
        <div>
          <Label>Apple Podcasts (URL)</Label>
          <TextInput value={values.apple_podcasts_url} onChange={(v) => set("apple_podcasts_url", v)} />
        </div>
        <div>
          <Label>YouTube (URL)</Label>
          <TextInput value={values.youtube_url} onChange={(v) => set("youtube_url", v)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
            onChange={(e) => set("status", e.target.value as PodcastFormValues["status"])}
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

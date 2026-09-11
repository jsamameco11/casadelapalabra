"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SiteSettingsRow } from "@/lib/types/site-settings";

export function SettingsForm({ initial }: { initial: SiteSettingsRow }) {
  const supabase = createClient();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  function set<K extends keyof SiteSettingsRow>(key: K, value: SiteSettingsRow[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const { error } = await supabase
      .from("casa_site_settings")
      .update({
        hero_title: values.hero_title,
        hero_subtitle: values.hero_subtitle,
        hero_primary_cta_label: values.hero_primary_cta_label,
        hero_primary_cta_href: values.hero_primary_cta_href,
        hero_secondary_cta_label: values.hero_secondary_cta_label,
        hero_secondary_cta_href: values.hero_secondary_cta_href,
        devotional_enabled: values.devotional_enabled,
        devotional_title: values.devotional_title,
        donation_cta_title: values.donation_cta_title,
        maintenance_mode: values.maintenance_mode,
      })
      .eq("id", 1);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSavedAt(Date.now());
  }

  return (
    <div className="max-w-2xl space-y-10">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-medium">Devocional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Muestra el devocional del día como pantalla de bienvenida antes del Home. Por defecto
              está <strong>oculto</strong>.
            </p>
          </div>
          <Toggle checked={values.devotional_enabled} onChange={(v) => set("devotional_enabled", v)} />
        </div>

        {values.devotional_enabled && (
          <div className="mt-4">
            <Label>Título de la sección</Label>
            <TextInput
              value={values.devotional_title}
              onChange={(v) => set("devotional_title", v)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              El contenido del devocional de cada día se administra en{" "}
              <span className="font-medium text-foreground">Sitio → Devocionales</span>.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-medium">Portada (Hero)</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Título</Label>
            <TextInput value={values.hero_title} onChange={(v) => set("hero_title", v)} />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <TextArea value={values.hero_subtitle} onChange={(v) => set("hero_subtitle", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Botón primario</Label>
              <TextInput value={values.hero_primary_cta_label} onChange={(v) => set("hero_primary_cta_label", v)} />
            </div>
            <div>
              <Label>Enlace primario</Label>
              <TextInput value={values.hero_primary_cta_href} onChange={(v) => set("hero_primary_cta_href", v)} />
            </div>
            <div>
              <Label>Botón secundario</Label>
              <TextInput value={values.hero_secondary_cta_label} onChange={(v) => set("hero_secondary_cta_label", v)} />
            </div>
            <div>
              <Label>Enlace secundario</Label>
              <TextInput value={values.hero_secondary_cta_href} onChange={(v) => set("hero_secondary_cta_href", v)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-medium">Donaciones</h2>
        <div className="mt-4">
          <Label>Texto del llamado a la acción</Label>
          <TextInput value={values.donation_cta_title} onChange={(v) => set("donation_cta_title", v)} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-medium">Modo mantenimiento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Muestra una pantalla de mantenimiento en el sitio público.
            </p>
          </div>
          <Toggle checked={values.maintenance_mode} onChange={(v) => set("maintenance_mode", v)} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {savedAt && <span className="text-sm text-muted-foreground">Guardado.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
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

function TextArea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
    />
  );
}

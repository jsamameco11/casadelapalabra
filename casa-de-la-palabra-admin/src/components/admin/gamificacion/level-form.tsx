"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface LevelFormValues {
  isNew: boolean;
  level_number: number;
  name: string;
  min_xp: number;
  icon_url: string;
}

export function LevelForm({ initial }: { initial: LevelFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof LevelFormValues>(key: K, value: LevelFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    if (!values.name.trim() || !values.level_number) {
      setError("Nombre y número de nivel son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      level_number: values.level_number,
      name: values.name.trim(),
      min_xp: values.min_xp,
      icon_url: values.icon_url.trim() || null,
    };

    const { error } = values.isNew
      ? await supabase.from("casa_levels").insert(payload)
      : await supabase.from("casa_levels").update(payload).eq("level_number", values.level_number);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/gamificacion/niveles");
    router.refresh();
  }

  async function remove() {
    if (!confirm("¿Eliminar este nivel?")) return;
    await supabase.from("casa_levels").delete().eq("level_number", values.level_number);
    router.push("/juegos/gamificacion/niveles");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Número de nivel</Label>
        <input
          type="number"
          value={values.level_number}
          disabled={!values.isNew}
          onChange={(e) => set("level_number", Number(e.target.value))}
          className="w-32 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
      </div>
      <div>
        <Label>Nombre</Label>
        <input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Discípulo"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>XP mínimo requerido</Label>
        <input
          type="number"
          value={values.min_xp}
          onChange={(e) => set("min_xp", Number(e.target.value))}
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

      <div className="flex items-center gap-4 pt-2">
        <button onClick={save} disabled={saving} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {!values.isNew && (
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

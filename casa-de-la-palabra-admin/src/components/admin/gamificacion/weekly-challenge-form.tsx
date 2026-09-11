"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface WeeklyChallengeFormValues {
  id?: string;
  title: string;
  description: string;
  goal: string;
  xp_reward: number;
  starts_on: string;
  ends_on: string;
}

export function WeeklyChallengeForm({ initial }: { initial: WeeklyChallengeFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof WeeklyChallengeFormValues>(key: K, value: WeeklyChallengeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    if (!values.title.trim() || !values.starts_on || !values.ends_on) {
      setError("Título, fecha de inicio y fecha de fin son obligatorios.");
      return;
    }
    if (values.ends_on < values.starts_on) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    let goal: unknown;
    try {
      goal = values.goal.trim() ? JSON.parse(values.goal) : {};
    } catch {
      setError('El objetivo debe ser JSON válido, por ejemplo: {"lessons":10}');
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      goal,
      xp_reward: values.xp_reward,
      starts_on: values.starts_on,
      ends_on: values.ends_on,
    };

    const { error } = values.id
      ? await supabase.from("casa_weekly_challenges").update(payload).eq("id", values.id)
      : await supabase.from("casa_weekly_challenges").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/gamificacion/retos-semanales");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar este reto semanal?")) return;
    await supabase.from("casa_weekly_challenges").delete().eq("id", values.id);
    router.push("/juegos/gamificacion/retos-semanales");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Título</Label>
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Completa 10 lecciones esta semana"
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Inicio</Label>
          <input
            type="date"
            value={values.starts_on}
            onChange={(e) => set("starts_on", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <Label>Fin</Label>
          <input
            type="date"
            value={values.ends_on}
            onChange={(e) => set("ends_on", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <div>
        <Label>Objetivo (JSON)</Label>
        <textarea
          value={values.goal}
          onChange={(e) => set("goal", e.target.value)}
          rows={3}
          placeholder='{"lessons":10}'
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-xs outline-none focus:border-primary"
        />
      </div>
      <div>
        <Label>XP de recompensa</Label>
        <input
          type="number"
          value={values.xp_reward}
          onChange={(e) => set("xp_reward", Number(e.target.value))}
          className="w-32 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface DailyChallengeFormValues {
  id?: string;
  title: string;
  description: string;
  challenge_type: string;
  target: string;
  xp_reward: number;
  active_date: string;
}

const TYPES = [
  { value: "answer_questions", label: "Responder preguntas" },
  { value: "complete_lesson", label: "Completar lección" },
  { value: "read_chapter", label: "Leer capítulo" },
  { value: "memorize_verse", label: "Memorizar versículo" },
];

export function DailyChallengeForm({ initial }: { initial: DailyChallengeFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof DailyChallengeFormValues>(key: K, value: DailyChallengeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    if (!values.title.trim() || !values.active_date) {
      setError("Título y fecha son obligatorios.");
      return;
    }
    let target: unknown;
    try {
      target = values.target.trim() ? JSON.parse(values.target) : {};
    } catch {
      setError('El objetivo debe ser JSON válido, por ejemplo: {"count":5}');
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      challenge_type: values.challenge_type,
      target,
      xp_reward: values.xp_reward,
      active_date: values.active_date,
    };

    const { error } = values.id
      ? await supabase.from("casa_daily_challenges").update(payload).eq("id", values.id)
      : await supabase.from("casa_daily_challenges").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/gamificacion/retos-diarios");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar este reto diario?")) return;
    await supabase.from("casa_daily_challenges").delete().eq("id", values.id);
    router.push("/juegos/gamificacion/retos-diarios");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Título</Label>
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Responde 5 preguntas de REBET"
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
          <Label>Tipo</Label>
          <select
            value={values.challenge_type}
            onChange={(e) => set("challenge_type", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Fecha activa</Label>
          <input
            type="date"
            value={values.active_date}
            onChange={(e) => set("active_date", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <div>
        <Label>Objetivo (JSON)</Label>
        <textarea
          value={values.target}
          onChange={(e) => set("target", e.target.value)}
          rows={3}
          placeholder='{"count":5}'
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

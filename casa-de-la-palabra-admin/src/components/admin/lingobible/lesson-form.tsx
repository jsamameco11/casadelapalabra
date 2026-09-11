"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface LessonFormValues {
  id?: string;
  unit_id: string;
  title: string;
  xp_reward: number;
  position: number;
  status: "draft" | "published" | "scheduled" | "archived";
}

export function LessonForm({ initial }: { initial: LessonFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [units, setUnits] = useState<{ id: string; title: string }[]>([]);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_lingobible_units")
      .select("id, title")
      .order("position")
      .then(({ data }) => setUnits(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof LessonFormValues>(key: K, value: LessonFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    if (!values.title.trim() || !values.unit_id) {
      setError("Título y unidad son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      unit_id: values.unit_id,
      title: values.title.trim(),
      xp_reward: values.xp_reward,
      position: values.position,
      status: values.status,
    };

    const { error } = values.id
      ? await supabase.from("casa_lingobible_lessons").update(payload).eq("id", values.id)
      : await supabase.from("casa_lingobible_lessons").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/lingobible/lecciones");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar esta lección? Se eliminarán también sus ejercicios.")) return;
    await supabase.from("casa_lingobible_lessons").delete().eq("id", values.id);
    router.push("/juegos/lingobible/lecciones");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Unidad</Label>
        <select
          value={values.unit_id}
          onChange={(e) => set("unit_id", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Selecciona una unidad</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Título</Label>
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Lección 1: Adán y Eva"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>XP al completar</Label>
          <input
            type="number"
            value={values.xp_reward}
            onChange={(e) => set("xp_reward", Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <Label>Posición</Label>
          <input
            type="number"
            value={values.position}
            onChange={(e) => set("position", Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <div>
        <Label>Estado</Label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as LessonFormValues["status"])}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicada</option>
          <option value="scheduled">Programada</option>
          <option value="archived">Archivada</option>
        </select>
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
      <p className="text-xs text-muted-foreground">
        La edición de ejercicios individuales dentro de la lección queda para la siguiente fase.
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-medium text-muted-foreground">{children}</p>;
}

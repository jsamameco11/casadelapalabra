"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface UnitFormValues {
  id?: string;
  path_id: string;
  title: string;
  description: string;
  position: number;
}

export function UnitForm({ initial }: { initial: UnitFormValues }) {
  const supabase = createClient();
  const router = useRouter();
  const [paths, setPaths] = useState<{ id: string; title: string }[]>([]);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_lingobible_paths")
      .select("id, title")
      .order("position")
      .then(({ data }) => setPaths(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof UnitFormValues>(key: K, value: UnitFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    if (!values.title.trim() || !values.path_id) {
      setError("Título y ruta son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      path_id: values.path_id,
      title: values.title.trim(),
      description: values.description.trim() || null,
      position: values.position,
    };

    const { error } = values.id
      ? await supabase.from("casa_lingobible_units").update(payload).eq("id", values.id)
      : await supabase.from("casa_lingobible_units").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/juegos/lingobible/unidades");
    router.refresh();
  }

  async function remove() {
    if (!values.id) return;
    if (!confirm("¿Eliminar esta unidad? Se eliminarán también sus lecciones.")) return;
    await supabase.from("casa_lingobible_units").delete().eq("id", values.id);
    router.push("/juegos/lingobible/unidades");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Label>Ruta</Label>
        <select
          value={values.path_id}
          onChange={(e) => set("path_id", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Selecciona una ruta</option>
          {paths.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Título</Label>
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Personajes del Antiguo Testamento"
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
        <Label>Posición</Label>
        <input
          type="number"
          value={values.position}
          onChange={(e) => set("position", Number(e.target.value))}
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

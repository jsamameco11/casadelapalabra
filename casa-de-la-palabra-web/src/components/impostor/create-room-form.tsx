"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconUsers } from "@/components/impostor/icons";

interface Category {
  id: string;
  slug: string;
  name: string;
}

export function CreateRoomForm() {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("mixed");
  const [impostorCount, setImpostorCount] = useState(1);
  const [clueRounds, setClueRounds] = useState(2);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("casa_impostor_categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRoom() {
    setCreating(true);
    setError("");
    const { data, error } = await supabase.rpc("casa_impostor_create_room", {
      p_category_slug: category,
      p_impostor_count: impostorCount,
      p_clue_rounds: clueRounds,
    });
    setCreating(false);
    if (error || !data) {
      setError(error?.message ?? "No se pudo crear la sala.");
      return;
    }
    router.push(`/juegos/impostor-biblico/sala/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <IconUsers className="h-8 w-8 text-primary" />
      <h1 className="mt-3 font-display text-2xl font-medium">Crear sala</h1>
      <p className="mt-2 text-sm text-muted-foreground">Serás el anfitrión de la partida.</p>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Categoría</p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
        >
          <option value="mixed">Mixta</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Número de impostores</p>
        <div className="flex gap-2">
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => setImpostorCount(n)}
              className={`rounded-full border px-4 py-2 text-sm ${
                impostorCount === n ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Rondas de pistas</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setClueRounds(n)}
              className={`rounded-full border px-4 py-2 text-sm ${
                clueRounds === n ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={createRoom}
        disabled={creating}
        className="mt-8 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {creating ? "Creando…" : "Crear sala"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconUsers } from "@/components/impostor/icons";

export function JoinRoomForm() {
  const supabase = createClient();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function join() {
    setJoining(true);
    setError("");
    const { data, error } = await supabase.rpc("casa_impostor_join_room", {
      p_code: code.trim().toUpperCase(),
      p_display_name: displayName.trim() || null,
    });
    setJoining(false);
    if (error || !data) {
      setError(error?.message ?? "No se pudo unir a la sala.");
      return;
    }
    router.push(`/juegos/impostor-biblico/sala/${data.room_id}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <IconUsers className="h-8 w-8 text-primary" />
      <h1 className="mt-3 font-display text-2xl font-medium">Entrar a sala</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pide el código al anfitrión.</p>

      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Código de sala</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ARCA482"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm uppercase outline-none focus:border-primary"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Tu nombre (opcional)</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Se usará tu nombre de perfil si lo dejas vacío"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={join}
        disabled={joining || code.trim().length === 0}
        className="mt-8 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {joining ? "Uniendo…" : "Entrar"}
      </button>
    </div>
  );
}

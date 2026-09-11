"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconMask, IconPhone, IconUsers } from "@/components/impostor/icons";

export function ImpostorHome() {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState<"crear" | "entrar" | null>(null);

  async function goLive(target: "crear" | "entrar") {
    setChecking(target);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const dest = `/juegos/impostor-biblico/sala/${target}`;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(dest)}&reason=impostor`);
      return;
    }
    router.push(dest);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8">
          <IconPhone className="h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-xl font-medium">Un solo celular</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Ideal para grupos presenciales. Se pasa un mismo teléfono para que cada jugador vea su
            carta en privado. No necesitas que todos tengan cuenta.
          </p>
          <button
            onClick={() => router.push("/juegos/impostor-biblico/local")}
            className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Jugar en este celular
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8">
          <IconUsers className="h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-xl font-medium">Sala en vivo</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Cada jugador entra desde su propio celular, conectados en tiempo real. Se requiere
            iniciar sesión para crear o entrar a una sala.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => goLive("crear")}
              disabled={checking === "crear"}
              className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {checking === "crear" ? "Verificando…" : "Crear sala"}
            </button>
            <button
              onClick={() => goLive("entrar")}
              disabled={checking === "entrar"}
              className="w-full rounded-full border border-border py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              {checking === "entrar" ? "Verificando…" : "Entrar a sala"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-muted p-6 text-sm text-foreground/80">
        <p className="flex items-center gap-2 font-medium">
          <IconMask className="h-5 w-5 text-primary" /> ¿Cómo se juega?
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Todos reciben la misma palabra bíblica secreta, excepto el impostor.</li>
          <li>Por turnos, cada jugador dice en voz alta una pista relacionada, sin decir la palabra.</li>
          <li>Tras las rondas de pistas, se vota quién creen que es el impostor.</li>
          <li>Si la mayoría acierta, ganan los demás. Si nadie lo descubre, gana el impostor.</li>
        </ul>
      </div>
    </div>
  );
}

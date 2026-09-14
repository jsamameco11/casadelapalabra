"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/password-input";

export default function ActualizarContrasenaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "done">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("done");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Casa de la Palabra</p>
        <h1 className="mt-2 font-display text-2xl font-medium">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">Elige una nueva contraseña para tu cuenta.</p>

        {status === "done" ? (
          <p className="mt-8 text-sm text-primary">Contraseña actualizada. Entrando…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nueva contraseña</label>
              <PasswordInput
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirmar contraseña</label>
              <PasswordInput
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={status === "saving"}
              className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {status === "saving" ? "Guardando…" : "Guardar contraseña"}
            </button>
            {status === "error" && <p className="text-center text-sm text-danger">{errorMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

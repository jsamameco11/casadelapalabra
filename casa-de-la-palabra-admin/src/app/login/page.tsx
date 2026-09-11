"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message);
      setStatus("error");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Casa de la Palabra</p>
        <h1 className="mt-2 font-display text-2xl font-medium">Panel de control</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acceso solo para el equipo editorial.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Correo</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contraseña</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? "Entrando…" : "Iniciar sesión"}
          </button>
          {status === "error" && <p className="text-center text-sm text-danger">{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

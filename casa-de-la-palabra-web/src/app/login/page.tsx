"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconCross } from "@/components/icons/line-art";
import {
  exchangeGoogleSession,
  initGooglePicker,
  loadGoogleIdentity,
  renderGoogleButton,
  type GoogleIdentity,
} from "@/lib/google-identity";

const REASON_MESSAGES: Record<string, string> = {
  juegos: "Para jugar necesitas iniciar sesión con Google.",
  devocional: "Inicia sesión para recibir los devocionales diarios.",
};

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const reason = searchParams.get("reason");
  const oauthError = searchParams.get("error");

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleIdentity();
        if (cancelled) return;
        initGooglePicker({
          onCredential: (identity) => {
            void completeGoogleLogin(identity);
          },
          onError: (message) => setGoogleError(message),
        });
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          renderGoogleButton(googleBtnRef.current);
        }
        setGoogleReady(true);
      } catch (err) {
        setGoogleError(err instanceof Error ? err.message : "Google no está disponible.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completeGoogleLogin(identity: GoogleIdentity) {
    setGoogleBusy(true);
    setGoogleError("");
    try {
      const { access_token, refresh_token } = await exchangeGoogleSession(identity);
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google.");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <IconCross className="h-8 w-8 text-primary" />
      <h1 className="mt-4 font-display text-2xl font-medium">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-foreground/70">
        {reason && REASON_MESSAGES[reason] ? REASON_MESSAGES[reason] : "Te enviaremos un enlace mágico a tu correo, sin contraseñas."}
      </p>

      {oauthError && (
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
          No pudimos verificar el enlace. Inténtalo de nuevo.
        </p>
      )}

      <div className="mt-8 flex w-full min-h-11 items-center justify-center" ref={googleBtnRef} />
      {!googleReady && <p className="mt-2 text-xs text-muted-foreground">Cargando selector de Google…</p>}
      {googleBusy && <p className="mt-2 text-xs text-primary">Abriendo sesión…</p>}
      {googleError && <p className="mt-2 text-sm text-red-600">{googleError}</p>}

      {status === "sent" ? (
        <p className="mt-8 rounded-2xl bg-muted p-5 text-sm">
          Revisa tu correo <strong>{email}</strong> y haz clic en el enlace para ingresar.
        </p>
      ) : (
        <>
          <div className="mt-6 flex w-full items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            o con tu correo
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Enviando…" : "Enviar enlace"}
            </button>
            {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
          </form>
        </>
      )}
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

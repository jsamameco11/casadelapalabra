"use client";

// Google Identity Services (GIS) + the shared Folio "google-session" Edge
// Function, following the same pattern already used in production by
// contrataciones/ingenieria (see APP CONTRATACIONES/apps/web/src/lib/
// google-identity.ts) so login works the same way across the ecosystem.

type GisId = {
  initialize: (cfg: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
  cancel?: () => void;
  disableAutoSelect?: () => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GisId } };
  }
}

export type GoogleIdentity = {
  idToken: string;
  email: string;
  name: string;
  picture: string;
  sub: string;
};

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "554728885093-jnn9ibrh5jl7f5nfth67cabipo4i4bd6.apps.googleusercontent.com";

let gisReady: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Solo en el navegador"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisReady) return gisReady;
  gisReady = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Identity.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.gis = "1";
    script.onload = () => resolve();
    script.onerror = () => {
      gisReady = null;
      reject(new Error("No se pudo cargar el selector de cuentas de Google."));
    };
    document.head.appendChild(script);
  });
  return gisReady;
}

function decodeJwt(token: string): Record<string, string> {
  const part = token.split(".")[1];
  if (!part) return {};
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(pad);
    return JSON.parse(json) as Record<string, string>;
  } catch {
    return {};
  }
}

export function identityFromCredential(credential: string): GoogleIdentity {
  const claims = decodeJwt(credential);
  return {
    idToken: credential,
    email: String(claims.email || ""),
    name: String(claims.name || claims.email || ""),
    picture: String(claims.picture || ""),
    sub: String(claims.sub || ""),
  };
}

export function initGooglePicker(opts: { onCredential: (id: GoogleIdentity) => void; onError: (message: string) => void }): void {
  const id = window.google?.accounts?.id;
  if (!id) {
    opts.onError("El selector de Google no está disponible en este navegador.");
    return;
  }
  id.cancel?.();
  id.disableAutoSelect?.();
  id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: "signin",
    ux_mode: "popup",
    itp_support: true,
    use_fedcm_for_prompt: false,
    callback: (resp: { credential?: string }) => {
      if (!resp.credential) {
        opts.onError("Google no entregó una cuenta. Elige otra e inténtalo de nuevo.");
        return;
      }
      opts.onCredential(identityFromCredential(resp.credential));
    },
  });
}

export function renderGoogleButton(el: HTMLElement): void {
  window.google?.accounts?.id?.renderButton(el, {
    theme: "outline",
    size: "large",
    type: "standard",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(360, el.clientWidth || 320),
    locale: "es",
  });
}

export function installId(): string {
  const key = "casa_install_id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function exchangeGoogleSession(identity: GoogleIdentity): Promise<{ access_token: string; refresh_token: string }> {
  // Calls our own server (not the Supabase Edge Function directly from the
  // browser) — see src/app/api/auth/google/route.ts.
  const res = await fetch(`/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_token: identity.idToken,
      email: identity.email,
      name: identity.name,
      sub: identity.sub,
      install_id: installId(),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    session?: { access_token?: string; refresh_token?: string };
  };

  const access = data.session?.access_token;
  const refresh = data.session?.refresh_token;
  if (!res.ok || !access || !refresh) {
    throw new Error(data.message || "Google entregó la cuenta, pero no se pudo abrir la sesión.");
  }
  return { access_token: access, refresh_token: refresh };
}

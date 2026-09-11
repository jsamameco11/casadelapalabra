"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Devotional } from "@/lib/types/content";
import { IconClose, IconOpenBook } from "@/components/icons/line-art";

const STORAGE_KEY = "casa_devotional_seen_date";

export function DevotionalGate({
  devotional,
  isAuthenticated,
}: {
  devotional: Devotional;
  isAuthenticated: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seenDate = window.localStorage.getItem(STORAGE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (seenDate !== today) setVisible(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — just don't gate.
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <button
          aria-label="Cerrar devocional"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <IconClose className="h-5 w-5" />
        </button>

        <IconOpenBook className="h-8 w-8 text-primary" />

        {isAuthenticated ? (
          <>
            <p className="mt-4 font-display text-2xl font-medium">{devotional.title}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {devotional.body}
            </p>
            {devotional.verse_reference && (
              <div className="mt-5 rounded-2xl bg-muted p-4">
                {devotional.verse_text && (
                  <p className="font-display text-base italic text-foreground/90">
                    “{devotional.verse_text}”
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-primary">{devotional.verse_reference}</p>
              </div>
            )}
            {devotional.ai_generated && (
              <p className="mt-4 text-xs text-muted-foreground">
                Reflexión generada/explicativa por IA — no sustituye el texto bíblico.
              </p>
            )}

            <button
              onClick={dismiss}
              className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Continuar al sitio
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 font-display text-2xl font-medium">{devotional.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              Para recibir los devocionales diarios necesitas iniciar sesión.
            </p>

            <Link
              href="/login?next=/&reason=devocional"
              onClick={dismiss}
              className="mt-6 block w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Iniciar sesión
            </Link>
            <button
              onClick={dismiss}
              className="mt-3 w-full rounded-full py-3 text-sm font-medium text-foreground/60 hover:text-foreground"
            >
              Continuar sin iniciar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}

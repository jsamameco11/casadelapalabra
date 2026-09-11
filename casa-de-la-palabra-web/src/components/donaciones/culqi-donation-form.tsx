"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (opts: Record<string, unknown>) => void;
      options: (opts: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
      order?: unknown;
      error?: { user_message?: string; merchant_message?: string };
    };
    culqi?: () => void;
  }
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
const MIN_USD = 3;
const CULQI_FEE_USD = 1.5; // approximate — Culqi charges ~3.99% + fixed fee per transaction.

export function CulqiDonationForm() {
  const [scriptReady, setScriptReady] = useState(false);
  const [amount, setAmount] = useState("10");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "charging" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const pendingDonor = useRef<{ name: string; email: string; amountCents: number } | null>(null);

  useEffect(() => {
    if (!PUBLIC_KEY || !scriptReady || !window.Culqi) return;
    window.Culqi.publicKey = PUBLIC_KEY;

    window.culqi = async () => {
      const culqi = window.Culqi;
      if (!culqi || !pendingDonor.current) return;

      if (culqi.error) {
        setStatus("error");
        setMessage(culqi.error.user_message || culqi.error.merchant_message || "No se pudo procesar la tarjeta.");
        return;
      }
      if (!culqi.token) return;

      setStatus("charging");
      try {
        const res = await fetch("/api/donaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: culqi.token.id,
            amount_cents: pendingDonor.current.amountCents,
            donor_name: pendingDonor.current.name || undefined,
            donor_email: pendingDonor.current.email,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.message || "No se pudo procesar la donación.");
          return;
        }
        setStatus("success");
        setMessage("¡Gracias por tu donación! Dios te bendiga.");
      } catch {
        setStatus("error");
        setMessage("No se pudo conectar con el servidor. Intenta de nuevo.");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  if (!PUBLIC_KEY) {
    return (
      <p className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        Las donaciones con tarjeta estarán disponibles próximamente.
      </p>
    );
  }

  const amountNumber = Number(amount);
  const canSubmit = amountNumber >= MIN_USD && email.trim().length > 3 && status !== "charging";

  function openCulqi() {
    if (!window.Culqi || !canSubmit) return;
    const amountCents = Math.round(amountNumber * 100);
    pendingDonor.current = { name: name.trim(), email: email.trim(), amountCents };
    window.Culqi.settings({
      title: "Casa de la Palabra",
      currency: "USD",
      amount: amountCents,
    });
    window.Culqi.options({
      lang: "es",
      installments: false,
      paymentMethods: { tarjeta: true, yape: false, bancaMovil: false, agente: false, billetera: false, cuotealo: false },
    });
    setStatus("idle");
    setMessage("");
    window.Culqi.open();
  }

  return (
    <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6">
      <Script src="https://checkout.culqi.com/js/v4" strategy="afterInteractive" onReady={() => setScriptReady(true)} />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Monto (USD)</label>
        <input
          type="number"
          min={MIN_USD}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          El monto mínimo es de ${MIN_USD} USD. Culqi cobra una comisión de procesamiento de aproximadamente $
          {CULQI_FEE_USD.toFixed(2)} por transacción con tarjeta, la cual se descuenta del monto donado antes de
          llegar al ministerio.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nombre (opcional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <button
        onClick={openCulqi}
        disabled={!canSubmit || !scriptReady}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {status === "charging" ? "Procesando…" : `Donar $${amount || 0} con tarjeta`}
      </button>

      {status === "success" && <p className="text-sm text-primary">{message}</p>}
      {status === "error" && <p className="text-sm text-danger">{message}</p>}
    </div>
  );
}

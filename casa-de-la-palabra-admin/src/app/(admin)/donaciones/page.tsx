import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";
import { MethodActiveToggle } from "@/components/admin/donaciones/method-active-toggle";

export const metadata = { title: "Donaciones" };

const METHOD_LABELS: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  bank_transfer: "Transferencia bancaria",
  card: "Tarjeta (Culqi)",
  stripe: "Stripe",
  paypal: "PayPal",
};

export default async function DonacionesAdminPage() {
  const supabase = await createClient();
  const [{ data: methods }, { data: donations }] = await Promise.all([
    supabase.from("casa_donation_methods").select("id, method, label, is_active").order("position", { ascending: true }),
    supabase
      .from("casa_donations")
      .select("id, amount_cents, currency, donor_name, donor_email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <PageShell
      eyebrow="Sitio"
      title="Donaciones"
      description="Activa un método solo cuando su cuenta/credenciales reales estén configuradas. No se inventan datos ficticios."
    >
      <div className="space-y-3">
        {(methods ?? []).map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4">
            <span className="text-sm font-medium">{METHOD_LABELS[m.method] ?? m.label}</span>
            <MethodActiveToggle id={m.id} initialActive={m.is_active} />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Tarjeta (Culqi)</p>
        <p className="mt-1">
          El formulario de tarjeta ya está integrado en /donar y llama a Culqi con las claves{" "}
          <code className="rounded bg-background px-1.5 py-0.5">NEXT_PUBLIC_CULQI_PUBLIC_KEY</code> /{" "}
          <code className="rounded bg-background px-1.5 py-0.5">CULQI_SECRET_KEY</code> del sitio público. Actívalo
          aquí solo después de configurar las claves reales de la cuenta de Culqi en el servidor.
        </p>
      </div>

      <h2 className="mt-10 font-display text-lg font-medium">Últimas donaciones registradas</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Donante</th>
              <th className="px-5 py-3">Monto</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(donations ?? []).map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{new Date(d.created_at).toLocaleString("es-PE")}</td>
                <td className="px-5 py-3">{d.donor_name || d.donor_email}</td>
                <td className="px-5 py-3">
                  {d.currency} {(d.amount_cents / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      d.status === "succeeded" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {d.status === "succeeded" ? "Exitosa" : "Fallida"}
                  </span>
                </td>
              </tr>
            ))}
            {(donations ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay donaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

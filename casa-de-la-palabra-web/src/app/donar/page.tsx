import { getDonationMethods, getSiteSettings } from "@/lib/data/site";
import { PageHeader, ComingSoon } from "@/components/layout/page-header";
import { CulqiDonationForm } from "@/components/donaciones/culqi-donation-form";

export const metadata = { title: "Donar" };

const METHOD_LABELS: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  bank_transfer: "Transferencia bancaria",
  card: "Tarjeta",
  stripe: "Stripe",
  paypal: "PayPal",
};

export default async function DonarPage() {
  const [settings, methods] = await Promise.all([getSiteSettings(), getDonationMethods()]);

  return (
    <div>
      <PageHeader eyebrow="Donar" title={settings.donation_cta_title} />
      {methods.length === 0 ? (
        <ComingSoon label="La configuración de métodos de donación" />
      ) : (
        <div className="mx-auto grid max-w-3xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:px-8">
          {methods.map((m) =>
            m.method === "card" ? (
              <div key={m.id} className="sm:col-span-2">
                <h2 className="mb-3 font-display text-lg font-medium">{METHOD_LABELS[m.method] ?? m.label}</h2>
                <CulqiDonationForm />
              </div>
            ) : (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-medium">{METHOD_LABELS[m.method] ?? m.label}</h2>
                {"description" in m.details && typeof m.details.description === "string" && (
                  <p className="mt-2 text-sm text-foreground/70">{m.details.description as string}</p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Devocionales" };

export default async function DevocionalesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_devotionals")
    .select("id, title, publish_date, status, ai_generated")
    .order("publish_date", { ascending: false });

  const devotionals = data ?? [];

  return (
    <PageShell
      eyebrow="Sitio"
      title="Devocionales"
      description="Contenido del devocional diario. Se muestra al público solo si está activado en Configuración."
    >
      <div className="mb-4 flex justify-end">
        <Link
          href="/devocionales/nuevo"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Nuevo devocional
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {devotionals.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{d.publish_date}</td>
                <td className="px-5 py-3">{d.title}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      d.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/devocionales/${d.id}`} className="text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {devotionals.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay devocionales creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

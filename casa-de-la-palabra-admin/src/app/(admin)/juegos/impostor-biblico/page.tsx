import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "El Impostor Bíblico" };

export default async function ImpostorAdminPage() {
  const supabase = await createClient();
  const [{ count: words }, { count: categories }, { count: rooms }] = await Promise.all([
    supabase.from("casa_impostor_words").select("*", { count: "exact", head: true }),
    supabase.from("casa_impostor_categories").select("*", { count: "exact", head: true }),
    supabase.from("casa_impostor_rooms").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PageShell
      eyebrow="Juegos"
      title="El Impostor Bíblico"
      description="Banco de palabras, categorías y salas jugadas. No modifica REBET ni LINGOBIBLE."
    >
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Palabras" value={words ?? 0} />
        <Stat label="Categorías" value={categories ?? 0} />
        <Stat label="Salas creadas" value={rooms ?? 0} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/juegos/impostor-biblico/categorias"
          className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40"
        >
          <h2 className="font-display text-lg font-medium">Categorías</h2>
          <p className="mt-1 text-sm text-muted-foreground">Crear, renombrar y activar/desactivar categorías.</p>
        </Link>
        <Link
          href="/juegos/impostor-biblico/palabras"
          className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40"
        >
          <h2 className="font-display text-lg font-medium">Palabras</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Banco de palabras secretas, con referencia bíblica opcional.
          </p>
        </Link>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

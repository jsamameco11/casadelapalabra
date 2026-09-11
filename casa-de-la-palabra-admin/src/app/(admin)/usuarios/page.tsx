import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/admin/page-shell";

export const metadata = { title: "Usuarios y roles" };

export default async function UsuariosAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("casa_profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PageShell
      eyebrow="Cuenta"
      title="Usuarios y roles"
      description="Cambiar roles requiere permisos de administrador (super_admin/admin) — protegido por RLS."
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">{u.display_name ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{u.role}</span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("es-PE")}
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                  Aún no hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

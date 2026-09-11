import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const staff = await getCurrentStaff();

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Acceso restringido</p>
          <h1 className="mt-2 font-display text-xl font-medium">Tu cuenta no tiene permisos de staff</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sesión iniciada como <strong>{user.email}</strong>, pero tu perfil (
            <code>casa_profiles</code>) tiene rol <code>user</code>. Pide a un{" "}
            <code>super_admin</code> que actualice tu rol, o hazlo directamente en SQL:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-3 text-left text-xs">
            {`insert into casa_profiles (id, role) values ('${user.id}', 'super_admin')\n  on conflict (id) do update set role = 'super_admin';`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar displayName={staff.displayName} email={staff.email} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

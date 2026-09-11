"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "General",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    title: "Contenido",
    items: [
      { href: "/biblia", label: "Biblia y traducciones" },
      { href: "/estudios", label: "Estudios bíblicos" },
      { href: "/media/videos", label: "Videos" },
      { href: "/media/podcast", label: "Podcast" },
      { href: "/media/cursos", label: "Cursos" },
      { href: "/media/conferencias", label: "Conferencias" },
    ],
  },
  {
    title: "Juegos",
    items: [
      { href: "/juegos/rebet", label: "REBET" },
      { href: "/juegos/lingobible", label: "LINGOBIBLE" },
      { href: "/juegos/impostor-biblico", label: "El Impostor Bíblico" },
      { href: "/juegos/gamificacion", label: "Gamificación" },
    ],
  },
  {
    title: "Sitio",
    items: [
      { href: "/home", label: "Home" },
      { href: "/devocionales", label: "Devocionales" },
      { href: "/navegacion", label: "Navegación y footer" },
      { href: "/donaciones", label: "Donaciones" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { href: "/usuarios", label: "Usuarios y roles" },
      { href: "/configuracion", label: "Configuración" },
    ],
  },
];

export function Sidebar({ displayName, email }: { displayName: string | null; email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Casa de la Palabra</p>
        <p className="font-display text-lg font-medium">Panel de control</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <div className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p className="truncate text-sm font-medium">{displayName ?? "Sin nombre"}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-full border border-border py-2 text-xs font-medium hover:bg-muted"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

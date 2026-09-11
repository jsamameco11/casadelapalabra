"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavItem } from "@/lib/types/content";
import { IconChevronDown, IconClose, IconCross, IconMenu, IconSearch } from "@/components/icons/line-art";

export function Navbar({ navigation, siteName }: { navigation: NavItem[]; siteName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const topLevel = navigation.filter((n) => !n.parent_id);
  const childrenOf = (id: string) => navigation.filter((n) => n.parent_id === id);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <IconCross className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-medium tracking-tight">{siteName}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {topLevel.map((item) => {
            const children = childrenOf(item.id);
            if (children.length === 0) {
              return (
                <Link
                  key={item.id}
                  href={item.href ?? "#"}
                  className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              );
            }
            return <NavDropdown key={item.id} label={item.label} items={children} />;
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
          >
            <IconSearch className="h-5 w-5" />
          </Link>
          <Link
            href="/donar"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
          >
            Donar
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Iniciar sesión
          </Link>
        </div>

        <button
          className="lg:hidden rounded-full p-2 text-foreground/80 hover:bg-muted"
          aria-label="Abrir menú"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 pb-6 pt-2">
          <nav className="flex flex-col">
            {topLevel.map((item) => {
              const children = childrenOf(item.id);
              return (
                <div key={item.id} className="border-b border-border/60 py-2">
                  {children.length === 0 ? (
                    <Link
                      href={item.href ?? "#"}
                      className="block py-2 text-base font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <div>
                      <p className="py-2 text-base font-medium text-foreground/60">{item.label}</p>
                      <div className="flex flex-col pl-3">
                        {children.map((c) => (
                          <Link
                            key={c.id}
                            href={c.href ?? "#"}
                            className="py-2 text-sm text-foreground/80"
                            onClick={() => setMobileOpen(false)}
                          >
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/buscar"
                className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Buscar
              </Link>
              <Link
                href="/donar"
                className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Donar
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Iniciar sesión
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {label}
        <IconChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2">
          <div className="min-w-48 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-black/5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href ?? "#"}
                className="block rounded-xl px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import type { SiteSettings } from "@/lib/types/content";
import { IconMountainPath } from "@/components/icons/line-art";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent" />
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <IconMountainPath className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {settings.hero_title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-foreground/70 sm:text-lg">
          {settings.hero_subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={settings.hero_primary_cta_href}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {settings.hero_primary_cta_label}
          </Link>
          <Link
            href={settings.hero_secondary_cta_href}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {settings.hero_secondary_cta_label}
          </Link>
        </div>
      </div>
    </section>
  );
}

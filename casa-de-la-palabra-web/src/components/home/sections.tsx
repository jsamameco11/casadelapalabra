import Link from "next/link";
import type { Conference, Devotional, PodcastEpisode, SiteSettings, Study, Video } from "@/lib/types/content";
import { IconFlame, IconOpenBook, IconTrophy } from "@/components/icons/line-art";
import { IconMask } from "@/components/impostor/icons";

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-medium sm:text-3xl">{title}</h2>
    </div>
  );
}

export function BibleTeaser() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <IconOpenBook className="h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-medium sm:text-3xl">
              Tu Biblia, siempre contigo.
            </h2>
            <p className="mt-2 max-w-md text-sm text-foreground/70">
              Lee, busca y compara traducciones. Guarda versículos, resalta pasajes y sigue tu
              progreso de lectura.
            </p>
          </div>
          <Link
            href="/biblia"
            className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Leer la Biblia
          </Link>
        </div>
      </div>
    </section>
  );
}

export function VerseOfDay({ devotional }: { devotional: Devotional | null }) {
  if (!devotional?.verse_text) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Versículo del día</p>
      <p className="mt-4 font-display text-2xl italic leading-snug sm:text-3xl">
        “{devotional.verse_text}”
      </p>
      <p className="mt-3 text-sm font-medium text-primary">{devotional.verse_reference}</p>
    </section>
  );
}

export function GamesTeaser() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Aprende jugando" title="Juegos bíblicos" />
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-background p-8">
            <IconTrophy className="h-9 w-9 text-primary" />
            <h3 className="mt-4 font-display text-xl font-medium">REBET</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Pon a prueba tus conocimientos bíblicos.
            </p>
            <Link
              href="/juegos/rebet"
              className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Jugar REBET
            </Link>
          </div>
          <div className="rounded-3xl border border-border bg-background p-8">
            <IconFlame className="h-9 w-9 text-primary" />
            <h3 className="mt-4 font-display text-xl font-medium">LINGOBIBLE</h3>
            <p className="mt-2 text-sm text-foreground/70">Aprende la Biblia paso a paso.</p>
            <Link
              href="/juegos/lingobible"
              className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Comenzar LINGOBIBLE
            </Link>
          </div>
          <div className="rounded-3xl border border-border bg-background p-8">
            <IconMask className="h-9 w-9 text-primary" />
            <h3 className="mt-4 font-display text-xl font-medium">El Impostor Bíblico</h3>
            <p className="mt-2 text-sm text-foreground/70">Descubre quién no conoce la palabra secreta.</p>
            <Link
              href="/juegos/impostor-biblico"
              className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Jugar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StudiesTeaser({ studies }: { studies: Study[] }) {
  if (studies.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Estudios bíblicos" title="Estudios destacados" />
      <div className="grid gap-6 sm:grid-cols-3">
        {studies.map((s) => (
          <Link
            key={s.id}
            href={`/estudios/${s.slug}`}
            className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.level}</p>
            <h3 className="mt-2 font-display text-lg font-medium">{s.title}</h3>
            {s.description && (
              <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{s.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MediaTeaser({
  videos,
  podcasts,
  conferences,
}: {
  videos: Video[];
  podcasts: PodcastEpisode[];
  conferences: Conference[];
}) {
  if (videos.length === 0 && podcasts.length === 0 && conferences.length === 0) return null;
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Media" title="Contenido reciente" />
        <div className="grid gap-6 sm:grid-cols-3">
          {videos.map((v) => (
            <Link key={v.id} href={`/media/videos/${v.slug}`} className="group">
              <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                {v.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-3 text-sm font-medium">{v.title}</p>
            </Link>
          ))}
          {podcasts.map((p) => (
            <Link
              key={p.id}
              href={`/media/podcast/${p.slug}`}
              className="rounded-2xl border border-border p-5 hover:border-primary/40"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Podcast</p>
              <p className="mt-2 text-sm font-medium">{p.title}</p>
            </Link>
          ))}
          {conferences.map((c) => (
            <Link
              key={c.id}
              href={`/media/conferencias/${c.slug}`}
              className="rounded-2xl border border-border p-5 hover:border-primary/40"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Conferencia</p>
              <p className="mt-2 text-sm font-medium">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.speaker}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DonationCta({ settings }: { settings: SiteSettings }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl font-medium sm:text-3xl">{settings.donation_cta_title}</h2>
      <Link
        href="/donar"
        className="mt-6 inline-block rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Donar ahora
      </Link>
    </section>
  );
}

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { IconFlame, IconTrophy } from "@/components/icons/line-art";
import { IconMask } from "@/components/impostor/icons";

export const metadata = { title: "Juegos" };

export default function JuegosPage() {
  return (
    <div>
      <PageHeader eyebrow="Juegos" title="Aprende la Biblia jugando" />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <IconTrophy className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-5 font-display text-2xl font-medium">REBET</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Pon a prueba tus conocimientos bíblicos en partidas rápidas, individuales o en sala.
          </p>
          <Link
            href="/juegos/rebet"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Jugar REBET
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <IconFlame className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-5 font-display text-2xl font-medium">LINGOBIBLE</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Aprende la Biblia paso a paso con lecciones progresivas, XP y rachas diarias.
          </p>
          <Link
            href="/juegos/lingobible"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Comenzar LINGOBIBLE
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <IconMask className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-5 font-display text-2xl font-medium">El Impostor Bíblico</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Un juego de deducción social bíblico. Juega en un solo celular o en sala en vivo.
          </p>
          <Link
            href="/juegos/impostor-biblico"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Jugar
          </Link>
        </div>
      </div>
    </div>
  );
}

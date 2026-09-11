import Link from "next/link";
import type { FooterColumn, SocialLink } from "@/lib/types/content";
import { IconCross } from "@/components/icons/line-art";

const SOCIAL_LABELS: Record<SocialLink["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  spotify: "Spotify",
  x: "X",
};

export function Footer({
  footer,
  socialLinks,
  siteName,
}: {
  footer: FooterColumn[];
  socialLinks: SocialLink[];
  siteName: string;
}) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <IconCross className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-medium">{siteName}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Un espacio para conocer, estudiar y vivir la Palabra cada día.
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
                {socialLinks.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                    {SOCIAL_LABELS[s.platform]}
                  </a>
                ))}
              </div>
            )}
          </div>

          {footer.map((col) => (
            <div key={col.id}>
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

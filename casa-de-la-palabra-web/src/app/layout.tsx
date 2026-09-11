import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooter, getNavigation, getSiteSettings, getSocialLinks } from "@/lib/data/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Casa de la Palabra",
    template: "%s · Casa de la Palabra",
  },
  description:
    "Un espacio para acercarte a Dios a través de la Biblia, el aprendizaje, el contenido y la comunidad.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, navigation, footer, socialLinks] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
    getFooter(),
    getSocialLinks(),
  ]);

  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar navigation={navigation} siteName={settings.site_name} />
        <main className="flex-1">{children}</main>
        <Footer footer={footer} socialLinks={socialLinks} siteName={settings.site_name} />
      </body>
    </html>
  );
}

import { createClient } from "@/lib/supabase/server";
import { PageHeader, ComingSoon } from "@/components/layout/page-header";

export const metadata = { title: "Nosotros" };

export default async function NosotrosPage() {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("casa_pages")
    .select("title, content")
    .eq("slug", "nosotros")
    .eq("status", "published")
    .maybeSingle();

  const content = page?.content as { body?: string } | null;

  return (
    <div>
      <PageHeader eyebrow="Nosotros" title={page?.title ?? "Quiénes somos"} />
      {content?.body ? (
        <div className="mx-auto max-w-2xl whitespace-pre-line px-4 pb-24 text-sm leading-relaxed sm:px-6 lg:px-8">
          {content.body}
        </div>
      ) : (
        <ComingSoon label="El contenido de esta página" />
      )}
    </div>
  );
}

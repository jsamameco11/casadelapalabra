import { Suspense } from "react";
import { BibleSearch } from "@/components/biblia/bible-search";

export const metadata = { title: "Buscar en la Biblia" };

export default function BuscarPage() {
  return (
    <Suspense>
      <BibleSearch />
    </Suspense>
  );
}

import { Suspense } from "react";
import { RebetGame } from "@/components/rebet/rebet-game";

export default function RebetJugarPage() {
  return (
    <Suspense>
      <RebetGame />
    </Suspense>
  );
}

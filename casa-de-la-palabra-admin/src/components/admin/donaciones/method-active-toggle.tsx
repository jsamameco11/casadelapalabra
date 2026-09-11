"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MethodActiveToggle({ id, initialActive }: { id: string; initialActive: boolean }) {
  const supabase = createClient();
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !active;
    const { error } = await supabase.from("casa_donation_methods").update({ is_active: next }).eq("id", id);
    setSaving(false);
    if (!error) setActive(next);
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`rounded-full px-3 py-1 text-xs transition-colors ${
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      } disabled:opacity-60`}
    >
      {active ? "Activo" : "Pendiente de configurar"}
    </button>
  );
}

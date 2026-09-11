import { createClient } from "@/lib/supabase/server";

export type CasaRole = "super_admin" | "admin" | "editor" | "author" | "user";

export interface CurrentStaff {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: CasaRole;
}

const STAFF_ROLES: CasaRole[] = ["super_admin", "admin", "editor", "author"];

// Server-side helper: resolves the signed-in user's Casa de la Palabra role.
// Returns null when there's no session OR the account isn't staff — callers
// decide whether that means "redirect to /login" or "show access denied".
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("casa_profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as CasaRole) ?? "user";
  if (!STAFF_ROLES.includes(role)) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    role,
  };
}

export function isAdmin(role: CasaRole) {
  return role === "super_admin" || role === "admin";
}

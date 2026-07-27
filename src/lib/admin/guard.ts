/**
 * Server-side access guards for the /admin section. SERVER ONLY.
 *
 * Role boundaries (step 14): a `teacher` may only reach Grading (/admin/review);
 * an `admin` reaches everything. These helpers resolve the caller's role and
 * redirect when they lack access, so every admin page/action can gate in one line.
 */

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/supabase/types";

export interface AdminUser {
  id: string;
  email?: string;
  role: Role;
}

async function resolveRole(redirectTo: string): Promise<AdminUser> {
  const supabase = await createClient();
  let user: { id: string; email?: string } | null = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    user = null;
  }
  if (!user) redirect(`/login?redirectedFrom=${redirectTo}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "candidate") as Role;
  return { id: user.id, email: user.email, role };
}

/** Require staff (admin or teacher). Candidates are sent to their dashboard. */
export async function requireStaff(
  redirectTo = "/admin",
): Promise<AdminUser> {
  const u = await resolveRole(redirectTo);
  if (u.role !== "admin" && u.role !== "teacher") redirect("/dashboard");
  return u;
}

/** Require admin. Teachers are sent to the one area they can use (Grading). */
export async function requireAdmin(
  redirectTo = "/admin",
): Promise<AdminUser> {
  const u = await resolveRole(redirectTo);
  if (u.role !== "admin") {
    redirect(u.role === "teacher" ? "/admin/review" : "/dashboard");
  }
  return u;
}

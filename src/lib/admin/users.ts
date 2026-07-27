/**
 * Admin helpers to resolve auth user emails (which live in auth.users, not
 * profiles). SERVER ONLY — uses the service-role admin API.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

export interface AuthUserLite {
  id: string;
  email: string | null;
  created_at: string | null;
}

/** List auth users (first page up to `perPage`). Small user base assumed. */
export async function listAuthUsers(perPage = 1000): Promise<AuthUserLite[]> {
  const svc = createServiceRoleClient();
  const { data } = await svc.auth.admin.listUsers({ page: 1, perPage });
  return (data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at ?? null,
  }));
}

/** Map of user id → email for display. */
export async function emailMap(): Promise<Map<string, string>> {
  const users = await listAuthUsers();
  return new Map(users.map((u) => [u.id, u.email ?? "—"]));
}

/**
 * Admin audit log (#9). SERVER ONLY. Records key admin actions with the actor,
 * action, target, and a JSON detail blob. Writes via the service role; the
 * table has no candidate-facing RLS policies (service-role only).
 *
 * Best-effort: an audit-write failure must never break the action it records.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/guard";

export interface AuditEntry {
  action: string; // e.g. "access_codes.generate", "certificate.revoke"
  targetType?: string; // e.g. "attempt", "item", "certificate"
  targetId?: string;
  detail?: Record<string, unknown>;
}

export async function writeAudit(
  actor: Pick<AdminUser, "id" | "email">,
  entry: AuditEntry,
): Promise<void> {
  try {
    await createServiceRoleClient()
      .from("audit_log")
      .insert({
        actor_id: actor.id,
        actor_email: actor.email ?? null,
        action: entry.action,
        target_type: entry.targetType ?? null,
        target_id: entry.targetId ?? null,
        detail: (entry.detail ?? null) as unknown as never,
      });
  } catch {
    // Audit logging is best-effort; never fail the underlying action over it.
  }
}

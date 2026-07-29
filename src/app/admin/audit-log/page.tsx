import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader, TableWrap } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Admin — Audit log" };

function fmt(d: string | null): string {
  return d ? d.slice(0, 19).replace("T", " ") : "—";
}

const ACTION_LABEL: Record<string, string> = {
  "access_codes.generate": "Generated access codes",
  "item.create": "Created item",
  "item.update": "Edited item",
  "item.bulk_create": "Bulk-created items",
  "grade.decide": "Grade approve/reject",
  "grade.manual": "Manual grade override",
  "certificate.revoke": "Revoked certificate",
  "certificate.reinstate": "Reinstated certificate",
  "attempt.review": "Reviewed flagged attempt",
};

export default async function AuditLogPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { data: rows } = await svc
    .from("audit_log")
    .select("id, actor_email, action, target_type, target_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Audit log"
        description="Key admin actions — access codes, item edits, grade overrides, certificate status, and flagged-exam reviews. Newest first."
      />

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">When</th>
            <th className="p-3">Actor</th>
            <th className="p-3">Action</th>
            <th className="p-3">Target</th>
            <th className="p-3">Detail</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={r.id} className="border-b border-gold/10 last:border-0">
              <td className="whitespace-nowrap p-3 tabular-nums text-muted-foreground">{fmt(r.created_at)}</td>
              <td className="p-3">{r.actor_email ?? "—"}</td>
              <td className="p-3 font-medium text-charcoal">{ACTION_LABEL[r.action] ?? r.action}</td>
              <td className="p-3 text-xs text-muted-foreground">
                {r.target_type ? (
                  <>
                    {r.target_type}
                    {r.target_id ? ` · ${String(r.target_id).slice(0, 8)}` : ""}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground">
                {r.detail ? JSON.stringify(r.detail) : ""}
              </td>
            </tr>
          ))}
          {(rows ?? []).length === 0 && (
            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No audit entries yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

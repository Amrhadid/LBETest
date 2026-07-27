import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader, TableWrap } from "@/app/admin/ui";
import { GenerateCodes, RevokeCode } from "@/app/admin/access-codes/CodeControls";

export const metadata: Metadata = { title: "Admin — Access Codes" };

export default async function AdminAccessCodesPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const [{ data: codes }, emails] = await Promise.all([
    svc
      .from("access_codes")
      .select("id, code, status, redeemed_by, redeemed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    emailMap(),
  ]);

  const counts = { unused: 0, used: 0, revoked: 0 } as Record<string, number>;
  for (const c of codes ?? []) counts[c.status] = (counts[c.status] ?? 0) + 1;

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Access Codes"
        description="Generate access codes for candidates and track their status."
      />

      <div className="mb-6">
        <GenerateCodes />
        <p className="mt-2 text-sm text-muted-foreground">
          {counts.unused ?? 0} unused · {counts.used ?? 0} used · {counts.revoked ?? 0} revoked
        </p>
      </div>

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Code</th>
            <th className="p-3">Status</th>
            <th className="p-3">Redeemed by</th>
            <th className="p-3">Created</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(codes ?? []).map((c) => (
            <tr key={c.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3 font-mono">{c.code}</td>
              <td className="p-3">
                <span
                  className={
                    c.status === "unused" ? "text-emerald-700"
                    : c.status === "used" ? "text-muted-foreground"
                    : "text-rose-700"
                  }
                >
                  {c.status}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">
                {c.redeemed_by ? (emails.get(c.redeemed_by) ?? c.redeemed_by.slice(0, 8)) : "—"}
              </td>
              <td className="p-3 text-muted-foreground">{(c.created_at ?? "").slice(0, 10)}</td>
              <td className="p-3 text-right">
                {c.status === "unused" ? <RevokeCode id={c.id} /> : <span className="text-xs text-muted-foreground">—</span>}
              </td>
            </tr>
          ))}
          {(codes ?? []).length === 0 && (
            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No access codes yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

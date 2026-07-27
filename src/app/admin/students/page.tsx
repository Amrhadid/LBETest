import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader, TableWrap } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Admin — Students" };

export default async function AdminStudentsPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();

  const [{ data: profiles }, { data: attempts }, { data: certs }, emails] =
    await Promise.all([
      svc.from("profiles").select("id, full_name, role").eq("role", "candidate"),
      svc.from("attempts").select("user_id, status, lbe_level").eq("is_preview", false),
      svc.from("certificates").select("user_id, status"),
      emailMap(),
    ]);

  const attemptsByUser = new Map<string, { total: number; bestLevel: number | null }>();
  for (const a of attempts ?? []) {
    const e = attemptsByUser.get(a.user_id) ?? { total: 0, bestLevel: null };
    e.total += 1;
    if (a.lbe_level != null) e.bestLevel = Math.max(e.bestLevel ?? 0, a.lbe_level);
    attemptsByUser.set(a.user_id, e);
  }
  const certsByUser = new Map<string, number>();
  for (const c of certs ?? []) {
    if (c.status === "valid") certsByUser.set(c.user_id, (certsByUser.get(c.user_id) ?? 0) + 1);
  }

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Students"
        description="Candidate accounts with their attempt and certificate history."
      />

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Attempts</th>
            <th className="p-3">Best level</th>
            <th className="p-3">Certificates</th>
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => {
            const a = attemptsByUser.get(p.id);
            return (
              <tr key={p.id} className="border-b border-gold/10 last:border-0">
                <td className="p-3 font-medium">{p.full_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{emails.get(p.id) ?? "—"}</td>
                <td className="p-3">{a?.total ?? 0}</td>
                <td className="p-3">{a?.bestLevel ? `LBE ${a.bestLevel}` : "—"}</td>
                <td className="p-3">{certsByUser.get(p.id) ?? 0}</td>
              </tr>
            );
          })}
          {(profiles ?? []).length === 0 && (
            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No students yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

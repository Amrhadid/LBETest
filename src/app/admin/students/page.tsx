import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader, TableWrap } from "@/app/admin/ui";
import { VISIT_PURPOSE_LABELS } from "@/lib/auth/onboarding";

export const metadata: Metadata = { title: "Admin — Students" };

function fmtDate(d: string | null): string {
  return d ? d.slice(0, 10) : "—";
}

export default async function AdminStudentsPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();

  const [{ data: profiles }, { data: attempts }, { data: certs }, emails] =
    await Promise.all([
      svc
        .from("profiles")
        .select(
          "id, full_name, role, date_of_birth, current_job, target_job, visit_purpose, country_of_origin, onboarded_at",
        )
        .eq("role", "candidate"),
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
        description="Candidate accounts with their onboarding profile, attempt and certificate history."
      />

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Born</th>
            <th className="p-3">Country</th>
            <th className="p-3">Job</th>
            <th className="p-3">Purpose</th>
            <th className="p-3">Attempts</th>
            <th className="p-3">Best level</th>
            <th className="p-3">Certificates</th>
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => {
            const a = attemptsByUser.get(p.id);
            const job = p.current_job
              ? p.current_job
              : p.target_job
                ? `Target: ${p.target_job}`
                : "—";
            const purpose = p.visit_purpose
              ? (VISIT_PURPOSE_LABELS[p.visit_purpose] ?? p.visit_purpose)
              : "—";
            return (
              <tr key={p.id} className="border-b border-gold/10 last:border-0">
                <td className="p-3 font-medium">
                  {p.full_name ?? "—"}
                  {!p.onboarded_at && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      Not onboarded
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{emails.get(p.id) ?? "—"}</td>
                <td className="p-3 tabular-nums text-muted-foreground">{fmtDate(p.date_of_birth)}</td>
                <td className="p-3">{p.country_of_origin ?? "—"}</td>
                <td className="p-3">{job}</td>
                <td className="p-3">{purpose}</td>
                <td className="p-3">{a?.total ?? 0}</td>
                <td className="p-3">{a?.bestLevel ? `LBE ${a.bestLevel}` : "—"}</td>
                <td className="p-3">{certsByUser.get(p.id) ?? 0}</td>
              </tr>
            );
          })}
          {(profiles ?? []).length === 0 && (
            <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No students yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

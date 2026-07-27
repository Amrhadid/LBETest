import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader, TableWrap } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Admin — Attempts" };

function fmt(d: string | null): string {
  return d ? d.slice(0, 16).replace("T", " ") : "—";
}

export default async function AdminAttemptsPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const [{ data: attempts }, emails] = await Promise.all([
    svc
      .from("attempts")
      .select("id, user_id, status, final_score, lbe_level, submitted_at, created_at")
      .eq("is_preview", false)
      .order("created_at", { ascending: false })
      .limit(500),
    emailMap(),
  ]);

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Attempts / Results"
        description="Every real attempt with its status, final score and certified level. Preview runs are excluded."
      />

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Candidate</th>
            <th className="p-3">Status</th>
            <th className="p-3">Score</th>
            <th className="p-3">Level</th>
            <th className="p-3">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {(attempts ?? []).map((a) => (
            <tr key={a.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3">{emails.get(a.user_id) ?? a.user_id.slice(0, 8)}</td>
              <td className="p-3">
                <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium capitalize">
                  {a.status.replace("_", " ")}
                </span>
              </td>
              <td className="p-3">{a.final_score ?? "—"}</td>
              <td className="p-3">{a.lbe_level ? `LBE ${a.lbe_level}` : "—"}</td>
              <td className="p-3 text-muted-foreground">{fmt(a.submitted_at)}</td>
            </tr>
          ))}
          {(attempts ?? []).length === 0 && (
            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No attempts yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

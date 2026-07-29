import type { Metadata } from "next";
import Link from "next/link";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader, TableWrap } from "@/app/admin/ui";
import { TrustBadge } from "@/app/admin/attempts/TrustBadge";

export const metadata: Metadata = { title: "Admin — Attempts" };

function fmt(d: string | null): string {
  return d ? d.slice(0, 16).replace("T", " ") : "—";
}

export default async function AdminAttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view } = await searchParams;
  const flagged = view === "flagged";
  const svc = createServiceRoleClient();

  let query = svc
    .from("attempts")
    .select(
      "id, user_id, status, final_score, lbe_level, submitted_at, created_at, trust_score, country, is_datacenter, review_status",
    )
    .eq("is_preview", false);

  query = flagged
    ? query.order("trust_score", { ascending: false, nullsFirst: false }).limit(500)
    : query.order("created_at", { ascending: false }).limit(500);

  const [{ data: attempts }, emails] = await Promise.all([query, emailMap()]);

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Attempts / Results"
        description="Every real attempt with its status, final score and certified level. Preview runs are excluded."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/attempts"
          className={
            "rounded-full border px-3 py-1 text-sm " +
            (!flagged
              ? "border-gold bg-gold/15 text-charcoal"
              : "border-gold/25 text-muted-foreground hover:bg-gold/8")
          }
        >
          All (newest)
        </Link>
        <Link
          href="/admin/attempts?view=flagged"
          className={
            "rounded-full border px-3 py-1 text-sm " +
            (flagged
              ? "border-gold bg-gold/15 text-charcoal"
              : "border-gold/25 text-muted-foreground hover:bg-gold/8")
          }
        >
          Flagged (most suspicious)
        </Link>
      </div>

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Candidate</th>
            <th className="p-3">Trust</th>
            <th className="p-3">Review</th>
            <th className="p-3">Status</th>
            <th className="p-3">Score</th>
            <th className="p-3">Level</th>
            <th className="p-3">From</th>
            <th className="p-3">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {(attempts ?? []).map((a) => (
            <tr key={a.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3">
                <Link href={`/admin/attempts/${a.id}`} className="text-gold underline-offset-4 hover:underline">
                  {emails.get(a.user_id) ?? a.user_id.slice(0, 8)}
                </Link>
              </td>
              <td className="p-3"><TrustBadge score={a.trust_score} /></td>
              <td className="p-3 text-xs">
                {a.review_status === "cleared" ? (
                  <span className="text-emerald-700">Cleared</span>
                ) : a.review_status === "confirmed_violation" ? (
                  <span className="font-medium text-red-700">Violation</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="p-3">
                <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium capitalize">
                  {a.status.replace("_", " ")}
                </span>
              </td>
              <td className="p-3">{a.final_score ?? "—"}</td>
              <td className="p-3">{a.lbe_level ? `LBE ${a.lbe_level}` : "—"}</td>
              <td className="p-3 text-xs text-muted-foreground">
                {a.country ?? "—"}
                {a.is_datacenter && (
                  <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 font-medium text-amber-800">DC</span>
                )}
              </td>
              <td className="p-3 text-muted-foreground">{fmt(a.submitted_at)}</td>
            </tr>
          ))}
          {(attempts ?? []).length === 0 && (
            <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No attempts yet.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

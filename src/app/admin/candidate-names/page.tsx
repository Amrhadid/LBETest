import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader } from "@/app/admin/ui";
import { NameReviewActions } from "@/app/admin/candidate-names/NameReviewActions";

export const metadata: Metadata = { title: "Admin — Candidate names" };

const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export default async function CandidateNamesPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();

  const [{ data: profiles }, emails] = await Promise.all([
    svc
      .from("profiles")
      .select("id, full_name, name_status")
      .eq("role", "candidate")
      .not("full_name", "is", null),
    emailMap(),
  ]);

  // Pending (and never-reviewed) first, then rejected, then approved.
  const rows = (profiles ?? []).slice().sort((a, b) => {
    const rank = (s: string | null) =>
      s === "approved" ? 2 : s === "rejected" ? 1 : 0;
    return rank(a.name_status) - rank(b.name_status);
  });

  const pendingCount = rows.filter(
    (p) => (p.name_status ?? "pending") === "pending",
  ).length;

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Candidate names"
        description="Verify each candidate's name against their national ID or passport. Approve as-is, correct it to match the document, or reject it. The approved name is what prints on the certificate — regenerate an already-issued certificate to apply a corrected name."
      />
      <p className="mb-6 text-sm text-muted-foreground">
        {pendingCount} awaiting review
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No candidate names to review yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((p) => {
            const status = p.name_status ?? "pending";
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-gold/20 bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      {emails.get(p.id) ?? p.id.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 truncate text-lg font-semibold text-charcoal">
                      {p.full_name ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[status] ?? ""}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="mt-4">
                  <NameReviewActions
                    userId={p.id}
                    status={status}
                    name={p.full_name ?? ""}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

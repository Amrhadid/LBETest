import type { Metadata } from "next";
import Link from "next/link";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader, StatCard } from "@/app/admin/ui";
import { PreviewButton } from "@/app/admin/PreviewButton";

export const metadata: Metadata = { title: "Admin — Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();

  const [attempts, scored, passed, certs, pending] = await Promise.all([
    svc.from("attempts").select("id", { count: "exact", head: true }).eq("is_preview", false),
    svc.from("attempts").select("id", { count: "exact", head: true }).eq("is_preview", false).eq("status", "scored"),
    svc.from("attempts").select("id", { count: "exact", head: true }).eq("is_preview", false).not("lbe_level", "is", null),
    svc.from("certificates").select("id", { count: "exact", head: true }).eq("status", "valid"),
    svc.from("responses").select("id", { count: "exact", head: true }).eq("grade_status", "pending_approval"),
  ]);

  const attemptsN = attempts.count ?? 0;
  const scoredN = scored.count ?? 0;
  const passedN = passed.count ?? 0;
  const passRate = scoredN > 0 ? Math.round((passedN / scoredN) * 100) : 0;

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Overview"
        description="Live platform metrics. Preview attempts are excluded from every figure."
        actions={<PreviewButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attempts" value={attemptsN} hint="Real (non-preview) attempts" />
        <StatCard label="Pass rate" value={`${passRate}%`} hint={`${passedN}/${scoredN} scored attempts certified`} />
        <StatCard label="Certificates" value={certs.count ?? 0} hint="Currently valid" />
        <StatCard label="Pending reviews" value={pending.count ?? 0} hint="AI grades awaiting approval" />
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/attempts?view=needs_grading" className="text-gold underline-offset-4 hover:underline">Go to grading →</Link>
        <Link href="/admin/attempts" className="text-gold underline-offset-4 hover:underline">View attempts →</Link>
        <Link href="/admin/access-codes" className="text-gold underline-offset-4 hover:underline">Manage access codes →</Link>
      </div>
    </div>
  );
}

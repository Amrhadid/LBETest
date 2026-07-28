import type { Metadata } from "next";
import Link from "next/link";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { ACTIVE_EXAM_ID } from "@/lib/exam/config";
import { AdminHeader } from "@/app/admin/ui";
import { BulkForm } from "@/app/admin/library/BulkForm";

export const metadata: Metadata = { title: "Admin — Add section (bulk)" };

export default async function BulkAddPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; level?: string }>;
}) {
  await requireAdmin();
  const { exam, level } = await searchParams;
  const examId = exam || ACTIVE_EXAM_ID;
  const lbeLevel = Math.min(5, Math.max(1, Number(level) || 1));

  const svc = createServiceRoleClient();
  const { count } = await svc
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId)
    .eq("lbe_level", lbeLevel)
    .eq("active", true);

  return (
    <div>
      <AdminHeader
        eyebrow="Exam Library"
        title={`Add section ${lbeLevel} (bulk)`}
        description="Create a whole section's 10 items at once — fill the repeated form or paste a JSON array. All 10 save together, or none do."
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Section:</span>
        {[1, 2, 3, 4, 5].map((l) => (
          <Link
            key={l}
            href={`/admin/library/bulk?exam=${examId}&level=${l}`}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (l === lbeLevel
                ? "border-gold bg-gold/15 text-charcoal"
                : "border-gold/25 text-muted-foreground hover:bg-gold/8")
            }
          >
            {l}
          </Link>
        ))}
      </div>

      <BulkForm examId={examId} level={lbeLevel} existingCount={count ?? 0} />
    </div>
  );
}

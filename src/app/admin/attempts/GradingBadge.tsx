import type { AttemptGradingStatus } from "@/lib/exam/grading-status";

/**
 * Grading-status pill for admin attempt views. Same pill style as TrustBadge.
 * Null (no AI-graded items on the attempt) renders a muted dash.
 */
const META: Record<
  AttemptGradingStatus,
  { label: string; tone: string; title: string }
> = {
  needs_review: {
    label: "Needs review",
    tone: "bg-red-100 text-red-800 border-red-300",
    title: "AI grading failed on at least one item — grade it by hand",
  },
  pending: {
    label: "Pending grading",
    tone: "bg-amber-100 text-amber-800 border-amber-300",
    title: "AI grade proposals are awaiting approval",
  },
  graded: {
    label: "Approved",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300",
    title: "Every AI-graded item on this attempt is resolved",
  },
};

export function GradingBadge({
  status,
}: {
  status: AttemptGradingStatus | null;
}) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const m = META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${m.tone}`}
      title={m.title}
    >
      {m.label}
    </span>
  );
}

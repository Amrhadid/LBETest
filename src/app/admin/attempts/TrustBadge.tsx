import { TRUST_MAX } from "@/lib/exam/trust";

/**
 * Suspicion-score pill for admin views. Higher = more suspicious. Green (low),
 * amber (moderate), red (high). Null = never scored yet.
 */
export function TrustBadge({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const s = Number(score);
  const tone =
    s >= 40
      ? "bg-red-100 text-red-800 border-red-300"
      : s >= 15
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-emerald-100 text-emerald-800 border-emerald-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}
      title={`Suspicion score ${s} / ${TRUST_MAX} (higher = more suspicious)`}
    >
      {s}
    </span>
  );
}

/**
 * Per-attempt AI-grading status, derived from its responses' grade_status.
 *
 * grade_status is NULL for auto-graded (MCQ) responses and set only on
 * AI-graded / approval-gated items (types 3/4/5/6): pending_approval | approved
 * | rejected | failed. We fold those into a single attempt-level state so the
 * Attempts list can show at a glance whether grading is still outstanding.
 *
 * Pure — no I/O — so it's trivially testable and usable on server or client.
 */

export type AttemptGradingStatus = "pending" | "needs_review" | "graded";

/** Response grade_status values that mean "grading still to do" on an attempt. */
export const NEEDS_GRADING_STATUSES = ["pending_approval", "failed"] as const;

/**
 * Collapse an attempt's response grade_statuses into one badge state:
 *  - `needs_review` — at least one AI grade failed (errored); needs a human.
 *  - `pending`      — at least one proposal is awaiting approval.
 *  - `graded`       — every AI-graded item is resolved (approved/rejected).
 *  - `null`         — the attempt has no AI-graded items (nothing to show).
 *
 * `needs_review` outranks `pending` outranks `graded`, so the badge always
 * surfaces the most actionable state.
 */
export function attemptGradingStatus(
  statuses: (string | null | undefined)[],
): AttemptGradingStatus | null {
  let hasFailed = false;
  let hasPending = false;
  let hasResolved = false;
  for (const s of statuses) {
    if (!s) continue;
    if (s === "failed") hasFailed = true;
    else if (s === "pending_approval") hasPending = true;
    else if (s === "approved" || s === "rejected") hasResolved = true;
  }
  if (hasFailed) return "needs_review";
  if (hasPending) return "pending";
  if (hasResolved) return "graded";
  return null;
}

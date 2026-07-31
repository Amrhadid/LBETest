/**
 * Onboarding constants + gate helper, shared by server and client.
 *
 * After a candidate signs up with Google they must complete a short profile
 * before using the site (see /onboarding). `onboarded_at` on the profile marks
 * completion; only `candidate` accounts are gated (staff never see onboarding).
 */

export const VISIT_PURPOSES = [
  { value: "learn", label: "To learn / improve my Business English" },
  { value: "lbe_exam", label: "To take the LBE exam" },
  { value: "test_employees", label: "To test my employees / team" },
] as const;

export type VisitPurpose = (typeof VISIT_PURPOSES)[number]["value"];

export const VISIT_PURPOSE_VALUES = VISIT_PURPOSES.map((p) => p.value);

/** Short admin-facing label for a stored visit_purpose value. */
export const VISIT_PURPOSE_LABELS: Record<string, string> = {
  learn: "Learn",
  lbe_exam: "Take LBE exam",
  test_employees: "Test employees",
};

/**
 * Whether this profile still needs onboarding. Only candidates are gated — a
 * missing/other role (staff) is never sent through onboarding.
 */
export function profileNeedsOnboarding(
  profile: { role: string | null; onboarded_at: string | null } | null,
): boolean {
  if (!profile) return false;
  return profile.role === "candidate" && !profile.onboarded_at;
}

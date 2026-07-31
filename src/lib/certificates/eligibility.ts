/**
 * Certificate eligibility — pure, framework-free, and testable.
 *
 * Rules (owner's decision, step 11):
 *  - Certified level = the highest CONTIGUOUS section passed starting at
 *    Section 1. Passing Sections 1,2,3 but failing 2 in the middle still
 *    certifies only Level 1 (contiguity breaks at the first failed section).
 *  - A section passes at >= SECTION_PASS_THRESHOLD (6) correct of its items.
 *    The correct count combines auto-graded MCQs (types 1-2) and approved
 *    AI/teacher grades (types 3-6) — both live on responses.is_correct.
 *  - A real certificate is issued only when the certified level is >= 1
 *    (i.e. Section 1 passed). Otherwise there's no certified level, so no
 *    credential is created — only the internal result record on the attempt.
 */

import { SECTION_PASS_THRESHOLD } from "@/lib/exam/types";

export const LEVEL_NAMES: Record<number, string> = {
  1: "Foundation",
  2: "Operational",
  3: "Professional",
  4: "Advanced",
  5: "Executive",
};

/** Correct/total tally for one section. */
export interface SectionTally {
  level: number; // 1..5
  correct: number;
  total: number;
}

/** Does a section pass? (>= threshold correct.) */
export function sectionPasses(
  tally: Pick<SectionTally, "correct">,
  threshold = SECTION_PASS_THRESHOLD,
): boolean {
  return tally.correct >= threshold;
}

/**
 * Highest contiguous section passed from Section 1. Returns 0 when Section 1
 * itself is not passed (→ no certificate, only an internal result record).
 */
export function certifiedLevel(
  tallies: SectionTally[],
  threshold = SECTION_PASS_THRESHOLD,
): number {
  const byLevel = new Map(tallies.map((t) => [t.level, t]));
  let level = 0;
  for (let l = 1; l <= 5; l++) {
    const t = byLevel.get(l);
    if (t && sectionPasses(t, threshold)) level = l;
    else break; // contiguity breaks at the first non-passed section
  }
  return level;
}

/** Total correct across all sections — the attempt's authoritative raw score. */
export function totalCorrect(tallies: SectionTally[]): number {
  return tallies.reduce((sum, t) => sum + t.correct, 0);
}

export function levelName(level: number): string {
  return LEVEL_NAMES[level] ?? "";
}

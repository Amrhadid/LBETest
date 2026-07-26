/**
 * Auto-grading + provisional section scoring.
 *
 * Only question types 1, 2 and 4 are auto-graded here. Types 3, 5 and 6 are
 * spoken/written free responses that are graded by AI in a later step, so they
 * return `null` (pending) and are excluded from the provisional pass/fail.
 */

import {
  type ExamItem,
  type ResponseAnswer,
  QuestionType,
  LbeLevel,
  ITEMS_PER_SECTION,
  SECTION_PASS_THRESHOLD,
  isAutoGraded,
} from "@/lib/exam/types";

export type ScoreResult = { is_correct: boolean; score: number };

/** Normalize free text for tolerant term matching. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, for single-typo tolerance on short terms. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Fuzzy term match: exact after normalization, or edit distance ≤ 1. */
function fuzzyMatches(guess: string, accepted: string[]): boolean {
  const g = normalize(guess);
  if (!g) return false;
  return accepted.some((term) => {
    const t = normalize(term);
    if (!t) return false;
    if (g === t) return true;
    // Allow one typo, but only for terms long enough that it's meaningful.
    const tolerance = t.length >= 5 ? 1 : 0;
    return editDistance(g, t) <= tolerance;
  });
}

/**
 * Auto-grade a single response.
 * @returns ScoreResult for types 1/2/4, or `null` (pending) for 3/5/6.
 */
export function scoreResponse(
  item: ExamItem,
  answer: ResponseAnswer,
): ScoreResult | null {
  if (!isAutoGraded(item.question_type)) {
    return null; // types 3, 5, 6 — graded later by AI
  }

  switch (item.question_type) {
    case QuestionType.ChooseCorrect:
    case QuestionType.ChooseWrong: {
      const selected =
        answer && "selected" in answer ? answer.selected : undefined;
      const key = item.answer_key;
      const correct =
        key && typeof key === "object" && "correct" in key
          ? (key.correct as string)
          : undefined;
      const is_correct = !!selected && !!correct && selected === correct;
      return { is_correct, score: is_correct ? 1 : 0 };
    }

    case QuestionType.NameTheTerm: {
      const text = answer && "text" in answer ? answer.text : undefined;
      const key = item.answer_key;
      const accept =
        key && typeof key === "object" && "accept" in key
          ? (key.accept as string[])
          : [];
      const is_correct =
        !!text && Array.isArray(accept) && fuzzyMatches(text, accept);
      return { is_correct, score: is_correct ? 1 : 0 };
    }

    default:
      return null;
  }
}

export interface SectionResult {
  lbeLevel: LbeLevel;
  /** Items in this section that were auto-graded (types 1/2/4). */
  autoGradedCount: number;
  /** Auto-graded items answered correctly. */
  correctCount: number;
  /** Total items expected in a section. */
  total: number;
  /** Correct answers required to (provisionally) pass. */
  threshold: number;
  /** Free responses (types 3/5/6) still awaiting AI grading. */
  pendingCount: number;
  /** Provisional pass, using auto-graded items only. */
  provisionalPass: boolean;
  /** Always true here — a reminder that pending items may change the outcome. */
  provisional: true;
}

/** A response paired with its item, as fed to the section scorer. */
export type GradedInput = { item: ExamItem; answer: ResponseAnswer };

/**
 * Compute a provisional section result from all responses tagged to a section.
 *
 * Pass/fail uses ONLY the auto-graded items (types 1/2/4). Because a section
 * has {@link ITEMS_PER_SECTION} items but only some are auto-graded, this is
 * explicitly provisional — types 3/5/6 are still pending AI grading.
 */
export function getSectionResult(
  responses: GradedInput[],
  lbeLevel: LbeLevel,
): SectionResult {
  const inSection = responses.filter((r) => r.item.lbe_level === lbeLevel);

  let autoGradedCount = 0;
  let correctCount = 0;
  let pendingCount = 0;

  for (const { item, answer } of inSection) {
    const result = scoreResponse(item, answer);
    if (result === null) {
      pendingCount += 1;
    } else {
      autoGradedCount += 1;
      if (result.is_correct) correctCount += 1;
    }
  }

  return {
    lbeLevel,
    autoGradedCount,
    correctCount,
    total: ITEMS_PER_SECTION,
    threshold: SECTION_PASS_THRESHOLD,
    pendingCount,
    provisionalPass: correctCount >= SECTION_PASS_THRESHOLD,
    provisional: true,
  };
}

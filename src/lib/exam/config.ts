/**
 * Exam-level configuration read from `exams.config` (jsonb), plus the id of the
 * exam the runner currently serves.
 *
 * For now the runner targets the seeded placeholder exam. When real exams
 * exist, resolve this from a query (e.g. the published exam) instead of a
 * constant.
 */

export const ACTIVE_EXAM_ID = "11111111-1111-1111-1111-111111111111";

/** Default per-section countdown, in seconds (12 minutes → 60 min total). */
export const DEFAULT_SECTION_SECONDS = 720;

export interface ExamConfig {
  /** Seconds allowed per section. Overridable via exams.config.section_seconds. */
  section_seconds: number;
}

/** Parse an exam's config jsonb into typed runner settings. */
export function parseExamConfig(config: unknown): ExamConfig {
  const raw = (config ?? {}) as Record<string, unknown>;
  const seconds = Number(raw.section_seconds);
  return {
    section_seconds:
      Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_SECTION_SECONDS,
  };
}

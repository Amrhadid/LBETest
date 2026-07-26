/**
 * AI grading core for open-ended items — pure, framework-free, and testable.
 *
 * Scope (step 9, part 1): text items only — type 4 (name the term) and
 * type 5 (write the definition), graded against `items.rubric`. Voice items
 * (types 3 & 6) are deferred until a transcription step exists.
 *
 * The actual Claude call lives in `grading.server.ts`; everything here is
 * deterministic so the pipeline can be unit-tested without a live API key.
 */

import { QuestionType, type ExamItem, type ResponseAnswer } from "@/lib/exam/types";

/** Grading model. Chosen for the text-grading cost/quality balance. */
export const GRADING_MODEL = "claude-sonnet-5";

/** Confidence below this flags the response for human review. */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;
/** A section whose correct count is within this band of the pass line is flagged. */
export const NEAR_THRESHOLD_BAND = 1;

/** `items.rubric` shape (see 0005_ai_grading.sql). */
export interface Rubric {
  version?: number;
  max_score?: number;
  pass_threshold?: number;
  criteria?: { id: string; description: string; weight?: number }[];
  model_answer?: string;
  guidance?: string;
}

/** Normalized grade for one response. */
export interface GradeResult {
  score: number; // 0..max_score
  confidence: number; // 0..1
  feedback: string;
  criteria: { id: string; met: boolean; note?: string }[];
  is_correct: boolean;
}

/** Only text open-ended items are graded in this step. */
export function isAiTextGraded(type: QuestionType): boolean {
  return (
    type === QuestionType.NameTheTerm || type === QuestionType.WriteTheDefinition
  );
}

/** JSON-Schema for Claude structured output (no numeric bounds — clamped in code). */
export const GRADE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "confidence", "feedback", "criteria"],
  properties: {
    score: { type: "number", description: "Points awarded, 0..max_score" },
    confidence: { type: "number", description: "Your confidence in this grade, 0..1" },
    feedback: { type: "string", description: "One or two sentences, for internal review only" },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "met"],
        properties: {
          id: { type: "string" },
          met: { type: "boolean" },
          note: { type: "string" },
        },
      },
    },
  },
} as const;

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

export function getRubric(item: ExamItem): Rubric {
  const r = item.rubric;
  return r && typeof r === "object" ? (r as Rubric) : {};
}

/** Extract the candidate's typed text for a type 4/5 answer. */
export function answerText(answer: ResponseAnswer): string {
  if (!answer || typeof answer !== "object") return "";
  if ("text" in answer && typeof answer.text === "string") return answer.text;
  if ("definition" in answer && typeof answer.definition === "string")
    return answer.definition;
  return "";
}

/** Build the grader system + user prompts for one item + answer. */
export function buildGradingPrompt(
  item: ExamItem,
  candidateAnswer: string,
): { system: string; user: string } {
  const rubric = getRubric(item);
  const maxScore = rubric.max_score ?? 1;
  const kind =
    item.question_type === QuestionType.NameTheTerm
      ? "name the correct business-English term"
      : "write a definition of a business-English term";

  const system =
    "You are an expert grader for the Locrativ Business English (LBE) exam. " +
    "Grade the candidate's response strictly and fairly against the rubric provided. " +
    "Score only what the rubric asks for; ignore spelling/grammar unless the rubric says otherwise. " +
    "Report your genuine confidence — use a low value when the answer is borderline, ambiguous, or the rubric doesn't clearly cover it. " +
    "Return ONLY the structured JSON.";

  const user = [
    `Task type: ${kind}.`,
    item.prompt ? `Question shown to candidate:\n${item.prompt}` : "",
    `\nRubric:`,
    `- Max score: ${maxScore}`,
    rubric.criteria?.length
      ? `- Criteria:\n${rubric.criteria.map((c) => `  - (${c.id}) ${c.description}`).join("\n")}`
      : "- Criteria: (none specified — grade holistically against the model answer)",
    rubric.model_answer ? `- Model answer: ${rubric.model_answer}` : "",
    rubric.guidance ? `- Guidance: ${rubric.guidance}` : "",
    `\nCandidate's answer:\n${candidateAnswer || "(no answer submitted)"}`,
    `\nReturn: score (0..${maxScore}), confidence (0..1), a short feedback note, and per-criterion met flags.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

/** Normalize a raw model JSON grade into a clamped GradeResult. */
export function normalizeGrade(raw: unknown, rubric: Rubric): GradeResult {
  const maxScore = rubric.max_score ?? 1;
  const passThreshold = rubric.pass_threshold ?? 0.6;
  const obj = (raw ?? {}) as Record<string, unknown>;

  const score = clamp(Number(obj.score), 0, maxScore);
  const confidence = clamp(Number(obj.confidence), 0, 1);
  const feedback = typeof obj.feedback === "string" ? obj.feedback : "";
  const criteria = Array.isArray(obj.criteria)
    ? (obj.criteria as Record<string, unknown>[]).map((c) => ({
        id: String(c.id ?? ""),
        met: Boolean(c.met),
        note: typeof c.note === "string" ? c.note : undefined,
      }))
    : [];

  const is_correct = score >= passThreshold * maxScore;
  return { score, confidence, feedback, criteria, is_correct };
}

/** A model call: given prompts + schema, return the parsed JSON grade object. */
export type GraderCall = (args: {
  system: string;
  user: string;
  schema: unknown;
}) => Promise<unknown>;

/**
 * Grade one text response by orchestrating prompt → model call → normalize.
 * The `call` is injected so this is fully testable without a live API key.
 */
export async function gradeTextResponse(
  item: ExamItem,
  candidateAnswer: string,
  call: GraderCall,
): Promise<GradeResult> {
  const { system, user } = buildGradingPrompt(item, candidateAnswer);
  const raw = await call({ system, user, schema: GRADE_SCHEMA });
  return normalizeGrade(raw, getRubric(item));
}

/** Flags to raise for a single graded response (low-confidence). */
export function responseFlags(
  grade: GradeResult,
): { reason: "low_confidence"; detail: Record<string, unknown> }[] {
  if (grade.confidence < LOW_CONFIDENCE_THRESHOLD) {
    return [
      {
        reason: "low_confidence",
        detail: { confidence: grade.confidence, threshold: LOW_CONFIDENCE_THRESHOLD },
      },
    ];
  }
  return [];
}

/** Whether a section's correct count sits close enough to the pass line to review. */
export function isNearThreshold(
  correctCount: number,
  threshold = 6,
  band = NEAR_THRESHOLD_BAND,
): boolean {
  return Math.abs(correctCount - threshold) <= band;
}

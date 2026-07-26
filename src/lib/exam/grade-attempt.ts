/**
 * Grade the text open-ended responses (types 4 & 5) of a submitted attempt,
 * persist AI scores, and flag low-confidence / near-threshold cases into the
 * review_queue for step-10 human review.
 *
 * SERVER ONLY. Writes authoritatively via the service-role client (grading is
 * not client-supplied). Voice items (types 3 & 6) are skipped — deferred until
 * a transcription step exists. Requires ANTHROPIC_API_KEY on the Worker; if it
 * isn't set, each grade attempt records a `grading_error` flag rather than
 * throwing, so the caller still gets a summary.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { anthropicGraderCall } from "@/lib/exam/grading.server";
import {
  GRADING_MODEL,
  gradeTextResponse,
  answerText,
  responseFlags,
  isNearThreshold,
  isAiTextGraded,
  type GraderCall,
} from "@/lib/exam/grading";
import {
  QuestionType,
  SECTION_PASS_THRESHOLD,
  type ExamItem,
  type ItemOption,
  type AnswerKey,
  type ResponseAnswer,
  type SourceType,
  type LbeLevel,
} from "@/lib/exam/types";

export interface GradeAttemptSummary {
  graded: number;
  errors: number;
  flags: number;
}

function toExamItem(row: Record<string, unknown>): ExamItem {
  return {
    id: String(row.id),
    exam_id: (row.exam_id as string | null) ?? null,
    source_type: (row.source_type as SourceType | null) ?? null,
    question_type: row.question_type as QuestionType,
    lbe_level: row.lbe_level as LbeLevel,
    prompt: (row.prompt as string | null) ?? null,
    media_url: (row.media_url as string | null) ?? null,
    options: (row.options as ItemOption[] | null) ?? null,
    answer_key: (row.answer_key as AnswerKey) ?? null,
    rubric: row.rubric ?? null,
    active: Boolean(row.active),
  };
}

/**
 * @param call injectable grader (defaults to Claude Sonnet 5) — tests pass a mock.
 */
export async function gradeAttemptTextResponses(
  attemptId: string,
  call: GraderCall = anthropicGraderCall,
): Promise<GradeAttemptSummary> {
  const svc = createServiceRoleClient();

  const { data: responses } = await svc
    .from("responses")
    .select("id, item_id, answer")
    .eq("attempt_id", attemptId);

  const itemIds = [
    ...new Set((responses ?? []).map((r) => r.item_id).filter(Boolean)),
  ] as string[];
  if (itemIds.length === 0) return { graded: 0, errors: 0, flags: 0 };

  const { data: itemRows } = await svc
    .from("items")
    .select(
      "id, exam_id, source_type, question_type, lbe_level, prompt, media_url, options, answer_key, rubric, active",
    )
    .in("id", itemIds);

  const items = new Map<string, ExamItem>();
  for (const row of itemRows ?? []) {
    items.set(String(row.id), toExamItem(row as Record<string, unknown>));
  }

  let graded = 0;
  let errors = 0;
  let flags = 0;
  // AI-correct tally per section, to combine with auto-graded scores below.
  const aiCorrectByLevel = new Map<number, number>();

  for (const r of responses ?? []) {
    if (!r.item_id) continue;
    const item = items.get(r.item_id as string);
    if (!item || !isAiTextGraded(item.question_type)) continue;

    const text = answerText(r.answer as ResponseAnswer);

    try {
      const grade = await gradeTextResponse(item, text, call);

      await svc
        .from("responses")
        .update({
          score: grade.score,
          is_correct: grade.is_correct,
          ai_confidence: grade.confidence,
          ai_feedback: {
            feedback: grade.feedback,
            criteria: grade.criteria,
            model: GRADING_MODEL,
          } as unknown as never,
          graded_by: "ai",
          graded_at: new Date().toISOString(),
        })
        .eq("id", r.id);

      graded += 1;
      if (grade.is_correct) {
        aiCorrectByLevel.set(
          item.lbe_level,
          (aiCorrectByLevel.get(item.lbe_level) ?? 0) + 1,
        );
      }

      for (const f of responseFlags(grade)) {
        await svc.from("review_queue").upsert(
          {
            attempt_id: attemptId,
            response_id: r.id,
            item_id: item.id,
            lbe_level: item.lbe_level,
            reason: f.reason,
            detail: f.detail as unknown as never,
          },
          { onConflict: "response_id,reason" },
        );
        flags += 1;
      }
    } catch (e) {
      errors += 1;
      await svc.from("review_queue").upsert(
        {
          attempt_id: attemptId,
          response_id: r.id,
          item_id: item.id,
          lbe_level: item.lbe_level,
          reason: "grading_error",
          detail: {
            message: e instanceof Error ? e.message : "grading failed",
          } as unknown as never,
        },
        { onConflict: "response_id,reason" },
      );
    }
  }

  // Near-threshold flags: auto-graded correct (from section_scores) + AI-correct.
  // Rebuild them cleanly for this attempt so re-runs stay idempotent.
  await svc
    .from("review_queue")
    .delete()
    .eq("attempt_id", attemptId)
    .eq("reason", "near_threshold");

  const { data: sections } = await svc
    .from("section_scores")
    .select("lbe_level, auto_correct_count")
    .eq("attempt_id", attemptId);

  for (const s of sections ?? []) {
    const total =
      (s.auto_correct_count ?? 0) + (aiCorrectByLevel.get(s.lbe_level) ?? 0);
    if (isNearThreshold(total, SECTION_PASS_THRESHOLD)) {
      await svc.from("review_queue").insert({
        attempt_id: attemptId,
        lbe_level: s.lbe_level,
        reason: "near_threshold",
        detail: {
          correct: total,
          threshold: SECTION_PASS_THRESHOLD,
        } as unknown as never,
      });
      flags += 1;
    }
  }

  return { graded, errors, flags };
}

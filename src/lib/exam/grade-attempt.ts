/**
 * Grade the AI-gradable open-ended responses of a submitted attempt and stage
 * them for human approval.
 *
 * Covers text items — type 4 (name the term) & type 5 (write the definition) —
 * and voice items — type 3 (respond to a situation) & type 6 (speak about the
 * source). Voice answers are transcribed (Google STT) before grading.
 *
 * APPROVAL GATE (supersedes the earlier "spot-check only" design): an AI grade
 * is NEVER final on its own. Every AI grade is written as a *proposal*
 * (ai_score / ai_is_correct / grade_status='pending_approval') and does NOT
 * touch the authoritative score/is_correct columns. A teacher/admin promotes it
 * via the approve_response_grade RPC before it counts toward section pass/fail,
 * final score, or a certificate. Every proposal is queued into review_queue so
 * the approval step is a required gate, not an optional spot-check.
 *
 * SERVER ONLY. Writes via the service-role client. Requires ANTHROPIC_API_KEY
 * (grading) and, for voice, GOOGLE_STT_API_KEY (transcription); a missing key
 * or a call failure records a `grading_error` flag rather than throwing, so the
 * caller still gets a summary.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { anthropicGraderCall } from "@/lib/exam/grading.server";
import {
  googleTranscribeCall,
  transcribeResponseAudio,
  type TranscribeCall,
} from "@/lib/exam/transcription.server";
import {
  GRADING_MODEL,
  LOW_CONFIDENCE_THRESHOLD,
  gradeTextResponse,
  answerText,
  responseFlags,
  isNearThreshold,
  isAiGraded,
  isAiVoiceGraded,
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

/** Storage path for a voice answer, or null if none was recorded. */
function audioPathOf(answer: ResponseAnswer): string | null {
  if (answer && typeof answer === "object" && "audio_path" in answer) {
    const p = (answer as { audio_path?: unknown }).audio_path;
    if (typeof p === "string" && p.length > 0) return p;
  }
  return null;
}

/**
 * @param call       injectable grader (defaults to Claude Sonnet 5) — tests mock it.
 * @param transcribe injectable STT (defaults to Google STT) — tests mock it.
 */
export async function gradeAttemptTextResponses(
  attemptId: string,
  call: GraderCall = anthropicGraderCall,
  transcribe: TranscribeCall = googleTranscribeCall,
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
  // AI-proposed correct tally per section — a review hint only. Proposals do
  // not count until approved, so this feeds near-threshold flags, not scores.
  const aiCorrectByLevel = new Map<number, number>();

  const flagResponse = async (
    r: { id: string },
    item: ExamItem,
    reason: string,
    detail: Record<string, unknown>,
  ) => {
    await svc.from("review_queue").upsert(
      {
        attempt_id: attemptId,
        response_id: r.id,
        item_id: item.id,
        lbe_level: item.lbe_level,
        reason,
        detail: detail as unknown as never,
      },
      { onConflict: "response_id,reason" },
    );
    flags += 1;
  };

  // Record an AI-grading failure so it's VISIBLE to staff: mark the response
  // grade_status='failed' (surfaces on the attempt detail page) and keep the error on
  // ai_feedback. The student's answer + audio are untouched, so a teacher can
  // grade it by hand. Also drop a grading_error flag into the review queue.
  const markFailed = async (
    r: { id: string },
    item: ExamItem,
    message: string,
  ) => {
    await svc
      .from("responses")
      .update({
        grade_status: "failed",
        ai_feedback: {
          error: message,
          model: GRADING_MODEL,
        } as unknown as never,
      })
      .eq("id", r.id);
    await flagResponse(r, item, "grading_error", { message });
  };

  for (const r of responses ?? []) {
    if (!r.item_id) continue;
    const item = items.get(r.item_id as string);
    if (!item || !isAiGraded(item.question_type)) continue;

    try {
      // 1. Resolve the candidate's answer text. Voice items are transcribed
      //    first (and the transcript is persisted for reviewers).
      let candidateText: string;
      if (isAiVoiceGraded(item.question_type)) {
        const audioPath = audioPathOf(r.answer as ResponseAnswer);
        if (!audioPath) {
          errors += 1;
          await markFailed(r, item, "no audio recorded for spoken response");
          continue;
        }
        const tr = await transcribeResponseAudio(audioPath, transcribe);
        candidateText = tr.text;
        await svc
          .from("responses")
          .update({ transcript: candidateText })
          .eq("id", r.id);
        // Multiple-speaker detection (#6): a spoken answer should be one voice.
        // If diarization heard more than one, flag it on the attempt (fed into
        // the trust score). Sticky: once true it stays true.
        if (tr.speakerCount > 1) {
          await svc
            .from("attempts")
            .update({ multi_speaker: true })
            .eq("id", attemptId);
        }
      } else {
        candidateText = answerText(r.answer as ResponseAnswer);
      }

      // 2. Grade → proposal (NOT authoritative). Leave score/is_correct NULL.
      const grade = await gradeTextResponse(item, candidateText, call);

      await svc
        .from("responses")
        .update({
          ai_score: grade.score,
          ai_is_correct: grade.is_correct,
          ai_confidence: grade.confidence,
          ai_feedback: {
            feedback: grade.feedback,
            criteria: grade.criteria,
            model: GRADING_MODEL,
          } as unknown as never,
          grade_status: "pending_approval",
        })
        .eq("id", r.id);

      graded += 1;
      if (grade.is_correct) {
        aiCorrectByLevel.set(
          item.lbe_level,
          (aiCorrectByLevel.get(item.lbe_level) ?? 0) + 1,
        );
      }

      // 3. Queue for mandatory approval, plus a low-confidence flag if warranted.
      await flagResponse(r, item, "pending_approval", {
        ai_score: grade.score,
        ai_is_correct: grade.is_correct,
        confidence: grade.confidence,
      });
      for (const f of responseFlags(grade)) {
        await flagResponse(r, item, f.reason, f.detail);
      }
    } catch (e) {
      errors += 1;
      await markFailed(
        r,
        item,
        e instanceof Error ? e.message : "grading failed",
      );
    }
  }

  // Near-threshold flags: auto-graded correct (section_scores) + AI-proposed
  // correct. A review hint; rebuilt cleanly per attempt so re-runs stay idempotent.
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

/** Fresh proposal (or failure) produced by regrading a single response. */
export interface RegradeOutcome {
  status: "pending_approval" | "failed";
  aiScore: number | null;
  aiIsCorrect: boolean | null;
  aiConfidence: number | null;
  feedback: string;
  criteria: { id: string; met: boolean; note?: string }[];
  transcript: string | null;
  errorMessage: string | null;
}

/**
 * Re-run the AI grading pipeline for ONE response and re-stage it for approval.
 *
 * Used from the attempt detail page to retry a response whose AI grade failed (e.g. the
 * transcription bug) or to refresh a still-pending proposal — without a full
 * re-grade of the attempt or a manual SQL edit. Honours the approval gate: an
 * already-approved response is never silently changed (that goes through the
 * manual-override flow), so this refuses to touch grade_status='approved'.
 *
 * Mirrors one iteration of {@link gradeAttemptTextResponses}: transcribe voice
 * answers, grade to a proposal (pending_approval), and keep the review_queue in
 * step. On any error the response is marked 'failed' with the message preserved
 * for manual grading, exactly like the batch path.
 *
 * SERVER ONLY (service-role writes). Callers MUST enforce staff authorization.
 */
export async function regradeResponse(
  responseId: string,
  call: GraderCall = anthropicGraderCall,
  transcribe: TranscribeCall = googleTranscribeCall,
): Promise<RegradeOutcome> {
  const svc = createServiceRoleClient();

  const { data: r } = await svc
    .from("responses")
    .select("id, attempt_id, item_id, answer, transcript, grade_status")
    .eq("id", responseId)
    .maybeSingle();
  if (!r) throw new Error("Response not found.");
  if (r.grade_status === "approved") {
    throw new Error(
      "This grade is already approved — use manual override to change it.",
    );
  }
  if (!r.item_id) throw new Error("Response has no item to grade.");

  const { data: itemRow } = await svc
    .from("items")
    .select(
      "id, exam_id, source_type, question_type, lbe_level, prompt, media_url, options, answer_key, rubric, active",
    )
    .eq("id", r.item_id)
    .maybeSingle();
  if (!itemRow) throw new Error("Item not found.");
  const item = toExamItem(itemRow as Record<string, unknown>);
  if (!isAiGraded(item.question_type)) {
    throw new Error("This response is not AI-graded.");
  }

  const attemptId = r.attempt_id as string;

  const upsertFlag = (reason: string, detail: Record<string, unknown>) =>
    svc.from("review_queue").upsert(
      {
        attempt_id: attemptId,
        response_id: r.id,
        item_id: item.id,
        lbe_level: item.lbe_level,
        reason,
        detail: detail as unknown as never,
      },
      { onConflict: "response_id,reason" },
    );
  const clearFlag = (reason: string) =>
    svc.from("review_queue").delete().eq("response_id", r.id).eq("reason", reason);

  try {
    // 1. Resolve the answer text — voice answers are re-transcribed first.
    let candidateText: string;
    let transcript: string | null = (r.transcript as string | null) ?? null;
    if (isAiVoiceGraded(item.question_type)) {
      const audioPath = audioPathOf(r.answer as ResponseAnswer);
      if (!audioPath) throw new Error("no audio recorded for spoken response");
      const tr = await transcribeResponseAudio(audioPath, transcribe);
      candidateText = tr.text;
      transcript = tr.text;
      await svc.from("responses").update({ transcript }).eq("id", r.id);
      if (tr.speakerCount > 1) {
        await svc
          .from("attempts")
          .update({ multi_speaker: true })
          .eq("id", attemptId);
      }
    } else {
      candidateText = answerText(r.answer as ResponseAnswer);
    }

    // 2. Grade → fresh proposal (NOT authoritative; awaits approval).
    const grade = await gradeTextResponse(item, candidateText, call);

    await svc
      .from("responses")
      .update({
        ai_score: grade.score,
        ai_is_correct: grade.is_correct,
        ai_confidence: grade.confidence,
        ai_feedback: {
          feedback: grade.feedback,
          criteria: grade.criteria,
          model: GRADING_MODEL,
        } as unknown as never,
        grade_status: "pending_approval",
      })
      .eq("id", r.id);

    // 3. Re-stage the review queue: a fresh proposal awaiting approval, with any
    //    stale failure cleared and the low-confidence flag kept in step. The
    //    attempt-level near_threshold hint is left for the next full grade pass.
    await clearFlag("grading_error");
    await upsertFlag("pending_approval", {
      ai_score: grade.score,
      ai_is_correct: grade.is_correct,
      confidence: grade.confidence,
    });
    for (const f of responseFlags(grade)) {
      await upsertFlag(f.reason, f.detail);
    }
    if (grade.confidence >= LOW_CONFIDENCE_THRESHOLD) {
      await clearFlag("low_confidence");
    }

    return {
      status: "pending_approval",
      aiScore: grade.score,
      aiIsCorrect: grade.is_correct,
      aiConfidence: grade.confidence,
      feedback: grade.feedback,
      criteria: grade.criteria,
      transcript,
      errorMessage: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "grading failed";
    await svc
      .from("responses")
      .update({
        grade_status: "failed",
        ai_feedback: { error: message, model: GRADING_MODEL } as unknown as never,
      })
      .eq("id", r.id);
    await clearFlag("pending_approval");
    await clearFlag("low_confidence");
    await upsertFlag("grading_error", { message });

    return {
      status: "failed",
      aiScore: null,
      aiIsCorrect: null,
      aiConfidence: null,
      feedback: "",
      criteria: [],
      transcript: (r.transcript as string | null) ?? null,
      errorMessage: message,
    };
  }
}

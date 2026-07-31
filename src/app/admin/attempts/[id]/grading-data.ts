/**
 * Load the AI-grading review cards for a single attempt (server-only).
 *
 * Pulls the attempt's open-ended responses that still need a human — proposals
 * awaiting approval (pending_approval) and AI failures (failed) — resolves the
 * item/rubric/transcript, and mints short-lived signed URLs for voice playback.
 * Shaped into {@link PendingGrade}s the GradingReview client component renders.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { RESPONSE_AUDIO_BUCKET } from "@/lib/exam/storage";
import { answerText, isAiVoiceGraded, type Rubric } from "@/lib/exam/grading";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type ResponseAnswer,
} from "@/lib/exam/types";
import type { PendingGrade } from "@/app/admin/attempts/[id]/grading-types";

interface ItemRow {
  id: string;
  prompt: string | null;
  question_type: number | null;
  lbe_level: number | null;
  rubric: unknown;
}

interface ResponseRow {
  id: string;
  attempt_id: string;
  item_id: string | null;
  answer: unknown;
  transcript: string | null;
  ai_score: number | null;
  ai_is_correct: boolean | null;
  ai_confidence: number | null;
  ai_feedback: unknown;
  grade_status: string | null;
}

export async function loadAttemptGrades(
  svc: SupabaseClient,
  attemptId: string,
): Promise<PendingGrade[]> {
  const { data: responses } = await svc
    .from("responses")
    .select(
      "id, attempt_id, item_id, answer, transcript, ai_score, ai_is_correct, ai_confidence, ai_feedback, grade_status",
    )
    .eq("attempt_id", attemptId)
    .in("grade_status", ["pending_approval", "failed"])
    .order("created_at", { ascending: true });

  const rows = (responses ?? []) as ResponseRow[];
  if (rows.length === 0) return [];

  const itemIds = [
    ...new Set(rows.map((r) => r.item_id).filter(Boolean)),
  ] as string[];

  const items = new Map<string, ItemRow>();
  if (itemIds.length > 0) {
    const { data: itemRows } = await svc
      .from("items")
      .select("id, prompt, question_type, lbe_level, rubric")
      .in("id", itemIds);
    for (const it of (itemRows ?? []) as ItemRow[]) items.set(it.id, it);
  }

  const grades: PendingGrade[] = [];
  for (const r of rows) {
    const item = r.item_id ? items.get(r.item_id) : undefined;
    const qType = (item?.question_type ?? 0) as QuestionType;
    const isVoice = isAiVoiceGraded(qType);
    const rubric = (item?.rubric ?? {}) as Rubric;
    const feedbackObj = (r.ai_feedback ?? {}) as {
      feedback?: string;
      criteria?: { id: string; met: boolean; note?: string }[];
      error?: string;
    };
    const failed = r.grade_status === "failed";

    // Signed URL for voice playback (staff read policy on the private bucket).
    let audioUrl: string | null = null;
    const answer = r.answer as ResponseAnswer;
    if (
      isVoice &&
      answer &&
      typeof answer === "object" &&
      "audio_path" in answer &&
      typeof answer.audio_path === "string"
    ) {
      const { data: signed } = await svc.storage
        .from(RESPONSE_AUDIO_BUCKET)
        .createSignedUrl(answer.audio_path, 60 * 30);
      audioUrl = signed?.signedUrl ?? null;
    }

    grades.push({
      responseId: r.id,
      attemptId: r.attempt_id,
      questionType: qType,
      questionTypeLabel:
        QUESTION_TYPE_LABELS[qType as QuestionType] ?? `Type ${qType}`,
      lbeLevel: item?.lbe_level ?? null,
      prompt: item?.prompt ?? null,
      isVoice,
      candidateText: isVoice ? (r.transcript ?? "") : answerText(answer),
      audioUrl,
      aiScore: r.ai_score,
      maxScore: rubric.max_score ?? 1,
      aiIsCorrect: r.ai_is_correct,
      aiConfidence: r.ai_confidence,
      feedback: feedbackObj.feedback ?? "",
      criteria: feedbackObj.criteria ?? [],
      failed,
      errorMessage: failed ? (feedbackObj.error ?? "AI grading failed.") : null,
    });
  }

  return grades;
}

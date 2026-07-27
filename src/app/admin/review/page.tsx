import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { RESPONSE_AUDIO_BUCKET } from "@/lib/exam/storage";
import { answerText, isAiVoiceGraded, type Rubric } from "@/lib/exam/grading";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type ResponseAnswer,
} from "@/lib/exam/types";
import { ReviewList, type PendingGrade } from "@/app/admin/review/ReviewList";

export const metadata: Metadata = {
  title: "Grade review",
  description: "Approve or reject AI-proposed grades.",
};

const STAFF_ROLES = new Set(["teacher", "admin"]);

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

export default async function ReviewPage() {
  const supabase = await createClient();

  // Gate: staff only. Never crash on an auth/session error.
  let role: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectedFrom=/admin/review");
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  } catch {
    redirect("/login?redirectedFrom=/admin/review");
  }
  if (!role || !STAFF_ROLES.has(role)) redirect("/dashboard");

  // Responses awaiting approval (RLS already restricts these to staff).
  const { data: responses } = await supabase
    .from("responses")
    .select(
      "id, attempt_id, item_id, answer, transcript, ai_score, ai_is_correct, ai_confidence, ai_feedback, grade_status",
    )
    .in("grade_status", ["pending_approval", "failed"])
    .order("created_at", { ascending: true });

  const rows = (responses ?? []) as ResponseRow[];

  const itemIds = [
    ...new Set(rows.map((r) => r.item_id).filter(Boolean)),
  ] as string[];

  const items = new Map<string, ItemRow>();
  if (itemIds.length > 0) {
    const { data: itemRows } = await supabase
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
      const { data: signed } = await supabase.storage
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
      candidateText: isVoice
        ? (r.transcript ?? "")
        : answerText(answer),
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

  return (
    <PageShell>
      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">Staff</p>
          <h1 className="font-serif-display mt-2 text-4xl text-charcoal sm:text-5xl">
            Grade review
          </h1>
          <p className="mt-3 max-w-2xl text-charcoal/70">
            AI grades are proposals only. Approve to count a grade toward the
            candidate&apos;s section pass/fail, final score, and certificate, or
            reject to send it back for manual grading.
          </p>
          <p className="mt-1 text-sm text-charcoal/50">
            {grades.length} awaiting approval
          </p>
          <div className="mt-8">
            <ReviewList grades={grades} />
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { finalizeAttempt } from "@/lib/certificates/finalize";
import { writeAudit } from "@/lib/exam/audit.server";

export type ReviewActionState = { error?: string; message?: string };

/**
 * After a grading decision, try to finalize the attempt. No-ops unless the
 * attempt is fully resolved (no pending/failed grades). Best-effort — a
 * certificate hiccup must never surface as a grading error.
 */
async function tryFinalize(attemptId: string | undefined) {
  if (!attemptId) return;
  try {
    await finalizeAttempt(attemptId);
  } catch {
    // Certificate generation is best-effort; the grade is already recorded.
  }
}

/**
 * Approve or reject a pending AI grade. Authorization is enforced in the
 * database by approve_response_grade (staff only); this action just forwards
 * the signed-in caller's decision. On approve, the RPC promotes the AI
 * proposal into the authoritative score/is_correct columns; on reject it leaves
 * them NULL for manual grading. Either way it resolves the response's
 * review_queue rows.
 */
export async function decideGrade(
  responseId: string,
  decision: "approve" | "reject",
  attemptId?: string,
): Promise<ReviewActionState> {
  if (decision !== "approve" && decision !== "reject") {
    return { error: "Invalid decision." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.rpc("approve_response_grade", {
    p_response_id: responseId,
    p_decision: decision,
  });

  if (error) {
    if (error.message.includes("not authorized")) {
      return { error: "You don't have permission to approve grades." };
    }
    if (error.message.includes("not pending approval")) {
      return { error: "This grade was already decided." };
    }
    return { error: "Could not record your decision. Please try again." };
  }

  await writeAudit(
    { id: user.id, email: user.email },
    {
      action: "grade.decide",
      targetType: "response",
      targetId: responseId,
      detail: { decision, attemptId },
    },
  );
  await tryFinalize(attemptId);
  revalidatePath("/admin/review");
  return {
    message: decision === "approve" ? "Approved." : "Rejected.",
  };
}

/**
 * Grade a response by hand — used when AI grading failed (bad key / API error /
 * rate limit) or when a teacher overrides. Writes the score authoritatively via
 * grade_response_manual (staff only, enforced in the DB). The student's answer
 * and audio are preserved independently, so this always has what it needs.
 */
export async function gradeManually(
  responseId: string,
  score: number,
  isCorrect: boolean,
  attemptId?: string,
): Promise<ReviewActionState> {
  if (!Number.isFinite(score) || score < 0) {
    return { error: "Enter a valid score." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.rpc("grade_response_manual", {
    p_response_id: responseId,
    p_score: score,
    p_is_correct: isCorrect,
  });

  if (error) {
    if (error.message.includes("not authorized")) {
      return { error: "You don't have permission to grade." };
    }
    return { error: "Could not save the grade. Please try again." };
  }

  await writeAudit(
    { id: user.id, email: user.email },
    {
      action: "grade.manual",
      targetType: "response",
      targetId: responseId,
      detail: { score, isCorrect, attemptId },
    },
  );
  await tryFinalize(attemptId);
  revalidatePath("/admin/review");
  return { message: "Graded." };
}

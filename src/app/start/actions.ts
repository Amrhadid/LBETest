"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ACTIVE_EXAM_ID } from "@/lib/exam/config";
import type { ResponseAnswer } from "@/lib/exam/types";

export type ActionState = { error?: string; message?: string };

/** Map redeem_access_code() Postgres errors to friendly messages. */
function redeemErrorMessage(raw: string): string {
  if (raw.includes("invalid_code")) return "That code isn't recognized. Check it and try again.";
  if (raw.includes("code_not_available"))
    return "That code has already been used or is no longer valid.";
  if (raw.includes("not_authenticated")) return "Please sign in and try again.";
  return "Could not redeem that code. Please try again.";
}

/** Redeem an access code for the signed-in user (atomic, via RPC). */
export async function redeemAccessCode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter your access code." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/start");

  const { error } = await supabase.rpc("redeem_access_code", { p_code: code });
  if (error) return { error: redeemErrorMessage(error.message) };

  revalidatePath("/start");
  return { message: "Code accepted." };
}

/**
 * Start (or resume) an attempt for the active exam.
 * - Resumes an existing in-progress attempt if present.
 * - Otherwise requires a redeemed access code not yet tied to an attempt.
 */
export async function startAttempt(): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/start");

  // Resume in-progress attempt if one exists.
  const { data: existing } = await supabase
    .from("attempts")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("exam_id", ACTIVE_EXAM_ID)
    .eq("status", "in_progress")
    .limit(1)
    .maybeSingle();

  if (existing) {
    revalidatePath("/start");
    return { message: "Resumed." };
  }

  // Find a redeemed code for this exam not already consumed by an attempt.
  const { data: codes } = await supabase
    .from("access_codes")
    .select("id")
    .eq("redeemed_by", user.id)
    .eq("exam_id", ACTIVE_EXAM_ID)
    .eq("status", "used");

  const { data: usedAttempts } = await supabase
    .from("attempts")
    .select("access_code_id")
    .eq("user_id", user.id)
    .eq("exam_id", ACTIVE_EXAM_ID);

  const consumed = new Set(
    (usedAttempts ?? []).map((a) => a.access_code_id).filter(Boolean),
  );
  const available = (codes ?? []).find((c) => !consumed.has(c.id));

  if (!available) {
    return {
      error:
        "You don't have an access code for this exam yet. Enter one below or contact us to purchase.",
    };
  }

  const { error } = await supabase.from("attempts").insert({
    user_id: user.id,
    exam_id: ACTIVE_EXAM_ID,
    access_code_id: available.id,
    status: "in_progress",
    started_at: new Date().toISOString(),
  });

  if (error) return { error: "Could not start the exam. Please try again." };

  revalidatePath("/start");
  return { message: "Started." };
}

/** useActionState-compatible wrapper around {@link startAttempt}. */
export async function startAttemptAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  return startAttempt();
}

/** Verify the attempt belongs to the caller and is still in progress. */
async function assertOwnedInProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  attemptId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("attempts")
    .select("id, status")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();
  return data && data.status === "in_progress";
}

/** Autosave a single response (upsert on attempt_id+item_id). */
export async function saveResponse(
  attemptId: string,
  itemId: string,
  answer: ResponseAnswer,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) {
    return { error: "This attempt is not active." };
  }

  const { error } = await supabase.from("responses").upsert(
    {
      attempt_id: attemptId,
      item_id: itemId,
      // answer is JSON-serializable; the column is jsonb.
      answer: answer as unknown as never,
    },
    { onConflict: "attempt_id,item_id" },
  );

  if (error) return { error: "Could not save your answer." };
  return { message: "saved" };
}

/** Append an attempt_events row (telemetry / lockdown log). */
export async function logEvent(
  attemptId: string,
  type: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("attempt_events").insert({
    attempt_id: attemptId,
    type,
    payload: (payload ?? {}) as unknown as never,
  });
}

/** Finalize the attempt: mark submitted. */
export async function submitAttempt(attemptId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) {
    return { error: "This attempt is not active." };
  }

  const { error } = await supabase
    .from("attempts")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not submit the exam." };

  await supabase.from("attempt_events").insert({
    attempt_id: attemptId,
    type: "attempt_submit",
    payload: {},
  });

  revalidatePath("/start");
  return { message: "submitted" };
}

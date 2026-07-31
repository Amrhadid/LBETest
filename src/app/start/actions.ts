"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { ACTIVE_EXAM_ID, parseExamConfig } from "@/lib/exam/config";
import { getSectionAnchors } from "@/lib/exam/timing.server";
import { isSectionExpired } from "@/lib/exam/timing";
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
  if (error) {
    // Idempotency: a slow connection can retry the Server Action, or the user
    // can double-submit. The FIRST call redeems the code (status→used,
    // redeemed_by=this user); a SECOND call then hits the now-used code and the
    // RPC raises `code_not_available`. That's a false error — the user IS
    // entitled. So on that specific error, check whether THIS user already owns
    // the code and, if so, treat the redemption as successful.
    if (error.message.includes("code_not_available")) {
      const { data: mine } = await supabase
        .from("access_codes")
        .select("id")
        .eq("code", code)
        .eq("redeemed_by", user.id)
        .maybeSingle();
      if (mine) {
        revalidatePath("/start");
        return { message: "Code accepted." };
      }
    }
    return { error: redeemErrorMessage(error.message) };
  }

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

  const { data: created, error } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      exam_id: ACTIVE_EXAM_ID,
      access_code_id: available.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not start the exam. Please try again." };

  // Country / network logging (#4): stamp the attempt with the Cloudflare edge
  // geo + AS org, flagging datacenter/hosting IPs. Service role (candidates have
  // no grant on these columns). Best-effort — never blocks starting the exam.
  if (created?.id) {
    try {
      const { readRequestNetwork } = await import("@/lib/exam/cf.server");
      const net = readRequestNetwork();
      await createServiceRoleClient()
        .from("attempts")
        .update({
          country: net.country,
          asn: net.asn,
          network: net.network,
          is_datacenter: net.isDatacenter,
        })
        .eq("id", created.id);
    } catch {
      // Geo enrichment is best-effort telemetry.
    }
  }

  // Item exposure tracking: this exam's active items are now served to a real
  // attempt. Best-effort, via the service role (RPC is service-role-only so
  // candidates can't skew counts). Preview attempts never call this.
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    await createServiceRoleClient().rpc("bump_item_exposure", {
      p_exam_id: ACTIVE_EXAM_ID,
    });
  } catch {
    // Exposure tracking must never block starting the exam.
  }

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

  // Server-side time enforcement: reject saves once the item's section has run
  // out (computed from the server-recorded section_start anchor, not the client
  // timer). This is what stops a returning candidate from answering past time.
  const svc = createServiceRoleClient();
  const [{ data: item }, { data: examRow }, anchors] = await Promise.all([
    svc.from("items").select("lbe_level").eq("id", itemId).maybeSingle(),
    svc.from("exams").select("config").eq("id", ACTIVE_EXAM_ID).maybeSingle(),
    getSectionAnchors(svc, attemptId),
  ]);
  const sectionSeconds = parseExamConfig(examRow?.config).section_seconds;
  const anchor = item ? anchors.get(item.lbe_level as number) : undefined;
  if (isSectionExpired(anchor, sectionSeconds, Date.now())) {
    return { error: "Time is up for this section." };
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

/**
 * Record a section's start ONCE (server timestamp), idempotently. The runner
 * calls this when a section opens; the earliest recorded start is the immutable
 * time anchor, so reloading the page can't reset the clock. Replaces the old
 * client-logged section_start.
 */
export async function beginSection(
  attemptId: string,
  lbeLevel: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) return;

  const { data: existing } = await supabase
    .from("attempt_events")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("type", "section_start")
    .contains("payload", { section: lbeLevel })
    .limit(1)
    .maybeSingle();
  if (existing) return; // anchor already set — keep it

  await supabase.from("attempt_events").insert({
    attempt_id: attemptId,
    type: "section_start",
    payload: { section: lbeLevel } as unknown as never,
  });
}

/**
 * Persist the client-computed device fingerprint (#8) onto the attempt. Written
 * via the service role after an ownership check (candidates have no grant on the
 * fingerprint column). Idempotent; only sets it once. Best-effort.
 */
export async function recordAttemptMeta(
  attemptId: string,
  meta: { fingerprint?: string },
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) return;

  const fp = (meta.fingerprint ?? "").trim();
  if (!fp) return;
  const svc = createServiceRoleClient();
  const { data: row } = await svc
    .from("attempts")
    .select("fingerprint")
    .eq("id", attemptId)
    .maybeSingle();
  if (row?.fingerprint) return; // keep the first fingerprint seen
  await svc.from("attempts").update({ fingerprint: fp }).eq("id", attemptId);
}

/**
 * Persist ID + selfie verification paths (#1) and mark the attempt verified.
 * Ownership-checked; service-role write (candidates have no grant on these
 * columns). Both images live in the private id-verification bucket.
 */
export async function saveIdVerification(
  attemptId: string,
  paths: { idPath: string; selfiePath: string },
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) {
    return { error: "This attempt is not active." };
  }
  const idPath = (paths.idPath ?? "").trim();
  const selfiePath = (paths.selfiePath ?? "").trim();
  // Paths must belong to this user (RLS convention: first segment = user id).
  if (!idPath.startsWith(`${user.id}/`) || !selfiePath.startsWith(`${user.id}/`)) {
    return { error: "Invalid image paths." };
  }
  const { error } = await createServiceRoleClient()
    .from("attempts")
    .update({
      id_image_path: idPath,
      selfie_path: selfiePath,
      id_verified: true,
    })
    .eq("id", attemptId);
  if (error) return { error: "Could not save your verification. Please retry." };
  return { message: "verified" };
}

/**
 * Flag that a continuous-recording stream (#2/#3/#4) has begun for the attempt.
 * Called once per kind on its first uploaded chunk. Ownership-checked; service
 * role. Best-effort.
 */
export async function markRecordingPresence(
  attemptId: string,
  which: { webcam?: boolean; mic?: boolean; screen?: boolean },
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) return;

  const patch: Record<string, boolean> = {};
  if (which.webcam) patch.has_webcam_rec = true;
  if (which.mic) patch.has_mic_rec = true;
  if (which.screen) patch.has_screen_rec = true;
  if (Object.keys(patch).length === 0) return;
  await createServiceRoleClient()
    .from("attempts")
    .update(patch as never)
    .eq("id", attemptId);
}

/**
 * Persist a room-scan object path (#6) after the client uploads the clip to the
 * private `room-scans` bucket. Ownership-checked; service-role write.
 */
export async function saveRoomScan(
  attemptId: string,
  path: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!(await assertOwnedInProgress(supabase, attemptId, user.id))) return;

  const clean = (path ?? "").trim();
  // Path must belong to this user (RLS convention: first segment = user id).
  if (!clean || !clean.startsWith(`${user.id}/`)) return;
  await createServiceRoleClient()
    .from("attempts")
    .update({ room_scan_path: clean })
    .eq("id", attemptId);
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

/**
 * Server-side auto-scoring of a section's selection items (types 1 & 2).
 * Runs when a section is submitted or auto-advances on timeout. Returns nothing
 * to the client — scoring is bookkeeping only, never shown to the candidate
 * (no interim feedback). Best-effort: a failure here never blocks the attempt.
 */
export async function scoreSection(
  attemptId: string,
  lbeLevel: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("score_section", {
    p_attempt_id: attemptId,
    p_lbe_level: lbeLevel,
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

  // Status transitions go through a SECURITY DEFINER RPC (in_progress →
  // submitted only). Candidates have no direct UPDATE grant on attempts.status,
  // so they can't set their attempt to 'scored'/anything via a raw API call.
  const { error } = await supabase.rpc("submit_attempt", {
    p_attempt_id: attemptId,
  });

  if (error) return { error: "Could not submit the exam." };

  await supabase.from("attempt_events").insert({
    attempt_id: attemptId,
    type: "attempt_submit",
    payload: {},
  });

  // Preview (reviewer) attempts never score, grade, or certify.
  const { data: previewRow } = await supabase
    .from("attempts")
    .select("is_preview")
    .eq("id", attemptId)
    .maybeSingle();
  if (previewRow?.is_preview) {
    revalidatePath("/start");
    return { message: "submitted" };
  }

  // Safety net: auto-score every section server-side (idempotent) in case a
  // per-section scoring call was missed. Never blocks submission.
  await supabase.rpc("score_attempt", { p_attempt_id: attemptId });

  // Grade the AI-gradable open-ended items (text 4/5, voice 3/6) into
  // pending-approval proposals. Best-effort: never fails the submission. The
  // proposals surface on the attempt detail page (/admin/attempts/[id]) for a teacher/admin to approve before
  // they count. Runs with the service role inside the grader.
  try {
    const { gradeAttemptTextResponses } = await import(
      "@/lib/exam/grade-attempt"
    );
    await gradeAttemptTextResponses(attemptId);
  } catch {
    // Missing keys or an API failure records grading_error flags internally;
    // don't block the candidate's submission on grading.
  }

  // Finalize now if nothing needs human approval (all-auto attempt): computes
  // the result, and issues a certificate when Section 1+ is passed. No-ops when
  // AI grades are pending approval — the review action finalizes then.
  try {
    const { finalizeAttempt } = await import("@/lib/certificates/finalize");
    await finalizeAttempt(attemptId);
  } catch {
    // Best-effort; certificate generation never blocks submission.
  }

  revalidatePath("/start");
  return { message: "submitted" };
}

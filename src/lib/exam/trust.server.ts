/**
 * Gather an attempt's suspicion signals, compute the composite score, and store
 * it. SERVER ONLY. Signals: focus loss (#events), fast sections (#2), duplicate
 * open-ended answers (#3), datacenter IP (#4), shared device fingerprint (#8),
 * and recorded violations. Cross-attempt signals (duplicates, fingerprint) use
 * only non-preview attempts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { ACTIVE_EXAM_ID, parseExamConfig } from "@/lib/exam/config";
import { getSectionAnchors } from "@/lib/exam/timing.server";
import {
  computeTrustScore, sectionMinSeconds, isSectionFast, textSimilarity,
  DUPLICATE_THRESHOLD, type TrustResult,
} from "@/lib/exam/trust";

const OPEN_ENDED = new Set([3, 4, 5, 6]);

function answerTextOf(answer: unknown, transcript: string | null, qtype: number): string {
  if (qtype === 3 || qtype === 6) return transcript ?? "";
  if (answer && typeof answer === "object") {
    const a = answer as Record<string, unknown>;
    if (typeof a.text === "string") return a.text;
    if (typeof a.definition === "string") return a.definition;
  }
  return "";
}

export interface DuplicateFinding {
  itemId: string;
  similarity: number;
  otherAttemptId: string;
}

/** Near-identical open-ended answers vs OTHER candidates on the same item. */
export async function findDuplicateAnswers(
  svc: SupabaseClient,
  attemptId: string,
): Promise<DuplicateFinding[]> {
  const { data: mine } = await svc
    .from("responses")
    .select("item_id, answer, transcript, items(question_type)")
    .eq("attempt_id", attemptId);

  const findings: DuplicateFinding[] = [];
  for (const r of mine ?? []) {
    const qtype = Number(
      (r as { items?: { question_type?: number } | null }).items?.question_type,
    );
    if (!OPEN_ENDED.has(qtype) || !r.item_id) continue;
    const myText = answerTextOf(r.answer, r.transcript as string | null, qtype);
    if (myText.trim().length < 8) continue; // too short to judge

    const { data: others } = await svc
      .from("responses")
      .select("attempt_id, answer, transcript, attempts!inner(is_preview)")
      .eq("item_id", r.item_id)
      .neq("attempt_id", attemptId)
      .limit(200);

    let best = 0;
    let bestAttempt = "";
    for (const o of others ?? []) {
      if ((o as { attempts?: { is_preview?: boolean } }).attempts?.is_preview) continue;
      const otherText = answerTextOf(o.answer, o.transcript as string | null, qtype);
      const sim = textSimilarity(myText, otherText);
      if (sim > best) { best = sim; bestAttempt = o.attempt_id as string; }
    }
    if (best >= DUPLICATE_THRESHOLD) {
      findings.push({ itemId: r.item_id as string, similarity: best, otherAttemptId: bestAttempt });
    }
  }
  return findings;
}

/** Count of sections finished implausibly fast (#2). */
async function countFastSections(
  svc: SupabaseClient,
  attemptId: string,
  sectionSeconds: number,
): Promise<number> {
  const [anchors, { data: items }, { data: submits }] = await Promise.all([
    getSectionAnchors(svc, attemptId),
    svc.from("items").select("lbe_level, prompt").eq("exam_id", ACTIVE_EXAM_ID).eq("active", true),
    svc.from("attempt_events").select("payload, at").eq("attempt_id", attemptId).eq("type", "section_submit"),
  ]);

  const words = new Map<number, number>();
  const counts = new Map<number, number>();
  for (const it of items ?? []) {
    const lvl = it.lbe_level as number;
    const w = (it.prompt as string | null)?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    words.set(lvl, (words.get(lvl) ?? 0) + w);
    counts.set(lvl, (counts.get(lvl) ?? 0) + 1);
  }
  const submitAt = new Map<number, number>();
  for (const s of submits ?? []) {
    const lvl = Number((s.payload as { section?: unknown } | null)?.section);
    const at = new Date(s.at as string).getTime();
    if (Number.isFinite(lvl) && !submitAt.has(lvl)) submitAt.set(lvl, at);
  }

  let fast = 0;
  for (const [lvl, start] of anchors) {
    const end = submitAt.get(lvl);
    if (end == null) continue;
    const actual = (end - start) / 1000;
    const min = Math.min(
      sectionSeconds,
      sectionMinSeconds(words.get(lvl) ?? 0, counts.get(lvl) ?? 0),
    );
    if (isSectionFast(actual, min)) fast++;
  }
  return fast;
}

async function fingerprintShared(
  svc: SupabaseClient,
  attemptId: string,
  fingerprint: string | null,
  userId: string,
): Promise<boolean> {
  if (!fingerprint) return false;
  const { data } = await svc
    .from("attempts")
    .select("user_id")
    .eq("fingerprint", fingerprint)
    .eq("is_preview", false);
  const users = new Set((data ?? []).map((a) => a.user_id));
  users.add(userId);
  return users.size > 1;
}

/** Compute the attempt's suspicion score from all signals and store it. */
export async function computeAndStoreTrust(
  attemptId: string,
): Promise<TrustResult | null> {
  const svc = createServiceRoleClient();
  const { data: attempt } = await svc
    .from("attempts")
    .select("id, user_id, is_preview, fingerprint, is_datacenter, violation_count, id_verified, no_face_count, multi_face_count, multi_speaker")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.is_preview) return null;

  const [{ data: examRow }, { data: events }, dups, fpShared] = await Promise.all([
    svc.from("exams").select("config").eq("id", ACTIVE_EXAM_ID).maybeSingle(),
    svc.from("attempt_events").select("type").eq("attempt_id", attemptId),
    findDuplicateAnswers(svc, attemptId),
    fingerprintShared(svc, attemptId, attempt.fingerprint, attempt.user_id),
  ]);

  const sectionSeconds = parseExamConfig(examRow?.config).section_seconds;
  const fastSections = await countFastSections(svc, attemptId, sectionSeconds);

  const tabBlur = (events ?? []).filter((e) => e.type === "tab_blur").length;
  const fullscreenExit = (events ?? []).filter((e) => e.type === "fullscreen_exit").length;

  const result = computeTrustScore({
    tabBlur,
    fullscreenExit,
    violations: (attempt.violation_count as number) ?? 0,
    fastSections,
    duplicateAnswers: dups.length,
    datacenter: Boolean(attempt.is_datacenter),
    sharedFingerprint: fpShared,
    idMissing: !attempt.id_verified,
    noFace: (attempt.no_face_count as number) ?? 0,
    multipleFaces: (attempt.multi_face_count as number) ?? 0,
    multipleSpeakers: Boolean(attempt.multi_speaker),
  });

  await svc
    .from("attempts")
    .update({
      trust_score: result.score,
      trust_breakdown: result.breakdown as unknown as never,
    })
    .eq("id", attemptId);

  return result;
}

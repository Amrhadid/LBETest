/**
 * Attempt finalization + automatic certificate generation. SERVER ONLY.
 *
 * TRIGGER: called after grading state changes (a teacher approve/reject/manual
 * grade, or right after submission for all-auto attempts). It no-ops until the
 * attempt is FULLY RESOLVED — no responses left in 'pending_approval' or
 * 'failed'. Once resolved it:
 *   1. Tallies each section (auto MCQ + approved AI/teacher grades).
 *   2. Computes the certified level = highest contiguous section passed from
 *      Section 1, and the raw score = total correct.
 *   3. Writes the authoritative result onto the attempt (final_score, lbe_level,
 *      status='scored').
 *   4. If the certified level >= 1, generates a certificate: unique code +
 *      HMAC integrity hash, a PDF (edge-safe) stored in the private
 *      `certificates` bucket, with a QR to /verify/<code>. If the level is 0
 *      (Section 1 not passed) NO certificate is created — only the internal
 *      result on the attempt (the candidate still sees a result later, step 16).
 *
 * Idempotent: guarded by attempt.status and a unique index on
 * certificates(attempt_id). Runs with the service role (bypasses RLS).
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site";
import {
  certifiedLevel,
  totalCorrect,
  levelName,
  levelDescription,
  type SectionTally,
} from "@/lib/certificates/eligibility";
import { generateCertificatePdf } from "@/lib/certificates/pdf";
import { loadCertificateTemplate } from "@/lib/certificates/template.server";
import {
  certificateCanonical,
  computeIssueHash,
} from "@/lib/certificates/integrity";

export const CERTIFICATES_BUCKET = "certificates";
export const CERTIFICATE_PHOTOS_BUCKET = "certificate-photos";
const CERT_VALIDITY_YEARS = 1;

export interface FinalizeResult {
  finalized: boolean;
  reason?: "not_found" | "already_finalized" | "pending_grades";
  level?: number;
  score?: number;
  certificateId?: string | null;
}

/** Absolute URL a certificate QR / verify link points at (step 12 route). */
export function verifyUrlFor(certCode: string): string {
  return `https://${siteConfig.domain}/verify/${certCode}`;
}

/** Unique-ish public code: LBE-<level>-<8 base32 chars>. */
function makeCertCode(level: number): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // no ambiguous chars
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const rand = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `LBE-${level}-${rand}`;
}

/** Stable per-account Candidate ID: CID-<6 base32 chars>. Distinct from cert codes. */
function makeCandidateCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // no ambiguous chars
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const rand = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `CID-${rand}`;
}

export async function finalizeAttempt(
  attemptId: string,
): Promise<FinalizeResult> {
  const svc = createServiceRoleClient();

  const { data: attempt } = await svc
    .from("attempts")
    .select("id, user_id, exam_id, status, final_score, is_preview")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt || !attempt.exam_id) {
    return { finalized: false, reason: "not_found" };
  }
  // Preview (reviewer) attempts are never scored or certified.
  if (attempt.is_preview) {
    return { finalized: false, reason: "already_finalized" };
  }
  if (attempt.status === "scored") {
    return { finalized: false, reason: "already_finalized" };
  }

  // Not resolved until no AI grade is still pending or failed.
  const { count: unresolved } = await svc
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("attempt_id", attemptId)
    .in("grade_status", ["pending_approval", "failed"]);
  if ((unresolved ?? 0) > 0) {
    return { finalized: false, reason: "pending_grades" };
  }

  // Tally sections: total = active items per section; correct = is_correct rows.
  const { data: items } = await svc
    .from("items")
    .select("id, lbe_level, active")
    .eq("exam_id", attempt.exam_id)
    .eq("active", true);

  const { data: responses } = await svc
    .from("responses")
    .select("item_id, is_correct")
    .eq("attempt_id", attemptId);

  const levelOfItem = new Map<string, number>();
  const totalByLevel = new Map<number, number>();
  for (const it of items ?? []) {
    levelOfItem.set(String(it.id), it.lbe_level as number);
    totalByLevel.set(
      it.lbe_level as number,
      (totalByLevel.get(it.lbe_level as number) ?? 0) + 1,
    );
  }
  const correctByLevel = new Map<number, number>();
  for (const r of responses ?? []) {
    if (!r.is_correct || !r.item_id) continue;
    const lvl = levelOfItem.get(String(r.item_id));
    if (lvl == null) continue;
    correctByLevel.set(lvl, (correctByLevel.get(lvl) ?? 0) + 1);
  }
  const tallies: SectionTally[] = [...totalByLevel.keys()]
    .sort((a, b) => a - b)
    .map((level) => ({
      level,
      total: totalByLevel.get(level) ?? 0,
      correct: correctByLevel.get(level) ?? 0,
    }));

  const level = certifiedLevel(tallies);
  const score = totalCorrect(tallies);
  const totalItems = tallies.reduce((s, t) => s + t.total, 0);
  const scoreOutOf100 = totalItems > 0 ? Math.round((score / totalItems) * 100) : 0;

  // Authoritative result on the attempt (the internal result record).
  await svc
    .from("attempts")
    .update({
      final_score: score,
      lbe_level: level >= 1 ? level : null,
      status: "scored",
    })
    .eq("id", attemptId);

  // Exam-credibility trust score (#1): compute + store the composite suspicion
  // score from all signals now that the attempt is resolved. Admin-only; never
  // shown to the candidate. Best-effort — never blocks finalization/certifying.
  try {
    const { computeAndStoreTrust } = await import("@/lib/exam/trust.server");
    await computeAndStoreTrust(attemptId);
  } catch {
    // Trust scoring is advisory; a failure must not fail finalization.
  }

  // No certified level → no credential, only the result record above.
  if (level < 1) {
    return { finalized: true, level: 0, score, certificateId: null };
  }

  // Already has a certificate? (unique index guards; this keeps it idempotent.)
  const { data: existing } = await svc
    .from("certificates")
    .select("id")
    .eq("attempt_id", attemptId)
    .maybeSingle();
  if (existing) {
    return { finalized: true, level, score, certificateId: existing.id };
  }

  const { data: profile } = await svc
    .from("profiles")
    .select("full_name, candidate_code, certificate_photo_path, certificate_photo_status")
    .eq("id", attempt.user_id)
    .maybeSingle();

  // Candidate ID: a stable, system-generated code per account (printed on every
  // certificate the candidate earns). Lazily generated the first time we issue
  // one, then reused. Unique index guards; retry on the rare collision.
  let candidateCode = profile?.candidate_code ?? "";
  if (!candidateCode) {
    for (let i = 0; i < 5 && !candidateCode; i++) {
      const code = makeCandidateCode();
      const { error: ccErr } = await svc
        .from("profiles")
        .update({ candidate_code: code })
        .eq("id", attempt.user_id)
        .is("candidate_code", null);
      if (!ccErr) {
        // Re-read to confirm ours won (or another concurrent run set one).
        const { data: p2 } = await svc
          .from("profiles")
          .select("candidate_code")
          .eq("id", attempt.user_id)
          .maybeSingle();
        candidateCode = p2?.candidate_code ?? "";
      }
    }
  }

  // Optional certificate photo: only embed one that an admin has APPROVED.
  let candidatePhoto: Uint8Array | null = null;
  if (
    profile?.certificate_photo_path &&
    profile.certificate_photo_status === "approved"
  ) {
    try {
      const { data: blob } = await svc.storage
        .from(CERTIFICATE_PHOTOS_BUCKET)
        .download(profile.certificate_photo_path);
      if (blob) candidatePhoto = new Uint8Array(await blob.arrayBuffer());
    } catch {
      /* photo fetch failed — leave the box blank */
    }
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + CERT_VALIDITY_YEARS);

  // Insert the certificate row (reserves cert_code + attempt uniqueness),
  // retrying on the small chance of a code collision.
  let certId: string | null = null;
  let certCode = "";
  for (let i = 0; i < 5 && !certId; i++) {
    certCode = makeCertCode(level);
    const canonical = certificateCanonical({
      certCode,
      userId: attempt.user_id,
      attemptId,
      level,
      score,
      issuedAtIso: issuedAt.toISOString(),
    });
    const issueHash = await computeIssueHash(canonical);

    const { data: inserted, error } = await svc
      .from("certificates")
      .insert({
        cert_code: certCode,
        attempt_id: attemptId,
        user_id: attempt.user_id,
        lbe_level: level,
        score,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "valid",
        issue_hash: issueHash,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // Unique violation on attempt_id → another run beat us; adopt it.
      if (error.code === "23505" && error.message.includes("attempt")) {
        const { data: race } = await svc
          .from("certificates")
          .select("id")
          .eq("attempt_id", attemptId)
          .maybeSingle();
        return {
          finalized: true,
          level,
          score,
          certificateId: race?.id ?? null,
        };
      }
      // Otherwise likely a cert_code collision — loop and retry with a new code.
      continue;
    }
    certId = inserted?.id ?? null;
  }

  if (!certId) {
    // Couldn't reserve a code; the result record still stands.
    return { finalized: true, level, score, certificateId: null };
  }

  // Generate the PDF and store it privately; persist its object path.
  try {
    const template = await loadCertificateTemplate();
    const pdf = await generateCertificatePdf(
      {
        candidateName: profile?.full_name ?? "Candidate",
        candidatePhoto,
        level,
        levelName: levelName(level),
        levelDescription: levelDescription(level),
        score: scoreOutOf100,
        certCode,
        candidateId: candidateCode,
        issuedAt,
        expiresAt,
        verifyUrl: verifyUrlFor(certCode),
      },
      template,
    );

    const path = `${attempt.user_id}/${certCode}.pdf`;
    const { error: upErr } = await svc.storage
      .from(CERTIFICATES_BUCKET)
      .upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (!upErr) {
      await svc
        .from("certificates")
        .update({ pdf_url: path })
        .eq("id", certId);
    }
  } catch {
    // PDF/storage failure leaves the certificate row valid but pdf_url null;
    // it can be regenerated later. Don't fail finalization over the PDF.
  }

  return { finalized: true, level, score, certificateId: certId };
}

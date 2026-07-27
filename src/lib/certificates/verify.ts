/**
 * Public certificate verification. SERVER ONLY.
 *
 * Looks a certificate up by its public code, recomputes the integrity hash, and
 * returns a minimal, IELTS/TOEFL-style result: status + candidate name + LBE
 * level + issue date. No score details beyond the level are ever returned.
 *
 * Uses the service-role client because the visitor is anonymous (RLS would hide
 * the row); only the minimal fields below are surfaced to the page.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { levelName } from "@/lib/certificates/eligibility";
import {
  certificateCanonical,
  computeIssueHash,
  safeEqual,
} from "@/lib/certificates/integrity";

export type VerifyStatus =
  | "valid"
  | "revoked"
  | "expired"
  | "not_found"
  | "invalid"; // hash mismatch / tampered / unverifiable

export interface VerifyResult {
  status: VerifyStatus;
  code: string;
  candidateName?: string;
  level?: number;
  levelName?: string;
  issuedAt?: string; // YYYY-MM-DD
  expiresAt?: string; // YYYY-MM-DD
}

export async function verifyCertificate(rawCode: string): Promise<VerifyResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { status: "not_found", code: rawCode };

  const svc = createServiceRoleClient();
  const { data: cert } = await svc
    .from("certificates")
    .select("cert_code, attempt_id, user_id, lbe_level, score, status, issued_at, expires_at, issue_hash")
    .eq("cert_code", code)
    .maybeSingle();

  if (!cert) return { status: "not_found", code };

  // Recompute the integrity hash BEFORE trusting any field. A missing
  // attempt_id/issued_at or a mismatch means we can't vouch for authenticity.
  let authentic = false;
  if (cert.issue_hash && cert.attempt_id && cert.issued_at) {
    const canonical = certificateCanonical({
      certCode: cert.cert_code,
      userId: cert.user_id,
      attemptId: cert.attempt_id,
      level: cert.lbe_level ?? "",
      score: cert.score ?? "",
      issuedAtIso: new Date(cert.issued_at).toISOString(),
    });
    const recomputed = await computeIssueHash(canonical);
    authentic = safeEqual(recomputed, cert.issue_hash);
  }
  if (!authentic) return { status: "invalid", code };

  const name = await candidateName(svc, cert.user_id);
  const issuedAt = cert.issued_at ? cert.issued_at.slice(0, 10) : undefined;
  const expiresAt = cert.expires_at ? cert.expires_at.slice(0, 10) : undefined;
  const base = {
    code,
    candidateName: name,
    level: cert.lbe_level ?? undefined,
    levelName: cert.lbe_level ? levelName(cert.lbe_level) : undefined,
    issuedAt,
    expiresAt,
  };

  if (cert.status === "revoked") return { status: "revoked", ...base };

  const expired =
    cert.status === "expired" ||
    (cert.expires_at ? new Date(cert.expires_at).getTime() < Date.now() : false);
  if (expired) return { status: "expired", ...base };

  return { status: "valid", ...base };
}

async function candidateName(
  svc: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<string> {
  const { data } = await svc
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.full_name?.trim() || "Certificate holder";
}

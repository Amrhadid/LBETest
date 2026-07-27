/**
 * Certificate integrity — canonical string + issue-hash, shared by issuance
 * (finalize) and public verification (/verify). SERVER ONLY.
 *
 * The hash binds a certificate's identifying fields together. HMAC-SHA256 with
 * CERT_SIGNING_SECRET when set (unforgeable); otherwise a plain SHA-256 digest
 * (tamper-evident, but recomputable). Both issuance and verification MUST build
 * the canonical string identically, or valid certificates won't verify.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getCertSigningSecret(): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (env?.CERT_SIGNING_SECRET) return env.CERT_SIGNING_SECRET;
  } catch {
    // Not in a Cloudflare request context — fall back.
  }
  return process.env.CERT_SIGNING_SECRET;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Canonical string over the certificate's identifying fields. Field order and
 * formatting are frozen — changing them invalidates every existing hash.
 * `issuedAtIso` must be an ISO-8601 string (issuance passes Date.toISOString();
 * verification passes new Date(row.issued_at).toISOString(), which reproduces
 * the same millisecond-precision value).
 */
export function certificateCanonical(f: {
  certCode: string;
  userId: string;
  attemptId: string;
  level: number | string;
  score: number | string;
  issuedAtIso: string;
}): string {
  return [
    f.certCode,
    f.userId,
    f.attemptId,
    String(f.level),
    String(f.score),
    f.issuedAtIso,
  ].join("|");
}

export async function computeIssueHash(canonical: string): Promise<string> {
  const secret = getCertSigningSecret();
  const enc = new TextEncoder();
  if (secret) {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(canonical)));
  }
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(canonical)));
}

/** Constant-time-ish string compare (avoids early-exit timing leaks). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

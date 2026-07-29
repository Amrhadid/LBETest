/**
 * Retention purge of proctoring media (7-day). SERVER/EDGE ONLY — deploys to a
 * Cloudflare Cron. Deletes continuous recordings, room scans, and ID/selfie
 * images for attempts once they are safe to purge, and clears the pointer
 * columns so the admin UI shows nothing to sign.
 *
 * SAFE-TO-PURGE (all must hold):
 *   - the attempt is older than RETENTION_DAYS, AND
 *   - it is NOT a confirmed violation (that evidence is kept), AND
 *   - it is either low-suspicion to begin with (trust_score < FLAG_THRESHOLD)
 *     OR has actually been reviewed and cleared by an admin.
 *
 * So a flagged/high-suspicion attempt is NEVER purged before a human reviews it,
 * even if that review happens long after 7 days. `env` is injected by the Cron
 * scheduled handler (no request context).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { FLAG_THRESHOLD } from "@/lib/exam/trust";
import {
  ID_VERIFICATION_BUCKET,
  ATTEMPT_RECORDINGS_BUCKET,
  ROOM_SCAN_BUCKET,
} from "@/lib/exam/storage";

interface SupabaseEnvLike {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export const RETENTION_DAYS = 7;

/** Recursively delete every object under a bucket "folder" prefix. */
async function deletePrefix(
  svc: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<void> {
  const { data: entries } = await svc.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!entries || entries.length === 0) return;
  const files: string[] = [];
  for (const e of entries) {
    // A storage "file" has metadata; a "folder" is a synthetic prefix.
    if (e.metadata) files.push(`${prefix}/${e.name}`);
    else await deletePrefix(svc, bucket, `${prefix}/${e.name}`);
  }
  if (files.length) await svc.storage.from(bucket).remove(files);
}

export async function purgeExpiredRecordings(
  env?: SupabaseEnvLike,
  nowMs?: number,
): Promise<{ ok: boolean; purged: number; error?: string }> {
  const fallback = env ? { url: undefined, serviceKey: undefined } : getServerSupabaseEnv();
  const url = env?.NEXT_PUBLIC_SUPABASE_URL ?? fallback.url;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY ?? fallback.serviceKey;
  if (!url || !key) return { ok: false, purged: 0, error: "supabase env missing" };

  const now = nowMs ?? Date.now();
  const cutoff = new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const svc = createClient(url, key, { auth: { persistSession: false } });

    // Candidates for purge: old, non-preview, still carrying media pointers.
    const { data: rows } = await svc
      .from("attempts")
      .select("id, user_id, trust_score, review_status, id_image_path, room_scan_path, has_webcam_rec, has_mic_rec, has_screen_rec")
      .eq("is_preview", false)
      .lt("created_at", cutoff)
      .limit(500);

    let purged = 0;
    for (const a of rows ?? []) {
      const confirmedViolation = a.review_status === "confirmed_violation";
      const lowSuspicion = ((a.trust_score as number | null) ?? 0) < FLAG_THRESHOLD;
      const cleared = a.review_status === "cleared";
      if (confirmedViolation || !(lowSuspicion || cleared)) continue; // keep

      const hasMedia =
        a.id_image_path ||
        a.room_scan_path ||
        a.has_webcam_rec ||
        a.has_mic_rec ||
        a.has_screen_rec;
      if (!hasMedia) continue; // nothing left to purge

      const base = `${a.user_id}/${a.id}`;
      await Promise.all([
        deletePrefix(svc, ATTEMPT_RECORDINGS_BUCKET, base),
        deletePrefix(svc, ID_VERIFICATION_BUCKET, base),
        deletePrefix(svc, ROOM_SCAN_BUCKET, base),
      ]);

      // Clear pointers so the admin UI reflects the purge (trust score/flags,
      // and the recorded fact of verification, are retained).
      await svc
        .from("attempts")
        .update({
          id_image_path: null,
          selfie_path: null,
          room_scan_path: null,
          has_webcam_rec: false,
          has_mic_rec: false,
          has_screen_rec: false,
        })
        .eq("id", a.id);
      purged += 1;
    }
    return { ok: true, purged };
  } catch (e) {
    return { ok: false, purged: 0, error: e instanceof Error ? e.message : "purge failed" };
  }
}

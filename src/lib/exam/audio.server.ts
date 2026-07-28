/**
 * Private listening-passage audio access. SERVER ONLY.
 *
 * Generated exam audio lives in the private `exam-audio` bucket. Items store the
 * object PATH (e.g. "<item_id>.mp3") in media_url — never a permanent URL. When
 * an item is served (exam runner) or previewed (admin), we mint a short-lived
 * signed URL from that path via the service role.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const EXAM_AUDIO_BUCKET = "exam-audio";
/** Signed-URL lifetime: 1 hour — covers a section's time limit plus buffer. */
export const EXAM_AUDIO_SIGNED_TTL = 60 * 60;

/**
 * Turn a stored media_url into something playable:
 *  - a full http(s) URL (legacy/manual entry) is returned unchanged;
 *  - anything else is treated as an exam-audio object path and signed.
 * Returns null when there's nothing to play or signing fails.
 */
export async function signExamAudio(
  svc: SupabaseClient,
  storedValue: string | null | undefined,
): Promise<string | null> {
  if (!storedValue) return null;
  if (/^https?:\/\//i.test(storedValue)) return storedValue;
  const { data } = await svc.storage
    .from(EXAM_AUDIO_BUCKET)
    .createSignedUrl(storedValue, EXAM_AUDIO_SIGNED_TTL);
  return data?.signedUrl ?? null;
}

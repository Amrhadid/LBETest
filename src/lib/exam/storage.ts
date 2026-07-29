import type { SupabaseClient } from "@supabase/supabase-js";

/** Private Storage bucket for spoken-response recordings (types 3 & 6). */
export const RESPONSE_AUDIO_BUCKET = "responses-audio";

/** Private Storage bucket for pre-exam room-scan clips (#6). */
export const ROOM_SCAN_BUCKET = "room-scans";

/**
 * Upload a pre-exam room-scan clip to the private room-scans bucket and return
 * the stored object path (persist via the saveRoomScan action). First path
 * segment MUST be the owner's user id (bucket RLS matches auth.uid()).
 */
export async function uploadRoomScan(params: {
  supabase: SupabaseClient;
  blob: Blob;
  userId: string;
  attemptId: string;
}): Promise<string> {
  const { supabase, blob, userId, attemptId } = params;
  const ext = blob.type.includes("mp4") ? "mp4" : "webm";
  const path = `${userId}/${attemptId}/room-scan.${ext}`;

  const { error } = await supabase.storage
    .from(ROOM_SCAN_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || "video/webm",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload room scan: ${error.message}`);
  }
  return path;
}

/**
 * Build the Storage object path for a response recording.
 *
 * The FIRST path segment MUST be the owner's user id — the bucket's RLS
 * policies (see 0002_exam_engine.sql) authorize by matching `auth.uid()` to
 * `storage.foldername(name)[1]`.
 */
export function responseAudioPath(params: {
  userId: string;
  attemptId: string;
  itemId: string;
  ext?: string;
}): string {
  const { userId, attemptId, itemId, ext = "webm" } = params;
  return `${userId}/${attemptId}/${itemId}.${ext}`;
}

/**
 * Upload a recorded audio blob to the private responses-audio bucket and return
 * the stored object path (to persist in the response's `answer.audio_path`).
 *
 * Requires an authenticated Supabase client whose user id matches `userId`.
 */
export async function uploadResponseAudio(params: {
  supabase: SupabaseClient;
  blob: Blob;
  userId: string;
  attemptId: string;
  itemId: string;
}): Promise<string> {
  const { supabase, blob, userId, attemptId, itemId } = params;
  const ext = blob.type.includes("ogg") ? "ogg" : "webm";
  const path = responseAudioPath({ userId, attemptId, itemId, ext });

  const { error } = await supabase.storage
    .from(RESPONSE_AUDIO_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || "audio/webm",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload response audio: ${error.message}`);
  }

  return path;
}

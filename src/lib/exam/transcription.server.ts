import { getCloudflareContext } from "@opennextjs/cloudflare";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { RESPONSE_AUDIO_BUCKET } from "@/lib/exam/storage";

/**
 * Speech-to-text for spoken responses (types 3 & 6), SERVER ONLY.
 *
 * Uses Google Cloud Speech-to-Text via a plain **API key** (not a service
 * account), so it works from a Cloudflare Worker with a single fetch — no
 * WebCrypto JWT signing. Generate a Google Cloud API key restricted to the
 * "Cloud Speech-to-Text API" and store it as the Worker secret
 * `GOOGLE_STT_API_KEY` (wrangler secret put GOOGLE_STT_API_KEY).
 *
 * Recordings are WEBM_OPUS (MediaRecorder default), stored in the private
 * `responses-audio` bucket. We download with the service role, base64-encode,
 * and POST to speech:longrunningrecognize. Transcript text is returned for
 * grading and for reviewers to read without replaying audio.
 *
 * We use the async `longRunningRecognize` endpoint rather than sync `recognize`
 * because sync enforces a ~60s cap derived from the audio's declared duration,
 * and MediaRecorder WEBM_OPUS carries no duration in its header — so sync
 * rejects even short clips with `400 "Sync input too long"`.
 */

/** Resolve the STT API key at runtime (Worker env first, then process.env). */
export function getGoogleSttApiKey(): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (env?.GOOGLE_STT_API_KEY) return env.GOOGLE_STT_API_KEY;
  } catch {
    // Not in a Cloudflare request context (build/dev) — fall through.
  }
  return process.env.GOOGLE_STT_API_KEY;
}

export function isTranscriptionConfigured(): boolean {
  return !!getGoogleSttApiKey();
}

/** Map a stored audio path extension to a Google STT encoding. */
function encodingFor(path: string): { encoding: string; label: string } {
  if (path.endsWith(".ogg")) return { encoding: "OGG_OPUS", label: "ogg" };
  return { encoding: "WEBM_OPUS", label: "webm" };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // btoa is available in the Workers runtime.
  return btoa(binary);
}

/** Result of a transcription: the text plus distinct-speaker count (#6). */
export interface TranscriptionResult {
  text: string;
  /** Distinct speakers heard (from diarization). >1 = possible collusion. */
  speakerCount: number;
}

/** A transcription call: given audio bytes + path, return text + speaker count. */
export type TranscribeCall = (args: {
  audio: Uint8Array;
  path: string;
}) => Promise<TranscriptionResult>;

const LONGRUNNING_URL =
  "https://speech.googleapis.com/v1/speech:longrunningrecognize";
const OPERATIONS_URL = "https://speech.googleapis.com/v1/operations";

/** Recognition config shared by the sync + long-running paths. */
function recognitionConfig(encoding: string) {
  return {
    encoding,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "latest_long",
    // Speaker diarization (#6): a spoken answer should be one voice. When
    // Google reports >1 distinct speaker, we flag it as a trust signal.
    diarizationConfig: {
      enableSpeakerDiarization: true,
      minSpeakerCount: 1,
      maxSpeakerCount: 6,
    },
  };
}

interface SttResponse {
  results?: {
    alternatives?: {
      transcript?: string;
      words?: { speakerTag?: number }[];
    }[];
  }[];
}

/** Fold a Google STT response into our {text, speakerCount} shape. */
function parseSttResponse(data: SttResponse): TranscriptionResult {
  const results = data.results ?? [];
  const text = results
    .map((r) => r.alternatives?.[0]?.transcript ?? "")
    .join(" ")
    .trim();
  // Diarization tags appear on the words of the LAST result. Count distinct
  // non-zero speaker tags across all returned words.
  const speakers = new Set<number>();
  for (const r of results) {
    for (const w of r.alternatives?.[0]?.words ?? []) {
      if (typeof w.speakerTag === "number" && w.speakerTag > 0) {
        speakers.add(w.speakerTag);
      }
    }
  }
  return { text, speakerCount: Math.max(1, speakers.size) };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Primary path: the async `longRunningRecognize` operation (inline base64
 * content — no GCS bucket needed), polled until it completes.
 *
 * We use this instead of the sync `recognize` endpoint because sync enforces a
 * hard ~60s limit that Google derives from the audio's declared duration.
 * Browser `MediaRecorder` writes WEBM_OPUS whose container header carries NO
 * duration (the header is finalized before the recording stops), so Google
 * can't verify the length and rejects the sync request with
 * `400 "Sync input too long"` — even for clips well under a minute. The async
 * endpoint is not subject to that threshold, so it transcribes these
 * header-less clips reliably regardless of their real length.
 *
 * Bounded so a stuck operation can't hang the caller; on timeout we throw and
 * the response is marked for manual grading, same as any other STT failure.
 */
async function longRunningTranscribe(
  key: string,
  encoding: string,
  audio: Uint8Array,
): Promise<TranscriptionResult> {
  const start = await fetch(
    `${LONGRUNNING_URL}?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        config: recognitionConfig(encoding),
        audio: { content: toBase64(audio) },
      }),
    },
  );
  if (!start.ok) {
    const detail = await start.text().catch(() => "");
    throw new Error(
      `Google STT longrunning start error ${start.status}: ${detail.slice(0, 300)}`,
    );
  }
  const { name } = (await start.json()) as { name?: string };
  if (!name) throw new Error("Google STT longrunning returned no operation name.");

  // Poll: ~20 tries × 4s = up to ~80s wall time (I/O wait, not CPU).
  for (let i = 0; i < 20; i++) {
    await sleep(4000);
    const poll = await fetch(
      `${OPERATIONS_URL}/${encodeURIComponent(name)}?key=${encodeURIComponent(key)}`,
    );
    if (!poll.ok) continue;
    const op = (await poll.json()) as {
      done?: boolean;
      response?: SttResponse;
      error?: { message?: string };
    };
    if (op.done) {
      if (op.error) {
        throw new Error(`Google STT longrunning failed: ${op.error.message ?? "unknown"}`);
      }
      return parseSttResponse(op.response ?? {});
    }
  }
  throw new Error("Google STT longrunning timed out before completing.");
}

/**
 * The default {@link TranscribeCall}: Google Cloud Speech-to-Text (API key).
 *
 * Always transcribes via `longRunningRecognize`. We deliberately avoid the sync
 * `recognize` endpoint: its ~60s cap is derived from the audio's declared
 * duration, and browser-recorded WEBM_OPUS carries no duration in its header,
 * so sync rejects even short clips with `400 "Sync input too long"`. The async
 * endpoint has no such threshold and handles these header-less recordings
 * reliably. Our spoken answers are transcribed in a background grading job, so
 * the extra latency from polling is not user-visible.
 */
export const googleTranscribeCall: TranscribeCall = async ({ audio, path }) => {
  const key = getGoogleSttApiKey();
  if (!key) {
    throw new Error("GOOGLE_STT_API_KEY is not configured for the Worker.");
  }

  const { encoding } = encodingFor(path);
  return longRunningTranscribe(key, encoding, audio);
};

/**
 * Download a response recording from the private bucket and transcribe it.
 * The `call` is injectable so the pipeline is testable without a live key.
 */
export async function transcribeResponseAudio(
  audioPath: string,
  call: TranscribeCall = googleTranscribeCall,
): Promise<TranscriptionResult> {
  const svc = createServiceRoleClient();
  const { data, error } = await svc.storage
    .from(RESPONSE_AUDIO_BUCKET)
    .download(audioPath);
  if (error || !data) {
    throw new Error(
      `Failed to download response audio (${audioPath}): ${error?.message ?? "no data"}`,
    );
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  return call({ audio: bytes, path: audioPath });
}

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Google Cloud Text-to-Speech for listening-passage audio. SERVER ONLY.
 *
 * Mirrors the STT integration (transcription.server.ts): calls Google via a
 * plain API key (GOOGLE_TTS_API_KEY, already a Worker secret) with a single
 * fetch — no service account, no Node APIs. Returns MP3 bytes ready to upload.
 *
 * This is invoked ONCE per item (from the admin "Generate audio" action), never
 * per candidate — candidates stream the stored file.
 */

const TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
// Neural2 English voice — clear, natural for exam listening passages.
const DEFAULT_VOICE = "en-US-Neural2-D";
const DEFAULT_LANG = "en-US";

/** Resolve the TTS API key at runtime (Worker env first, then process.env). */
export function getGoogleTtsApiKey(): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (env?.GOOGLE_TTS_API_KEY) return env.GOOGLE_TTS_API_KEY;
  } catch {
    // Not in a Cloudflare request context (build/dev) — fall through.
  }
  return process.env.GOOGLE_TTS_API_KEY;
}

export function isTtsConfigured(): boolean {
  return !!getGoogleTtsApiKey();
}

/** Decode base64 to bytes using the Workers-native atob (no Buffer). */
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Synthesize `text` to MP3 bytes via Google TTS. Throws on failure. */
export async function synthesizeSpeech(
  text: string,
  opts?: { voice?: string; languageCode?: string },
): Promise<Uint8Array> {
  const key = getGoogleTtsApiKey();
  if (!key) {
    throw new Error("GOOGLE_TTS_API_KEY is not configured for the Worker.");
  }

  const res = await fetch(`${TTS_URL}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: opts?.languageCode ?? DEFAULT_LANG,
        name: opts?.voice ?? DEFAULT_VOICE,
      },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google TTS error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error("Google TTS returned no audio content.");
  }
  return base64ToBytes(data.audioContent);
}

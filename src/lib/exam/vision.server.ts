/**
 * AI face-presence detection (#5). SERVER ONLY.
 *
 * Periodically the client samples ONE downscaled webcam frame and posts it to
 * /api/proctor-frame, which calls this. We ask Claude vision for a face count
 * and classify the frame as: no face present (0) or multiple faces (>=2). Those
 * feed the trust score (noFace / multipleFaces signals).
 *
 * Reuses ANTHROPIC_API_KEY. One vision call per sampled frame — sampling cadence
 * is controlled client-side (default 1 frame / 60s) to bound API spend.
 */

import { getAnthropicApiKey } from "@/lib/exam/grading.server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
// A cheap, fast vision-capable model — face counting needs no heavy reasoning.
const VISION_MODEL = "claude-haiku-4-5-20251001";

export interface FaceResult {
  faceCount: number;
  ok: boolean; // false if the call failed / key missing (caller ignores it)
}

const FACE_SCHEMA = {
  type: "object",
  properties: {
    face_count: {
      type: "integer",
      description: "Number of distinct human faces clearly visible in the image.",
    },
  },
  required: ["face_count"],
  additionalProperties: false,
} as const;

/**
 * Count faces in a single webcam frame via Claude vision.
 * @param base64Jpeg base64-encoded JPEG (no data: prefix)
 */
export async function detectFaces(base64Jpeg: string): Promise<FaceResult> {
  const key = getAnthropicApiKey();
  if (!key) return { faceCount: 1, ok: false };

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 128,
        system:
          "You are an exam-proctoring vision check. Count the distinct human " +
          "faces clearly visible in the webcam frame. A single candidate should " +
          "show exactly one face. Report 0 if no face is present and the real " +
          "count if more than one person is visible.",
        output_config: { format: { type: "json_schema", schema: FACE_SCHEMA } },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Jpeg,
                },
              },
              { type: "text", text: "How many human faces are visible?" },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return { faceCount: 1, ok: false };
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text) as { face_count?: number };
    const n = Number(parsed.face_count);
    return { faceCount: Number.isFinite(n) ? Math.max(0, Math.round(n)) : 1, ok: true };
  } catch {
    return { faceCount: 1, ok: false };
  }
}

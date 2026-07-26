import { getCloudflareContext } from "@opennextjs/cloudflare";

import { GRADING_MODEL, type GraderCall } from "@/lib/exam/grading";

/**
 * Server-only Claude call used to grade text responses. SERVER ONLY — reads
 * ANTHROPIC_API_KEY from the Cloudflare Worker env (falling back to
 * process.env). Uses raw fetch (Workers-compatible, no Node SDK dependency)
 * and structured outputs so the reply is guaranteed-parseable JSON.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** Resolve the grading API key at runtime (Worker env first, then process.env). */
export function getAnthropicApiKey(): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (env?.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY;
  } catch {
    // Not in a Cloudflare request context (build/dev) — fall through.
  }
  return process.env.ANTHROPIC_API_KEY;
}

export function isGradingConfigured(): boolean {
  return !!getAnthropicApiKey();
}

/** The default {@link GraderCall}: calls Claude Sonnet 5 with structured output. */
export const anthropicGraderCall: GraderCall = async ({ system, user, schema }) => {
  const key = getAnthropicApiKey();
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not configured for the Worker.");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: GRADING_MODEL,
      max_tokens: 1024,
      system,
      output_config: { format: { type: "json_schema", schema } },
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  return JSON.parse(text);
};

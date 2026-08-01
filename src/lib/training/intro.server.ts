/**
 * Generate a polished self-introduction from a candidate's Introduce-Yourself
 * answers, via the Claude API. SERVER ONLY.
 *
 * Uses Haiku (claude-haiku-4-5-*) — the same cost-optimized model as the
 * proctoring face check. This is a LIVE per-submission generation (each intro
 * is personalized to one candidate), so unlike the AI explanations elsewhere it
 * is never cached and reused across users; "Regenerate" is a fresh call.
 */

import { getAnthropicApiKey } from "@/lib/exam/grading.server";
import { TONES, type IntroData } from "@/lib/training/intro";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const INTRO_MODEL = "claude-haiku-4-5-20251001";

/** Whole years between a yyyy-mm-dd date and today, or null if unparseable. */
function ageFrom(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

function list(v: string[]): string {
  return v.filter(Boolean).join(", ") || "(none given)";
}

/** Build the user prompt describing the candidate. DOB is passed only as an age
 * hint with an explicit instruction never to state it. */
function buildPrompt(data: IntroData): string {
  const age = ageFrom(data.date_of_birth);
  const toneLabel =
    TONES.find((t) => t.value === data.tone)?.label ?? "Friendly-professional";
  const lines = [
    `Tone: ${toneLabel}.`,
    data.name && `Name: ${data.name}.`,
    data.city && `City of residence: ${data.city}.`,
    data.education && `Education: ${data.education}.`,
    data.current_status && `Current status: ${data.current_status.replace("_", "-")}.`,
    data.previous_job && `Previous job: ${data.previous_job}.`,
    data.field && `Field/industry: ${data.field}.`,
    `Experience areas: ${list(data.experience_areas)}.`,
    `Soft skills/qualities: ${list(data.soft_skills)}.`,
    `Qualifications: ${list(data.qualifications)}.`,
    data.career_goal && `Career goal (what they want next): ${data.career_goal}.`,
    data.key_achievement && `One key achievement: ${data.key_achievement}.`,
    data.languages && `Languages spoken: ${data.languages}.`,
    `Areas for improvement (frame constructively): ${list(data.weaknesses)}.`,
    age != null &&
      `Approximate age: ${age}. DO NOT state the age or any date of birth — use it only to subtly inform phrasing (e.g. "recent graduate" for someone early in their career), and only if it fits naturally.`,
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Call Claude to write the intro. Returns the paragraph text. Throws on a
 * missing key or an API error so the caller can surface a clear message.
 */
export async function generateIntro(data: IntroData): Promise<string> {
  const key = getAnthropicApiKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const system =
    "You write a polished, natural first-person self-introduction for a " +
    "business-English learner to use when meeting colleagues or interviewers. " +
    "Write ONE cohesive paragraph (about 90–150 words), in the first person, in " +
    "the requested tone. Weave in only the details provided — never invent facts, " +
    "employers, or numbers. Present any area-for-improvement briefly and " +
    "constructively (growth-minded), not as a flaw. Never state the person's " +
    "date of birth or exact age. Output only the paragraph, with no preamble, " +
    "quotes, or headings.";

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: INTRO_MODEL,
      max_tokens: 400,
      temperature: 0.7,
      system,
      messages: [{ role: "user", content: buildPrompt(data) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = (json.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned an empty introduction.");
  return text;
}

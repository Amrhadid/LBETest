import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { hasTrainingAccess } from "@/lib/training/entitlement";
import { generateIntro } from "@/lib/training/intro.server";
import { EMPTY_INTRO, type IntroData } from "@/lib/training/intro";

export const dynamic = "force-dynamic";

/** Coerce arbitrary JSON into a clean IntroData (trim strings, string arrays). */
function sanitize(body: unknown): IntroData {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (k: keyof IntroData) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
  const arr = (k: keyof IntroData) =>
    Array.isArray(b[k])
      ? (b[k] as unknown[]).map((x) => String(x).trim()).filter(Boolean).slice(0, 20)
      : [];
  return {
    ...EMPTY_INTRO,
    name: str("name"),
    date_of_birth: str("date_of_birth"),
    city: str("city"),
    education: str("education"),
    current_status: str("current_status"),
    previous_job: str("previous_job"),
    field: str("field"),
    experience_areas: arr("experience_areas"),
    soft_skills: arr("soft_skills"),
    qualifications: arr("qualifications"),
    career_goal: str("career_goal"),
    key_achievement: str("key_achievement"),
    languages: str("languages"),
    weaknesses: arr("weaknesses"),
    tone: str("tone") === "formal" ? "formal" : "friendly",
  };
}

/**
 * Generate (or regenerate) the candidate's self-introduction. Saves the answers
 * + latest text to their intro_submissions row and returns the fresh text.
 * A LIVE call every time — never cached.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!(await hasTrainingAccess(supabase, user.id))) {
    return NextResponse.json({ error: "Training isn't unlocked on this account." }, { status: 403 });
  }

  let data: IntroData;
  try {
    data = sanitize(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!data.name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  let text: string;
  try {
    text = await generateIntro(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not generate the introduction." },
      { status: 502 },
    );
  }

  // Persist the answers + latest generated text (upsert on the user's row).
  await supabase.from("intro_submissions").upsert(
    {
      user_id: user.id,
      name: data.name,
      date_of_birth: data.date_of_birth || null,
      city: data.city || null,
      education: data.education || null,
      current_status: data.current_status || null,
      previous_job: data.previous_job || null,
      field: data.field || null,
      experience_areas: data.experience_areas,
      soft_skills: data.soft_skills,
      qualifications: data.qualifications,
      career_goal: data.career_goal || null,
      key_achievement: data.key_achievement || null,
      languages: data.languages || null,
      weaknesses: data.weaknesses,
      tone: data.tone,
      generated_text: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ text });
}

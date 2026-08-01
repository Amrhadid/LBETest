import { NextResponse } from "next/server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { anthropicGraderCall } from "@/lib/exam/grading.server";
import { googleTranscribeCall } from "@/lib/exam/transcription.server";
import { gradeTextResponse, getRubric, isAiGraded } from "@/lib/exam/grading";
import type { ExamItem } from "@/lib/exam/types";

export const dynamic = "force-dynamic";

/**
 * Admin AI-grading tester (SERVER, no DB writes).
 *
 * Runs the SAME pipeline candidates hit — voice answers are transcribed via
 * Google STT (with the server-side WebM duration repair), text answers grade
 * directly — for one real item, and returns the transcript + grade so an admin
 * can validate grading end-to-end without a candidate taking the exam. Nothing
 * is persisted: no attempt, no response, no stored audio.
 */

/** Admin-only. Returns the user or null (this route is outside the /admin layout gate). */
async function requireAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin" ? user : null;
}

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const form = await req.formData();
  const itemId = String(form.get("itemId") ?? "");
  if (!itemId) return NextResponse.json({ error: "Choose a question." }, { status: 400 });

  const svc = createServiceRoleClient();
  const { data: row } = await svc
    .from("items")
    .select(
      "id, exam_id, source_type, question_type, lbe_level, prompt, media_url, options, answer_key, rubric, active",
    )
    .eq("id", itemId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  const item = row as unknown as ExamItem;
  if (!isAiGraded(item.question_type)) {
    return NextResponse.json(
      { error: "This item is not AI-graded." },
      { status: 400 },
    );
  }

  try {
    let transcript: string | undefined;
    let speakerCount: number | undefined;
    let answer: string;

    const audio = form.get("audio");
    if (audio instanceof File) {
      const bytes = new Uint8Array(await audio.arrayBuffer());
      const tr = await googleTranscribeCall({
        audio: bytes,
        path: audio.name || "answer.webm",
      });
      transcript = tr.text;
      speakerCount = tr.speakerCount;
      answer = tr.text;
    } else {
      answer = String(form.get("text") ?? "");
    }

    const grade = await gradeTextResponse(item, answer, anthropicGraderCall);
    const maxScore = getRubric(item).max_score ?? 1;
    return NextResponse.json({ transcript, speakerCount, grade, maxScore });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Grading failed." },
      { status: 500 },
    );
  }
}

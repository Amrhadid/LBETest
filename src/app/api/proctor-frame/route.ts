import { NextResponse } from "next/server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { detectFaces } from "@/lib/exam/vision.server";

export const dynamic = "force-dynamic";

/**
 * AI face-presence check (#5). The exam runner samples one downscaled webcam
 * frame on a timer (default 1/60s) and POSTs it here as base64 JPEG. We verify
 * the caller owns the in-progress attempt, run Claude vision, and increment the
 * attempt's no_face_count / multi_face_count counters (service role). Those feed
 * the trust score. Best-effort: any failure is swallowed (204) so proctoring
 * never disrupts the candidate.
 */
export async function POST(request: Request) {
  let body: { attemptId?: string; image?: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const attemptId = body?.attemptId;
  const image = body?.image;
  if (!attemptId || !image || image.length > 3_000_000) {
    // Cap the payload (~3 MB base64) — frames are downscaled client-side.
    return new NextResponse(null, { status: 204 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 204 });

    const { data: attempt } = await supabase
      .from("attempts")
      .select("id, status, is_preview")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!attempt || attempt.status !== "in_progress" || attempt.is_preview) {
      return new NextResponse(null, { status: 204 });
    }

    const { faceCount, ok } = await detectFaces(image);
    if (!ok) return new NextResponse(null, { status: 204 });

    const svc = createServiceRoleClient();
    if (faceCount === 0 || faceCount >= 2) {
      // Read-modify-write the counter (low frequency: ~1/min per attempt).
      const { data: cur } = await svc
        .from("attempts")
        .select("no_face_count, multi_face_count")
        .eq("id", attemptId)
        .maybeSingle();
      const patch =
        faceCount === 0
          ? { no_face_count: ((cur?.no_face_count as number) ?? 0) + 1 }
          : { multi_face_count: ((cur?.multi_face_count as number) ?? 0) + 1 };
      await svc.from("attempts").update(patch).eq("id", attemptId);
    }
  } catch {
    // Never surface proctoring errors to the candidate.
  }
  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Only lockdown-telemetry events may come through the beacon channel.
const ALLOWED = new Set(["tab_blur", "fullscreen_exit", "pagehide"]);

/**
 * Reliable receiver for lockdown telemetry sent via navigator.sendBeacon.
 *
 * The exam runner fires tab-blur / fullscreen-exit while the tab is
 * backgrounding — a moment when Server Action fetches get dropped. sendBeacon is
 * built for exactly that, and this route persists the event. It authenticates
 * the caller by cookie, verifies they own the attempt, then inserts via the
 * service role (so no RLS/grant edge case can silently drop the write).
 */
export async function POST(request: Request) {
  let body: { attemptId?: string; type?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const attemptId = body?.attemptId;
  const type = body?.type;
  if (!attemptId || !type || !ALLOWED.has(type)) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 204 });

    // Verify ownership (RLS-scoped read) before writing.
    const { data: attempt } = await supabase
      .from("attempts")
      .select("id")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!attempt) return new NextResponse(null, { status: 204 });

    await createServiceRoleClient()
      .from("attempt_events")
      .insert({
        attempt_id: attemptId,
        type,
        payload: (body.payload ?? {}) as unknown as never,
      });
  } catch {
    // Telemetry must never surface an error to the candidate.
  }
  return new NextResponse(null, { status: 204 });
}

/**
 * Server-side read of section start anchors from attempt_events. SERVER ONLY.
 *
 * Each section's anchor is the EARLIEST section_start event for that level (the
 * server `at` timestamp). Using the earliest means reloading the page can't push
 * the anchor forward to buy more time.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Map of lbe_level → section-start epoch ms (earliest recorded). */
export async function getSectionAnchors(
  svc: SupabaseClient,
  attemptId: string,
): Promise<Map<number, number>> {
  const { data } = await svc
    .from("attempt_events")
    .select("payload, at")
    .eq("attempt_id", attemptId)
    .eq("type", "section_start")
    .order("at", { ascending: true });

  const anchors = new Map<number, number>();
  for (const e of data ?? []) {
    const level = Number((e.payload as { section?: unknown } | null)?.section);
    if (!Number.isFinite(level) || anchors.has(level)) continue;
    anchors.set(level, new Date(e.at as string).getTime());
  }
  return anchors;
}

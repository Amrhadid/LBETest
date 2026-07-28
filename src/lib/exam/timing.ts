/**
 * Server-anchored exam timing — pure and testable.
 *
 * Section time limits are enforced against a server-recorded anchor (the
 * section_start event's server timestamp), NOT a client countdown that resets
 * on reload. A candidate who closes the tab and returns has the real elapsed
 * time counted against them.
 */

/** Seconds left in a section given its server anchor. Clamped to >= 0. */
export function remainingSeconds(
  anchorMs: number | undefined | null,
  sectionSeconds: number,
  nowMs: number,
): number {
  if (anchorMs == null || !Number.isFinite(anchorMs)) return sectionSeconds;
  return Math.max(0, Math.round(sectionSeconds - (nowMs - anchorMs) / 1000));
}

/** Has a section's time run out? */
export function isSectionExpired(
  anchorMs: number | undefined | null,
  sectionSeconds: number,
  nowMs: number,
): boolean {
  if (anchorMs == null || !Number.isFinite(anchorMs)) return false;
  return (nowMs - anchorMs) / 1000 >= sectionSeconds;
}

/** Buffer beyond the summed section budget before the whole attempt is void. */
export const ATTEMPT_IDLE_BUFFER_SECONDS = 60 * 60; // 1 hour

export function attemptHardCapSeconds(
  sectionCount: number,
  sectionSeconds: number,
): number {
  return sectionCount * sectionSeconds + ATTEMPT_IDLE_BUFFER_SECONDS;
}

/** Has the whole attempt exceeded its total wall-clock cap since it started? */
export function attemptExpired(
  startedAtMs: number | undefined | null,
  sectionCount: number,
  sectionSeconds: number,
  nowMs: number,
): boolean {
  if (startedAtMs == null || !Number.isFinite(startedAtMs)) return false;
  return (
    (nowMs - startedAtMs) / 1000 >=
    attemptHardCapSeconds(sectionCount, sectionSeconds)
  );
}

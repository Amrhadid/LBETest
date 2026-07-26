import { cn } from "@/lib/utils";
import type { LbeLevel } from "@/lib/exam/types";

/**
 * Gold pill showing e.g. "Section 3 (LBE 3)". Sections map 1:1 to LBE levels.
 */
export function SectionBadge({
  level,
  className,
}: {
  level: LbeLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-charcoal",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full bg-gold"
      />
      Section {level}
      <span className="font-normal normal-case text-muted-foreground">
        (LBE {level})
      </span>
    </span>
  );
}

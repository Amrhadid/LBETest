import { BadgeCheck, Clock, Headphones, Volume2 } from "lucide-react";

/**
 * Decorative, non-interactive mock of the exam screen shown in the hero.
 * Purely presentational — the real exam app plugs in later under /app.
 */
export function ExamMock() {
  const options = [
    { key: "A", text: "Confirm the agenda before the call", active: false },
    { key: "B", text: "Circulate minutes within 24 hours", active: true },
    { key: "C", text: "Forward the deck to all attendees", active: false },
    { key: "D", text: "Schedule a follow-up next quarter", active: false },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Floating level badge */}
      <div className="absolute -left-3 -top-4 z-20 sm:-left-6 animate-float">
        <div className="flex items-center gap-2 rounded-2xl border border-teal/30 bg-card px-3.5 py-2.5 shadow-lift">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal/12 text-teal">
            <BadgeCheck className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg font-bold tabular-nums text-foreground">
              B2
            </span>
            <span className="block text-xs font-medium text-muted-foreground">
              Professional
            </span>
          </span>
        </div>
      </div>

      {/* Floating score chip */}
      <div className="absolute -bottom-5 -right-3 z-20 sm:-right-6 animate-float [animation-delay:1.5s]">
        <div className="rounded-2xl border border-border bg-card px-4 py-2.5 shadow-lift">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Overall score
          </span>
          <span className="font-heading text-xl font-bold tabular-nums text-primary-mid">
            176<span className="text-sm text-muted-foreground">/200</span>
          </span>
        </div>
      </div>

      {/* Exam window */}
      <div className="relative overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-lift">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-border bg-[rgb(var(--surface))] px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-error/70" />
            <span className="size-2.5 rounded-full bg-warning/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground shadow-sm">
            <Clock className="size-3.5 text-primary-mid" />
            18:42
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="size-3.5" /> Listening
              </span>
              <span className="tabular-nums">Question 12 / 20</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-mid to-teal"
                style={{ width: "60%" }}
              />
            </div>
          </div>

          {/* Audio prompt */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-[rgb(var(--surface))] px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-teal text-teal-foreground shadow-teal-glow">
              <Volume2 className="size-5" />
            </span>
            <div className="flex-1">
              <div className="flex items-end gap-0.5" aria-hidden>
                {[6, 12, 9, 16, 11, 18, 8, 14, 10, 6, 13, 9, 15, 7].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-primary-mid/40"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              0:24
            </span>
          </div>

          {/* Question */}
          <p className="text-sm font-semibold leading-snug text-foreground">
            After the client meeting, what does the manager ask the team to do
            first?
          </p>

          {/* Options */}
          <ul className="space-y-2.5">
            {options.map((o) => (
              <li
                key={o.key}
                className={[
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors",
                  o.active
                    ? "border-teal bg-teal/8 text-foreground shadow-teal-glow"
                    : "border-border bg-background text-muted-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    o.active
                      ? "bg-teal text-teal-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {o.key}
                </span>
                {o.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

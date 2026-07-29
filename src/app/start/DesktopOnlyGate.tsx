"use client";

import * as React from "react";
import { Monitor } from "lucide-react";

/**
 * The exam may only be taken on a desktop/laptop. Phones and tablets are
 * blocked with a friendly notice. Detection combines viewport width with the
 * primary pointer type so touch laptops (fine pointer + hover) are still
 * allowed, while phones and tablets (coarse pointer, no hover) are not.
 */
function computeIsDesktop(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  const wideEnough = window.matchMedia("(min-width: 1024px)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  return wideEnough && finePointer && canHover;
}

export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  // `null` until mounted so we don't flash the wrong state during hydration.
  const [isDesktop, setIsDesktop] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const update = () => setIsDesktop(computeIsDesktop());
    update();
    const queries = [
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(pointer: fine)"),
      window.matchMedia("(hover: hover)"),
    ];
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  // Before mount we render nothing to avoid a hydration mismatch / flash.
  if (isDesktop === null) return null;

  if (!isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-gold/25 bg-card p-8 shadow-card">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/8 text-gold">
            <Monitor className="size-7" strokeWidth={1.5} />
          </span>
          <h1 className="font-serif-display mt-5 text-2xl text-charcoal">
            Please switch to a desktop
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The Locrativ Business English Test can only be taken on a desktop or
            laptop computer. Phones and tablets aren&rsquo;t supported for the
            exam. Please open this page on a desktop to continue.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

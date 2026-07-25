import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/Logo";

/*
 * Physical-document visual of an LBE certificate for the hero.
 *
 * TODO(asset): when the real A4 portrait certificate asset is supplied, drop
 * it into /public (e.g. /public/certificate.png) and render it as an <img>
 * inside the same 210:297 frame below — do NOT distort it. This CSS/SVG
 * rendition is a faithful stand-in that keeps the exact A4 ratio and adds no
 * asset weight. The sample holder details are illustrative only.
 */
export function Certificate({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[360px]", className)}>
      {/* Secondary backing sheet */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-4 rotate-[3deg] rounded-[14px] border border-gold/20 bg-card shadow-card"
      />
      <div
        aria-hidden
        className="absolute inset-0 translate-x-1.5 translate-y-2 rotate-[1.5deg] rounded-[14px] border border-gold/20 bg-card shadow-card"
      />

      {/* Main A4 sheet — locked to the 210:297 portrait ratio */}
      <div className="relative aspect-[210/297] w-full overflow-hidden rounded-[14px] border border-gold/30 bg-card shadow-paper">
        {/* Guilloché security frame */}
        <div className="pattern-guilloche absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="absolute inset-[10px] rounded-[8px] border border-gold/30"
        />
        <div
          aria-hidden
          className="absolute inset-[14px] rounded-[6px] border border-gold/15"
        />

        <div className="relative flex h-full flex-col items-center px-[8%] py-[7%] text-center">
          {/* Masthead */}
          <LogoMark className="h-9 w-9" />
          <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-charcoal">
            Locrativ
          </p>
          <p className="mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Certificate of Business English
          </p>

          <div className="rule-gold my-[6%] w-2/3" />

          {/* Holder */}
          <p className="text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
            This certifies that
          </p>
          <p className="font-serif-display mt-1 text-xl leading-tight text-charcoal">
            Sarah Whitfield
          </p>
          <p className="mt-2 text-[0.55rem] leading-relaxed text-muted-foreground">
            has completed the Locrativ Business English Test
          </p>

          {/* Qualification */}
          <div className="mt-[7%] flex flex-col items-center">
            <span className="font-serif-display text-[2.6rem] leading-none text-gold">
              LBE3
            </span>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/8 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-gold">
              <BadgeCheck className="size-3" />
              Qualified
            </span>
          </div>

          <div className="mt-auto w-full">
            <div className="rule-gold mb-[6%] w-full" />
            <div className="flex items-end justify-between text-left">
              <div>
                <p className="text-[0.45rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Certificate ID
                </p>
                <p className="text-[0.58rem] font-semibold tabular-nums text-charcoal">
                  LBE-2026-000184
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.45rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Issued
                </p>
                <p className="text-[0.58rem] font-semibold tabular-nums text-charcoal">
                  12 Mar 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified seal */}
      <div className="absolute -bottom-4 -right-3 sm:-right-5">
        <div className="flex size-[68px] flex-col items-center justify-center rounded-full border-2 border-gold/60 bg-card text-gold shadow-card">
          <BadgeCheck className="size-6" />
          <span className="mt-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em]">
            Verified
          </span>
        </div>
      </div>
    </div>
  );
}

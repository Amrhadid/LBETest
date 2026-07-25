import * as React from "react";

import { cn } from "@/lib/utils";

/*
 * TODO(asset): swap this inline mark for the official Locrativ gold "L" logo
 * once the supplied asset is added to /public (e.g. /public/locrativ-logo.svg).
 * Kept as inline SVG for now so the mark stays crisp and adds no asset weight.
 */
export function LogoMark({
  className,
  title = "Locrativ",
  ...props
}: React.SVGProps<SVGSVGElement> & { title?: string }) {
  const id = React.useId();
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("h-11 w-11", className)}
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(214 162 66)" />
          <stop offset="100%" stopColor="rgb(184 126 22)" />
        </linearGradient>
      </defs>
      {/* Gold seal */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${id}-g)`} />
      <rect
        x="2.75"
        y="2.75"
        width="42.5"
        height="42.5"
        rx="11.25"
        fill="none"
        stroke="rgb(255 255 255 / 0.35)"
        strokeWidth="1"
      />
      {/* Serif "L" */}
      <path
        d="M18 13.5 h6.4 v17.6 h9.6 v5.4 H18 Z"
        fill="rgb(251 248 241)"
      />
    </svg>
  );
}

export function Logo({
  className,
  subtitle = true,
  tone = "light",
}: {
  className?: string;
  subtitle?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className="h-10 w-10" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-sans text-[1.05rem] font-bold tracking-[0.14em]",
            tone === "dark" ? "text-white" : "text-charcoal",
          )}
        >
          LOCRATIV
        </span>
        {subtitle && (
          <span
            className={cn(
              "mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em]",
              tone === "dark" ? "text-gold-soft" : "text-gold",
            )}
          >
            Business English Test
          </span>
        )}
      </span>
    </span>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * LBET seal: a rounded-square badge whose checkmark doubles as an ascending
 * bar chart — signalling both "verified" and "measured progress".
 * Pure inline SVG (no external asset) so it stays crisp and edge-friendly.
 */
export function LogoMark({
  className,
  title = "LBET",
  ...props
}: React.SVGProps<SVGSVGElement> & { title?: string }) {
  const gradientId = React.useId();
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("h-9 w-9", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(30 90 168)" />
          <stop offset="100%" stopColor="rgb(18 179 166)" />
        </linearGradient>
      </defs>

      {/* Rounded-square seal */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${gradientId})`} />

      {/* Ascending bars — the two shorter steps that lead the check up */}
      <rect x="13" y="27" width="5.2" height="8" rx="2.6" fill="rgb(255 255 255 / 0.55)" />
      <rect x="21" y="22" width="5.2" height="13" rx="2.6" fill="rgb(255 255 255 / 0.78)" />

      {/* Checkmark whose rising stroke is the tallest bar */}
      <path
        d="M14.5 25.5 L21 32 L34.5 15"
        fill="none"
        stroke="white"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            LBET
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Locrativ
          </span>
        </span>
      )}
    </span>
  );
}

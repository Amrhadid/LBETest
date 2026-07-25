import * as React from "react";

import { cn } from "@/lib/utils";
import { AssetImage } from "@/components/AssetImage";

/** Public path for the supplied Locrativ logo asset (case-sensitive). */
const LOGO_SRC = "/Logo.png";

/**
 * Inline fallback: a glossy gold rounded square with an ivory serif "L" and a
 * fine gold keyline, matching the supplied brand mark. Used when the real
 * /public/locrativ-logo.png asset is not present.
 */
function LSealSvg({ className, title }: { className?: string; title: string }) {
  const id = React.useId();
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EBC974" />
          <stop offset="52%" stopColor="#D3A23F" />
          <stop offset="100%" stopColor="#B27C18" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="94" height="94" rx="26" fill={`url(#${id}-gold)`} />
      <rect x="3" y="3" width="94" height="94" rx="26" fill={`url(#${id}-sheen)`} />
      <rect
        x="3.9"
        y="3.9"
        width="92.2"
        height="92.2"
        rx="25.2"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.32"
        strokeWidth="1.2"
      />
      <text
        x="50"
        y="53"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', 'Cormorant Garamond', serif"
        fontSize="64"
        fontWeight="600"
        fill="#FBF8F1"
        stroke="#9C6E14"
        strokeWidth="0.7"
        paintOrder="stroke"
      >
        L
      </text>
    </svg>
  );
}

export function LogoMark({
  className,
  title = "Locrativ",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <AssetImage
      src={LOGO_SRC}
      alt={title}
      className={cn("h-11 w-11 object-contain", className)}
      fallback={<LSealSvg className={cn("h-11 w-11", className)} title={title} />}
    />
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

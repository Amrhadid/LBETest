import * as React from "react";

/**
 * Neutral placeholder wordmark logo (a small glyph + company name) so the
 * social-proof row has real shapes without shipping any third-party brand.
 */
export function PlaceholderLogo({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight ${className ?? ""}`}
      aria-label={name}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6 shrink-0"
        fill="none"
        aria-hidden
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M7 15.5L11 8.5L13 12.5L15 9.5L17 15.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {name}
    </span>
  );
}

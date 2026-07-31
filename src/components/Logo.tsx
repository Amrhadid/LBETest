import * as React from "react";

import { AssetImage } from "@/components/AssetImage";
import { cn } from "@/lib/utils";

/**
 * The official LBE Test wordmark (black "LBE" + gold "TEST" pill + the
 * "Business English Test" subtitle), supplied as a single transparent PNG.
 * It replaces the previous icon-plus-"LOCRATIV" lockup. Rendered by height so
 * it scales cleanly; the artwork carries its own subtitle, so `subtitle`/`tone`
 * are accepted for call-site compatibility but no longer affect the mark.
 */
export function Logo({
  className,
  title = "LBE Test — Business English Test",
}: {
  className?: string;
  subtitle?: boolean;
  tone?: "light" | "dark";
  title?: string;
}) {
  return (
    <AssetImage
      src="/LBELogo.png"
      alt={title}
      width={4000}
      height={1250}
      className={cn("h-12 w-auto object-contain", className)}
      fallbackClassName="h-12 w-40 rounded"
    />
  );
}

/** The LBE wordmark for compact spots. */
export function LogoMark({
  className,
  title = "LBE Test",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <AssetImage
      src="/LBELogo.png"
      alt={title}
      width={4000}
      height={1250}
      className={cn("h-11 w-auto object-contain", className)}
      fallbackClassName={cn("h-11 w-11 rounded-xl", className)}
    />
  );
}

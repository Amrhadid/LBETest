import * as React from "react";

import { AssetImage } from "@/components/AssetImage";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  title = "Locrativ",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <AssetImage
      src="/Logo.png"
      alt={title}
      width={1024}
      height={1024}
      className={cn("h-11 w-11 rounded-[22%] object-contain", className)}
      fallbackClassName={cn("h-11 w-11 rounded-xl", className)}
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

import * as React from "react";

import { cn } from "@/lib/utils";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
  /** Alternating white surface for visual rhythm on the ivory background. */
  surface?: "ivory" | "white";
  containerClassName?: string;
};

/** Consistent vertical rhythm + centered container for every homepage band. */
export function Section({
  as: Tag = "section",
  surface = "ivory",
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden border-t border-gold/15 py-20 sm:py-24 lg:py-28",
        surface === "white" && "bg-card",
        className,
      )}
      {...props}
    >
      <div aria-hidden className="pattern-guilloche pointer-events-none absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_28%,transparent_72%,black)]" />
      <div className={cn("container relative mx-auto", containerClassName)}>{children}</div>
    </Tag>
  );
}

/** Eyebrow + serif heading + optional lede block. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <div className="mx-auto max-w-xs ornament-rule">
          <p className={cn("eyebrow shrink-0", tone === "dark" && "text-gold-soft")}>{eyebrow}</p>
        </div>
      )}
      <h2
        className={cn(
          "font-serif-display mt-5 text-4xl leading-[1.02] sm:text-5xl lg:text-[3.5rem]",
          tone === "dark" ? "text-white" : "text-charcoal",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
            tone === "dark" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

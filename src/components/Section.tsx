import * as React from "react";

import { cn } from "@/lib/utils";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
  /** Alternating light surface tint for visual rhythm between sections. */
  muted?: boolean;
  containerClassName?: string;
};

/** Consistent vertical rhythm + centered container for every homepage band. */
export function Section({
  as: Tag = "section",
  muted = false,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <Tag
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        muted && "bg-[rgb(var(--surface))]",
        className,
      )}
      {...props}
    >
      <div className={cn("container mx-auto", containerClassName)}>{children}</div>
    </Tag>
  );
}

/** Eyebrow + heading + optional lede block, centered or left-aligned. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
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
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-teal">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

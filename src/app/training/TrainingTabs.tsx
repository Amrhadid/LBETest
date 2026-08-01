"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Course", href: "/training/course" },
  { label: "Material", href: "/training/material" },
];

export function TrainingTabs() {
  const pathname = usePathname();
  return (
    <div
      role="tablist"
      aria-label="Training"
      className="mb-8 inline-flex gap-1 rounded-xl border border-gold/25 bg-muted/60 p-1"
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              active
                ? "bg-card text-charcoal shadow-card"
                : "text-muted-foreground hover:text-charcoal",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

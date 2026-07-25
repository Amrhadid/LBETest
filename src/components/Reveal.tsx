"use client";

import * as React from "react";

type RevealTag = "div" | "li" | "span" | "section" | "ul" | "ol";

/**
 * Reveals its children with a gentle fade + rise the first time they scroll
 * into view (IntersectionObserver). Purely opacity/transform, so it never
 * shifts layout. The hidden state is gated behind `html.has-js` in globals.css,
 * so content is always visible without JS, for crawlers, and under
 * `prefers-reduced-motion`. Pass `delay` (ms) to stagger siblings.
 */
export function Reveal({
  as = "div",
  delay = 0,
  once = true,
  className,
  children,
}: {
  as?: RevealTag;
  delay?: number;
  once?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal=""
      data-inview={inView ? "" : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

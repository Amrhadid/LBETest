"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { primaryNav, routes } from "@/lib/site";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        scrolled
          ? "border-gold/30 bg-background/90 shadow-[0_8px_30px_-22px_rgb(29_29_31/.4)] backdrop-blur supports-[backdrop-filter]:bg-background/75"
          : "border-transparent bg-background/0",
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Locrativ home"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group relative rounded-md px-3 py-2 text-sm font-medium text-charcoal/80 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Button asChild variant="gold" size="sm">
            <Link href={routes.book}>Book a Test</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.myProfile}>My Profile</Link>
          </Button>
        </div>

        {/* Mobile: keep Book a Test prominent + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild variant="gold" size="sm">
            <Link href={routes.book}>Book a Test</Link>
          </Button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 text-charcoal transition-colors hover:bg-gold/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={cn(
            "absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-background shadow-lift transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-20 items-center justify-between border-b border-gold/20 px-5">
            <Logo />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 text-charcoal transition-colors hover:bg-gold/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-charcoal transition-colors hover:bg-gold/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3 border-t border-gold/20 p-5">
            <Button asChild variant="gold" className="w-full">
              <Link href={routes.book} onClick={() => setOpen(false)}>
                Book a Test
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={routes.myProfile} onClick={() => setOpen(false)}>
                My Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

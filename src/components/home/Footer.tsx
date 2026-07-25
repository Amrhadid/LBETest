import Link from "next/link";

import { Logo } from "@/components/Logo";
import { footerNav, siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-gold/25 bg-card">
      <div className="container mx-auto py-14">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_2.5fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {siteConfig.fullName} — an official online exam with instant
              scoring and verifiable certificates.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {footerNav.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-charcoal">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        // Intentional non-navigation placeholder for a page
                        // that doesn't exist yet (TODO in site.ts).
                        <span className="cursor-default text-sm text-muted-foreground/70">
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 border-t border-gold/20 pt-6">
          <p className="text-sm text-muted-foreground">
            © 2026 Locrativ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

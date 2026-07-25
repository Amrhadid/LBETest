import Link from "next/link";
import { Globe } from "lucide-react";

import { Logo } from "@/components/Logo";
import { footerNav, siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[rgb(var(--surface))]">
      <div className="container mx-auto py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {siteConfig.fullName} — an online Business English exam with
              instant scoring and verifiable certificates.
            </p>

            {/* Language switcher placeholder */}
            <div className="mt-6">
              <label
                htmlFor="lang"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Language
              </label>
              <div className="relative inline-block">
                <Globe
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  id="lang"
                  defaultValue="en"
                  className="h-10 appearance-none rounded-full border border-border bg-background pl-9 pr-9 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="zh">中文</option>
                </select>
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  ▾
                </span>
              </div>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {footerNav.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-foreground">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {2026} Locrativ. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="#" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="#" className="transition-colors hover:text-foreground">
                Terms
              </Link>
            </li>
            <li>
              <Link href="#" className="transition-colors hover:text-foreground">
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

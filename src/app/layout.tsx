import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";

import "./globals.css";
import { siteConfig } from "@/lib/site";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${siteConfig.domain}`),
  title: {
    default:
      "Locrativ Business English Test — Prove your Business English, officially",
    template: "%s · Locrativ",
  },
  description: siteConfig.description,
  keywords: [
    "Business English test",
    "Business English certificate",
    "LBE",
    "LBE3 Qualified",
    "Locrativ",
    "workplace English exam",
    "verify certificate",
  ],
  openGraph: {
    title: "Locrativ Business English Test",
    description: siteConfig.description,
    url: `https://${siteConfig.domain}`,
    siteName: siteConfig.fullName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Locrativ Business English Test",
    description: siteConfig.description,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF8F1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans text-foreground">
        {/* Gate scroll-reveal hidden states on JS so content is never hidden
            without it (crawlers, no-JS). Runs before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('has-js')",
          }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

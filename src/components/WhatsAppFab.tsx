"use client";

import { usePathname } from "next/navigation";

/**
 * Floating ("flying") WhatsApp contact button in Locrativ gold. Opens a chat to
 * the sales number with a prefilled purchase message. Hidden during the exam
 * (/start) and admin area so it never distracts a candidate mid-attempt or
 * clutters the dashboard.
 */
const PHONE = "201097965058"; // +20 109 796 5058, wa.me format (no +)
const MESSAGE = "I need to purchase LBE Test";

export function WhatsAppFab() {
  const pathname = usePathname();
  if (pathname?.startsWith("/start") || pathname?.startsWith("/admin")) {
    return null;
  }

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp to purchase the LBE Test"
      className="group fixed bottom-5 right-5 z-[90] flex size-14 items-center justify-center rounded-full text-white shadow-lg ring-1 ring-white/30 transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none motion-safe:animate-[wa-float_3s_ease-in-out_infinite]"
      style={{
        background:
          "radial-gradient(circle at 30% 25%, #E0B260 0%, #C68A1E 55%, #A9741A 100%)",
        boxShadow: "0 8px 22px rgba(198,138,30,0.45)",
      }}
    >
      {/* WhatsApp glyph */}
      <svg viewBox="0 0 32 32" className="size-8" fill="currentColor" aria-hidden="true">
        <path d="M16.02 3.2c-7.06 0-12.8 5.73-12.8 12.79 0 2.25.59 4.45 1.72 6.39L3.2 28.8l6.6-1.72a12.8 12.8 0 0 0 6.21 1.59h.01c7.06 0 12.8-5.73 12.8-12.79 0-3.42-1.33-6.63-3.75-9.05a12.71 12.71 0 0 0-9.05-3.63zm0 23.28h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.63 10.63 0 0 1-1.63-5.66c0-5.87 4.78-10.65 10.66-10.65 2.85 0 5.52 1.11 7.53 3.12a10.58 10.58 0 0 1 3.12 7.54c0 5.87-4.78 10.63-10.66 10.63zm5.85-7.98c-.32-.16-1.9-.94-2.19-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55l-.62-.01c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.25 3.44 5.45 4.82.76.33 1.35.53 1.82.68.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
}

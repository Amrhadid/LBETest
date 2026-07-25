import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware: refresh the Supabase session on every matched request and
 * gate protected routes. See `src/lib/supabase/middleware.ts`.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image files:
     * - _next/static, _next/image
     * - favicon and common static assets (svg/png/jpg/…)
     * Always run for API/auth callback routes so the session stays fresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
